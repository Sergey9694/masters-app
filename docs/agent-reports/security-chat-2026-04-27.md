# Security Audit — Chat Module (Phase 7)

**Date:** 2026-04-27
**Agent:** security-agent
**Scope:** `apps/web/src/shared/lib/crypto.ts`, `socket-handlers.ts`, `features/chat/api/*`, `services/chat.service.ts`, `app/api/v1/conversations/**`

---

## CRITICAL Issues (block merge)

### CRIT-1: `typing:start` / `typing:stop` — no room membership check
**File:** `apps/web/src/shared/lib/socket-handlers.ts`, lines 144–158

Any authenticated user can emit `typing:start` with an arbitrary `conversationId` and the server blindly broadcasts to `conv:<id>` **without verifying that the sender is a participant of that conversation**. This leaks the presence of a user (a 3rd party's conversation receives a typing indicator from a stranger) and can be used to probe which conversations exist.

```ts
socket.on("typing:start", (conversationId) => {
  // No participant check here!
  socket.to(`conv:${conversationId}`).emit("typing:start", { ... });
});
```

**Fix:** Before broadcasting, check `db.conversationParticipant.findFirst({ where: { conversationId, userId } })` — same pattern used in `join:conversation`.

---

### CRIT-2: `join:conversation` input is not validated (no UUID check)
**File:** `apps/web/src/shared/lib/socket-handlers.ts`, line 114

`conversationId` received from the socket client is used directly in a Prisma query without any format validation. While Prisma ORM prevents SQL injection, a malformed value (empty string, very long string, or a specially crafted value) causes uncontrolled DB errors that propagate up the stack and may expose internal error messages.

```ts
socket.on("join:conversation", async (conversationId) => {
  // conversationId is used as-is — no z.string().uuid() validation
  const isParticipant = await db.conversationParticipant.findFirst({
    where: { conversationId, userId },
  });
```

**Fix:** Validate with `z.string().uuid().safeParse(conversationId)` and reject immediately if invalid.

---

### CRIT-3: REST API `POST /api/v1/conversations/[id]/messages` — no rate limiting
**File:** `apps/web/src/app/api/v1/conversations/[id]/messages/route.ts`, lines 41–77

The REST API POST endpoint (used by mobile clients) has **no rate limiting**. The Server Action `sendMessageAction` has a 30 msg/60 s limit (line 18–26 of `send-message.ts`), but the REST endpoint calls `chatService.sendMessage()` directly without any rate check. An attacker with a valid session can flood the database via this endpoint.

**Fix:** Apply `checkRateLimit` in the REST POST handler with the same key `chat:send:${session.userId}` and limit.

---

### CRIT-4: `blockUserChat` / `unblockUserChat` — no existence check on target userId
**File:** `apps/web/src/features/chat/api/admin-actions.ts`, lines 14–26; `apps/web/src/services/chat.service.ts`, lines 251–257

Admin can call `blockUserChatAction` with any arbitrary UUID. If the UUID does not correspond to a real user, Prisma's `db.user.update()` throws a `P2025` record-not-found error. This error propagates as a raw Prisma error message through `adminActionClient`'s `handleServerError`, potentially leaking ORM internals.

```ts
async blockUserChat(userId: string): Promise<void> {
  // No existence check — throws raw Prisma P2025 if user doesn't exist
  await db.user.update({ where: { id: userId }, data: { chatBlockedAt: new Date() } });
}
```

Also: `z.object({ userId: z.string() })` in admin-actions.ts (line 15) does not validate UUID format — should be `z.string().uuid()`.

**Fix:** Add `z.string().uuid()` in the schema. Add an explicit `findUnique` check in the service and return a clean 404 error.

---

## HIGH Priority (fix before merge)

### HIGH-1: Verbose logging leaks cookie names and user identity in production
**File:** `apps/web/src/shared/lib/socket-handlers.ts`, lines 66, 76, 94, 105, 115, 129

Multiple `console.log` / `console.warn` statements print cookie names, authenticated user names/IDs, and room-join decisions to stdout. In production these go to server logs potentially accessible by ops tooling. User PII (firstName, userId) should not appear in plain-text logs.

Examples:
- Line 66: `console.warn("[Socket Auth] No valid session found in cookies:", Object.keys(cookies))` — prints all cookie names
- Line 76: `console.log([Socket Auth] Authenticated user ${user.firstName} (${userId}) via ${authSource})` — PII in logs
- Lines 105, 115, 129: userId and userName printed on every connect/join

**Fix:** Remove or wrap behind `process.env.NODE_ENV === "development"` guard. Use structured logging (pino/winston) with PII redaction in production.

### HIGH-2: `exportConversation` returns decrypted plaintext messages over the wire
**File:** `apps/web/src/features/chat/api/admin-actions.ts`, line 31–32; `apps/web/src/services/chat.service.ts`, lines 285–296

`exportConversationAction` returns decrypted message text as a plain CSV string in the Server Action response:
```ts
return { csv: buffer.toString("utf8") };
```
This means decrypted conversation content is serialized into the Server Action JSON response and travels to the admin browser. While HTTPS protects transit, the full plaintext also ends up in the browser's memory and potentially in devtools network tab. For a platform handling private messages this is a data-minimization concern.

**Fix:** Stream the CSV as a file download via a dedicated `Response` with `Content-Disposition: attachment` instead of returning raw content in a Server Action.

### HIGH-3: `startConversationAction` — no rate limiting on conversation creation
**File:** `apps/web/src/features/chat/api/start-conversation.ts`

Creating a new conversation has no rate limit. A user can spam `startConversationAction` with arbitrary `targetUserId` UUIDs, creating thousands of conversation records. The only guard is that `targetUserId` must be a valid UUID format — but it is **not validated to be an existing user** in the DB. Non-existent target UUIDs create orphaned `ConversationParticipant` records pointing to non-existent users.

**Fix:** (a) Add rate limit (`chat:start:${ctx.userId}`, 5 per minute). (b) Validate that `targetUserId` exists in `db.user` before creating the conversation.

### HIGH-4: `deleteMessageAdminAction` schema uses `z.string()` instead of `z.string().uuid()`
**File:** `apps/web/src/features/chat/api/admin-actions.ts`, line 8

`z.object({ messageId: z.string() })` accepts any string. Should be `.uuid()` for consistency and to avoid accidental DB probing.

### HIGH-5: In-memory rate limiter is per-process — bypassed in multi-instance deployments
**File:** `apps/web/src/shared/lib/rate-limit.ts`

The rate-limit store is in Node.js process memory. In any horizontally scaled / multi-worker deployment (PM2 cluster, Kubernetes, Vercel edge) each process has its own counter. The effective limit is `30 * numInstances` per user per minute. The code comment acknowledges this ("в проде заменить на Redis") but it is not a TODO — it is a current security gap if the app runs multiple instances.

**Fix:** For production, replace with a Redis-backed implementation (`INCR` + `EXPIRE`).

---

## MEDIUM Priority (can fix after merge)

### MED-1: `getConversations` — `unreadCount` is a simplistic boolean approximation
**File:** `apps/web/src/services/chat.service.ts`, lines 93, 99

`unreadCount` is hardcoded to `1` or `0` (line 93: `const unread = last && ... ? 1 : 0`). This is not a security issue but is misleading: a user who receives 50 messages in one conversation will see `unreadCount: 1`. Not a blocker but worth fixing for correctness.

### MED-2: `getMessagesAdmin` has no pagination limit
**File:** `apps/web/src/services/chat.service.ts`, lines 220–235

`getMessagesAdmin` fetches **all** messages of a conversation with no `take` limit. A conversation with thousands of messages will cause a large memory allocation on the Node.js server. Should add server-side pagination.

### MED-3: `handleServerError` in `safe-action.ts` may expose raw error messages to client
**File:** `apps/web/src/shared/lib/safe-action.ts`, lines 9–13

```ts
handleServerError(e) {
  console.error("Action error:", e.message);
  return e.message || "Something went wrong, please try again.";
}
```

Returning `e.message` verbatim sends internal error messages (including Prisma error strings) to the client. Should map known error types to user-facing messages and use a generic fallback for unexpected errors.

### MED-4: `cursor` parameter in `getMessagesAction` is not validated as UUID
**File:** `apps/web/src/features/chat/api/get-messages.ts`, line 9

`cursor: z.string().optional()` — accepts any string. In the service, an invalid cursor triggers `db.message.findUnique({ where: { id: cursor } })` which safely returns null (no injection), but then throws `"Сообщение-курсор не найдено"` to the client. Should be `z.string().uuid().optional()` to fail early with a cleaner error.

### MED-5: REST API `POST /messages` — text length not validated
**File:** `apps/web/src/app/api/v1/conversations/[id]/messages/route.ts`, lines 56–67

The REST endpoint checks that `text` is a non-empty string but does **not** enforce a max length. The Server Action limits `text` to 4000 chars via Zod (`z.string().min(1).max(4000)`). A mobile client using the REST API can send arbitrarily long strings which will be encrypted and stored in full.

**Fix:** Add `if (text.length > 4000) return apiError("Message too long", 400);`.

---

## What was checked and is OK

- **crypto.ts**: IV is correctly 12 bytes (`randomBytes(12)`) — correct for AES-GCM. AuthTag is retrieved and stored. AuthTag is set on the decipher before decryption. `getKey()` is a proper lazy getter — `ENCRYPTION_KEY` is never read at module top-level scope. Key length is validated to be 32 bytes. No key material appears in error messages or logs.
- **safe-action.ts**: `authActionClient` correctly gates on `session.user`, checks `isBanned`. `adminActionClient` chains from `authActionClient` and checks `role === "ADMIN"`. No public client is used for authenticated actions.
- **send-message.ts**: Uses `authActionClient`. Zod schema present. Rate limiting applied (30/60s). `chatService.sendMessage` validates participant membership before writing.
- **admin-actions.ts**: All actions use `adminActionClient`. `deleteMessage` performs soft-delete (sets `deletedAt` + `deletedBy`), not physical deletion. Role is double-checked in the service layer (`chat.service.ts`, line 239–241 — defense in depth).
- **chat.service.ts — getMessages**: Validates participant membership before returning messages (line 112–115). No unauthorized data leakage.
- **REST API auth**: Both `GET` and `POST` call `getSessionFromRequest(request)` and return 401 on missing session.
- **REST API messages limit**: `limit` is capped at 100 via `Math.min(Number(...), 100)` (line 23 of messages route).
- **Prisma ORM**: Used throughout — SQL injection is structurally impossible.
- **XSS**: Message text is encrypted before storage, decrypted on the server, and returned as JSON data (not rendered as `dangerouslySetInnerHTML`). No HTML injection surface.
- **join:conversation**: Participant check is enforced before joining the socket room. ADMINs can join any room (expected).
- **chatBlockedAt**: Checked in `chatService.sendMessage` (line 152–153) before writing.

---

## Verdict: CANNOT MERGE

**Blockers (must fix before merge):**
1. CRIT-1 — `typing:start` / `typing:stop` miss participant check (presence leak + room probe)
2. CRIT-2 — `join:conversation` conversationId not validated (uncontrolled DB errors)
3. CRIT-3 — REST API `POST /messages` has no rate limiting (DoS via mobile API)
4. CRIT-4 — `blockUserChat` / `unblockUserChat` no existence check + weak Zod schema

Fix the 4 critical issues and HIGH-3 (conversation creation rate limit + target user existence check) before merging. The rest can be addressed in follow-up tickets.
