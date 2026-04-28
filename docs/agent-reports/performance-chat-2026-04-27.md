## Performance Audit — Chat (Phase 7)

Date: 2026-04-27
Branch: refactor/uslugi-ryadom (worktree phase7-chat)

---

### CRITICAL issues (N+1, missing indexes)

**1. `getUnreadCount` — N+1 per conversation (chat.service.ts:260-283)**

The function loads all `ConversationParticipant` rows for the user, and for each one Prisma issues a subquery to fetch `conversation.messages`. With N conversations this is N+1 DB round-trips. The comment in the code says "optimized query" — that is incorrect. The actual count query against the DB would be: `SELECT COUNT(*) FROM ConversationParticipant WHERE userId = ? AND (SELECT ...)`. Instead of N+1 the real solution is a single `COUNT` SQL query or an aggregate via Prisma. Current approach will degrade linearly as conversations grow.

**2. `getMessages` — sequential queries instead of single (chat.service.ts:112-143)**

For every paginated load there are 2-3 sequential DB hits:
- Line 112-115: `db.conversationParticipant.findFirst` (auth check)
- Line 118-122 (when cursor present): `db.message.findUnique` to resolve cursor to a `createdAt` date
- Line 124-132: `db.message.findMany` (actual data)

The cursor-to-date lookup (lines 118-122) is avoidable. Prisma natively supports cursor-based pagination via `cursor: { id }` + `skip: 1`. Using `db.message.findMany({ cursor: { id: cursor }, skip: 1, take: limit })` eliminates the extra round-trip entirely. The current approach issues 3 queries per "load more" action.

**3. `sendMessage` — 3 sequential queries before write (chat.service.ts:152-173)**

- Line 152-153: `db.user.findUnique` (chatBlockedAt check)
- Line 155-158: `db.conversationParticipant.findFirst` (access check)
- Line 160-167: `db.message.create`
- Line 170: `db.conversation.update` (updatedAt touch)

The `chatBlockedAt` check and participant check can be merged into a single query with `include`. The `conversation.update` for `updatedAt` is also redundant if `Message` creation triggers a relation update — but as Prisma does not auto-update parent `updatedAt`, this is a design choice. Combine the first two reads at minimum.

**4. Missing index on `Message.conversationId` alone**

`schema.prisma` line 376: `@@index([conversationId, createdAt])` — composite index exists and covers `ORDER BY createdAt DESC` with `WHERE conversationId = ?`. This is correct.

However `getUnreadCount` (line 269) queries `WHERE { deletedAt: null, senderId: { not: userId } }` — there is no index on `(conversationId, deletedAt, senderId)`. With large message volume per conversation this will do a full index scan on `[conversationId, createdAt]` and then filter. Not critical now but will become one at scale.

**5. `join:conversation` in socket-handlers.ts — DB query on every socket room join (lines 118-132)**

Every time a user opens a conversation the socket handler:
- Line 118-120: `db.user.findUnique` to get `role`
- Line 123-126: `db.conversationParticipant.findFirst` to check access

These two queries fire for every reconnect/page navigation. The user role was already resolved during the socket authentication middleware (`getUserFromCookie`, line 70-83) but was not saved to `socket.data`. Fix: store `role` in `socket.data` during middleware, eliminating the per-join DB call.

---

### HIGH priority

**6. `/admin/chats` — `take: 100` hardcoded ceiling, no real pagination (admin/chats/page.tsx:11-28)**

The query fetches up to 100 conversations with `include: { participants, messages }`. At 100 conversations with 2 participants each that is 100 + 200 + 100 = 400 DB rows minimum. No cursor/page controls in the UI. The service already has `getAllConversations` with proper `skip/take` pagination — the admin page bypasses it and queries `db` directly. At 1000+ conversations admins will see only the first 100 with no way to navigate.

**7. `getConversations` — fetches all conversations for user, no limit (chat.service.ts:54-104)**

`db.conversationParticipant.findMany({ where: { userId } })` has no `take` limit. A power user with 500 conversations will transfer and hydrate all 500 on every page load of `/chat`. The sidebar renders all of them at once (ConversationList is not virtualized). Should add `take: 50` + cursor pagination for the sidebar list.

**8. `getMessagesAdmin` — no pagination, loads all messages (chat.service.ts:220-236)**

`db.message.findMany({ where: { conversationId } })` with no `take` limit. A conversation with 10,000 messages will load all of them into memory and decrypt each one. Called also by `exportConversation` (line 286) which is acceptable for export, but the admin view endpoint needs pagination.

---

### MEDIUM priority

**9. `use-socket.ts` — singleton is module-level but reconnect logic is flawed (use-socket.ts:9-21)**

`_socket` is a module-level singleton — correct. However, when `userId` changes (line 29-35), the code calls `socket.disconnect()` then `socket.connect()`. Because `_socket` is shared across all components using `useSocket`, any other mounted component that holds a reference to the same socket object will experience the disconnect. This is a potential reliability issue in multi-panel layouts. The `'use client'` boundary is respected since the file has no server-side imports — this is fine.

**10. Cleanup in `ChatWindow.tsx` — `markAsReadAction` called on every new message (lines 84, 194)**

`markAsReadAction({ conversationId })` is called on `socket.on("new:message")` (line 84) AND on the initial join (line 55). Each call is a DB `UPDATE` on `ConversationParticipant`. If 10 messages arrive in rapid succession, 10 UPDATE queries are fired. Should debounce this call (e.g. 1-2 second debounce).

**11. `ChatWindow.tsx` — double scroll trigger (lines 148-150 and line 87)**

Two separate `useEffect` hooks scroll to bottom:
- Lines 148-150: fires on every change to `messages.length`
- Line 87: fires via `setTimeout` on every new socket message

This causes double smooth-scroll per received message. The `setTimeout(100ms)` in the socket handler will also cause a scroll race with Virtuoso's `followOutput="smooth"` which handles auto-scroll natively.

**12. `socket-emit.ts` — `data: any` type (line 17)**

Uses `any` which is forbidden per project rules (CLAUDE.md Part VIII). Not a perf issue but violates type safety.

**13. `new:message` event emitted twice per send (send-message.ts:36-58)**

When a message is sent, `new:message` is emitted to `conv:<conversationId>` room (all room members including sender) AND again to `user:<otherParticipantId>` (lines 36-43 and 49-57). If the other user is currently in the conversation room, they receive the event twice. The ChatWindow deduplication check on line 81 (`prev.some(m => m.id === message.id)`) prevents double-rendering, but the double network emission is wasteful and should be fixed at the server action level.

---

### What was checked and is OK

- **Indexes**: `@@index([conversationId, createdAt])` on `Message` covers the primary message query (WHERE + ORDER BY). `@@index([userId])` on `ConversationParticipant` covers `getConversations` user lookup. `@@index([orderId])` and `@@index([listingId])` on `Conversation` exist.
- **`getConversations` — no N+1**: The query uses deeply nested `include` in a single Prisma call. Prisma batches these into JOINs (or batched SELECT IN). Not N+1.
- **`getAllConversations` (admin service)**: Correct — uses `$transaction([findMany, count])` with `skip/take`. Proper server-side pagination in the service layer (the admin page bypasses it, see issue #6).
- **`force-dynamic`**: Both `/chat/page.tsx` (line 7) and `/chat/[id]/page.tsx` (line 8) correctly opt out of caching. Chat data must be fresh per request — this is correct.
- **Socket singleton**: `_socket` at module scope (line 9 in `use-socket.ts`) prevents re-creation on re-renders.
- **Listener cleanup**: All `socket.on(...)` calls in `ChatWindow.tsx` have corresponding `socket.off(...)` in the cleanup return (lines 140-145). No memory leak.
- **`new:message` payload size**: The event carries only `{ conversationId: string, message: MessageDTO }`. `MessageDTO` contains `{ id, text, attachments, senderId, sender: { id, firstName, avatar }, createdAt, deletedAt, deletedBy }`. No full conversation object is sent. Payload is lean.
- **socket.io-client bundle**: Loaded only in `'use client'` files (`use-socket.ts` line 1, `ChatWindow.tsx` line 1). Not in the server bundle.
- **Cursor-based pagination in `getMessages`**: Direction and logic are correct (`createdAt: { lt: cursorDate }` + `orderBy: desc` + `take: limit` + `reverse()`). The extra round-trip (issue #2) is a performance problem, but the algorithm itself is correct.
- **`ConversationParticipant` composite PK**: `@@id([conversationId, userId])` allows `markAsRead` to use the compound unique key (line 177: `conversationId_userId`) — zero-scan lookup.
- **`startConversation` idempotency**: Checks for existing conversation before creating (lines 32-41). Correct.
- **Encryption**: `encryptText`/`decryptText` called on server only (service layer). Not exposed to client bundle.

---

### Verdict: CANNOT merge yet

**Blockers before merge:**
1. `getUnreadCount` N+1 — rewrite as single aggregate SQL/Prisma query
2. `getMessages` extra cursor-resolution round-trip — switch to Prisma native cursor pagination
3. `/admin/chats` has no real pagination UI — hardcoded `take: 100` will hide conversations
4. `getConversations` has no limit — will break for users with many conversations
5. `join:conversation` fires 2 DB queries per reconnect — store role in `socket.data`
6. `new:message` emitted twice per send — remove redundant `user:` room emission or only emit to non-room users
