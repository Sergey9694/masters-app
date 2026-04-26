# Спецификация Фазы 7 — Чат и уведомления

> Дата: 2026-04-26  
> Статус: Утверждена  
> Реализация: 4 параллельных трека через субагентов

---

## 1. Контекст и цели

Фаза 7 добавляет real-time коммуникацию между клиентами и исполнителями внутри платформы. Чат привязан к контексту (заказ или объявление), что позволяет разрешать споры и модерировать переписку.

**Ключевые решения:**
- Redis + SSE (не WebSocket) — нативно в Next.js, масштабируется горизонтально
- PostgreSQL — единственное хранилище сообщений (Redis только транспорт)
- AES-256-GCM — шифрование поля `Message.text` на уровне приложения
- Чат открывается через заказ (после отклика) или через объявление (кнопка на странице)
- Полная модерация в админке: чтение, удаление, блокировка, экспорт

---

## 2. Схема данных (миграция: `add_chat`)

```prisma
model Conversation {
  id          String   @id @default(uuid())

  // Контекст — ровно одно из двух
  orderId     String?
  order       Order?          @relation(fields: [orderId], references: [id])
  listingId   String?
  listing     ServiceListing? @relation(fields: [listingId], references: [id])

  participants ConversationParticipant[]
  messages     Message[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([orderId])
  @@index([listingId])
}

model ConversationParticipant {
  conversationId String
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  userId         String
  user           User         @relation(fields: [userId], references: [id])

  lastReadAt     DateTime?

  @@id([conversationId, userId])
}

model Message {
  id             String       @id @default(uuid())
  conversationId String
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  senderId       String
  sender         User         @relation(fields: [senderId], references: [id])

  // Хранится зашифрованным: "iv:authTag:ciphertext" (AES-256-GCM)
  text           String
  attachments    String[]     @default([])

  // Soft-delete для модерации
  deletedAt      DateTime?
  deletedBy      String?      // userId администратора

  createdAt      DateTime     @default(now())

  @@index([conversationId, createdAt])
}

// Добавить в модель User:
// chatBlockedAt  DateTime?   // выставляется администратором
```

**Enum Notification — добавить значения:**
```prisma
NEW_MESSAGE
LISTING_APPROVED
LISTING_REJECTED
ACCOUNT_LINKED
```

---

## 3. Шифрование сообщений (AES-256-GCM)

**Файл:** `apps/web/src/shared/lib/crypto.ts`

```typescript
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";

function getKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) throw new Error("ENCRYPTION_KEY is not defined");
  return Buffer.from(key, "hex"); // 32 байта = 64 hex-символа
}

// Формат хранения: "iv:authTag:ciphertext" (всё в hex)
export function encryptText(text: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decryptText(stored: string): string {
  const [ivHex, authTagHex, encryptedHex] = stored.split(":");
  const decipher = createDecipheriv(
    ALGORITHM,
    getKey(),
    Buffer.from(ivHex, "hex")
  );
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));
  return (
    decipher.update(Buffer.from(encryptedHex, "hex")).toString("utf8") +
    decipher.final("utf8")
  );
}
```

**ENV:**
```env
ENCRYPTION_KEY=<64 hex символа, генерировать: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
```

**Правило:** шифрование/расшифровка происходит ТОЛЬКО в `chat.service.ts`. Нигде больше.

---

## 4. Real-time инфраструктура (Трек 1)

### 4.1 Redis singleton
**Файл:** `apps/web/src/shared/lib/redis.ts`

```typescript
import Redis from "ioredis";

declare global { var _redis: Redis | undefined; }

function getRedis(): Redis {
  if (!global._redis) {
    global._redis = new Redis(process.env.REDIS_URL!);
    global._redis.on("error", (e) => console.error("[REDIS]", e));
  }
  return global._redis;
}
export { getRedis };
```

### 4.2 Pub/Sub
**Файл:** `apps/web/src/shared/lib/pubsub.ts`

```typescript
export type RealtimeEvent =
  | { type: "NEW_ORDER"; orderId: string }
  | { type: "NEW_PROPOSAL"; orderId: string; proposalId: string }
  | { type: "NEW_MESSAGE"; conversationId: string }
  | { type: "NOTIFICATION"; notificationId: string }
  | { type: "ORDER_STATUS"; orderId: string; status: string };

export async function publish(channel: string, payload: RealtimeEvent): Promise<void> {
  try {
    await getRedis().publish(channel, JSON.stringify(payload));
  } catch (e) {
    console.error("[PUBSUB] publish error:", e); // не роняем приложение
  }
}
```

**Каналы:**
```
feed:orders                      — новый заказ в ленте
user:{id}:notifications          — личные уведомления
user:{id}:chat:{conversationId}  — новое сообщение в диалоге
order:{id}:proposals             — новый отклик (для владельца заказа)
```

### 4.3 SSE endpoint
**Файл:** `apps/web/src/app/api/events/route.ts`

- `GET /api/events?channels=user:X:notifications,user:X:chat:Y`
- Аутентификация через сессию из cookie (отклонять неавторизованных — 401)
- Каждое соединение создаёт **отдельный** Redis subscriber (не шарить!)
- Heartbeat каждые 25 сек (`data: ping\n\n`) — предотвращает разрыв через прокси
- При disconnect → subscriber.quit()
- Runtime: Node.js (не Edge — ioredis требует Node)

### 4.4 Клиентский хук
**Файл:** `apps/web/src/shared/hooks/use-realtime.ts`

```typescript
"use client";
export function useRealtime(channels: string[], onEvent?: (e: RealtimeEvent) => void) {
  const router = useRouter();
  useEffect(() => {
    const qs = channels.map(c => `channels=${encodeURIComponent(c)}`).join("&");
    const es = new EventSource(`/api/events?${qs}`);
    es.onmessage = (e) => {
      if (e.data === "ping") return;
      const event = JSON.parse(e.data) as RealtimeEvent;
      onEvent?.(event);
      router.refresh();
    };
    return () => es.close();
  }, [channels.join(",")]);
}
```

### 4.5 Интеграция publish() в существующие Server Actions

| Action | Канал | Событие |
|--------|-------|---------|
| `createOrderAction` | `feed:orders` | `NEW_ORDER` |
| `submitProposalAction` | `order:{id}:proposals`, `user:{clientId}:notifications` | `NEW_PROPOSAL`, `NOTIFICATION` |
| `acceptProposalAction` | `user:{providerId}:notifications` | `ORDER_STATUS` |
| `completeOrderAction` | `user:{providerId}:notifications` | `ORDER_STATUS` |
| `sendMessageAction` | `user:{recipientId}:chat:{convId}` | `NEW_MESSAGE` |

### 4.6 Docker
```yaml
# docker-compose.yml — добавить сервис:
redis:
  image: redis:7-alpine
  restart: unless-stopped
  ports:
    - "6379:6379"
```

---

## 5. Сервисный слой чата (Трек 2)

**Файл:** `apps/web/src/services/chat.service.ts`

```typescript
interface ChatService {
  // Найти существующий диалог или создать новый.
  // Уникальность: один диалог на пару (userId, targetUserId) в одном контексте.
  // Логика: findFirst({ where: { orderId/listingId, participants: { every: { userId: in [...] } } } })
  startConversation(userId: string, targetUserId: string, context: {
    orderId?: string;
    listingId?: string;
  }): Promise<Conversation>;

  // Список диалогов пользователя (с последним сообщением, счётчиком непрочитанных)
  getConversations(userId: string): Promise<ConversationPreview[]>;

  // Сообщения с курсорной пагинацией (cursor = последний messageId)
  getMessages(conversationId: string, userId: string, cursor?: string, limit?: number): Promise<Message[]>;

  // Отправка — шифрует text перед записью, публикует в Redis
  sendMessage(conversationId: string, userId: string, text: string, attachments?: string[]): Promise<Message>;

  // Отметить прочитанным (обновляет ConversationParticipant.lastReadAt)
  markAsRead(conversationId: string, userId: string): Promise<void>;

  // === Только для Admin ===
  getAllConversations(filters: { userId?: string; dateFrom?: Date; dateTo?: Date }, page: number): Promise<PaginatedResult<ConversationAdmin>>;
  getMessagesAdmin(conversationId: string): Promise<Message[]>; // без пагинации, расшифровывает
  deleteMessage(messageId: string, adminId: string): Promise<void>; // soft-delete
  blockUserChat(userId: string, adminId: string): Promise<void>; // chatBlockedAt = now()
  unblockUserChat(userId: string): Promise<void>;
  exportConversation(conversationId: string, format: "json" | "csv"): Promise<Buffer>;
}
```

**Server Actions** (`apps/web/src/features/chat/api/`):
- `start-conversation.ts` — создать/найти диалог
- `send-message.ts` — отправить (проверить chatBlockedAt!)
- `get-conversations.ts` — список диалогов
- `get-messages.ts` — история с пагинацией
- `mark-as-read.ts` — прочитано

**REST для mobile** (`apps/web/src/app/api/v1/conversations/`):
- `GET /` — список
- `POST /` — создать
- `GET /[id]/messages` — история
- `POST /[id]/messages` — отправить
- `POST /[id]/read` — прочитано

---

## 6. UI чата (Трек 3)

### 6.1 Страница `/chat`

**Desktop (two-panel layout):**
```
┌──────────────────────────────────────────────────┐
│  Сообщения                                        │
├─────────────────┬────────────────────────────────┤
│                 │                                 │
│  ConversationList│  ChatWindow                   │
│                 │                                 │
│  [Аватар] Имя   │  ── Заказ #123: Ремонт кран ──  │
│  Последнее...   │                                 │
│  ─────────────  │  [Аватар] Иван: Добрый день    │
│  [Аватар] Имя2  │                Привет! [вы]    │
│  непрочит: 2    │                                 │
│                 │  ┌────────────────────────────┐ │
│                 │  │ Написать...            📎  │ │
│                 │  └────────────────────────────┘ │
└─────────────────┴────────────────────────────────┘
```

**Mobile:** `/chat` — список, `/chat/[id]` — отдельная страница переписки.

### 6.2 Компоненты (`apps/web/src/features/chat/ui/`)

| Компонент | Описание |
|-----------|----------|
| `ConversationList.tsx` | Список диалогов, счётчик непрочитанных, useRealtime |
| `ChatWindow.tsx` | Окно переписки, оптимистичный update при отправке |
| `MessageBubble.tsx` | Сообщение (входящее/исходящее), deleted-state |
| `MessageInput.tsx` | Поле ввода + загрузка файлов (drag & drop) |
| `ChatEmpty.tsx` | Заглушка "Нет диалогов" / "Начните разговор" |
| `ConversationHeader.tsx` | Шапка: аватар, имя, контекст (ссылка на заказ/объявление) |

### 6.3 Точки входа в чат

**Страница объявления** `/listings/[slug]`:
```tsx
<Button onClick={() => startConversation({ listingId })}>
  Написать исполнителю
</Button>
```

**Страница заказа** (для исполнителя, после принятия отклика):
```tsx
<Button onClick={() => startConversation({ orderId })}>
  Написать клиенту
</Button>
```

### 6.4 Real-time в чате

```typescript
// В ChatWindow:
useRealtime([`user:${userId}:chat:${conversationId}`]);
// При NEW_MESSAGE → router.refresh() → сервер отдаёт актуальные сообщения

// Оптимистичный update для отправителя:
// Добавить сообщение в локальный state сразу, не ждать SSE
```

---

## 7. Уведомления (Трек 1 + 2)

### 7.1 NotificationBell
**Файл:** `apps/web/src/widgets/Header/ui/NotificationBell.tsx`

- Server Component подсчитывает непрочитанные
- Client wrapper: `useRealtime([user:{id}:notifications])` → `router.refresh()`
- Отображает: бейдж с числом на иконке колокольчика
- Клик → `/notifications` или Popover со списком

### 7.2 Email-уведомления (через существующий send-email.ts)

| Событие | Шаблон |
|---------|--------|
| `NEW_MESSAGE` | «Вам написал {имя}: {первые 50 символов}» |
| `NEW_PROPOSAL` | «Новый отклик на ваш заказ» |
| `ORDER_STATUS` | «Статус заказа изменился» |
| `LISTING_APPROVED` | «Ваше объявление опубликовано» |
| `LISTING_REJECTED` | «Ваше объявление отклонено» |

Настройки пользователя (когда появится страница настроек):
- Email-уведомления: on/off
- Telegram-уведомления: on/off (если привязан)

---

## 8. Админ-панель чатов (Трек 4)

### 8.1 Таблица `/admin/chats`

Колонки: Участники | Контекст (заказ/объявление) | Сообщений | Последнее | Дата создания

Фильтры:
- Поиск по email/имени пользователя
- Диапазон дат
- Наличие удалённых сообщений

Действия на строке:
- Просмотр переписки → `/admin/chats/[id]`

### 8.2 Страница диалога `/admin/chats/[id]`

- Все сообщения (расшифрованные), включая удалённые (с пометкой)
- Контекст: ссылка на заказ или объявление
- Участники: аватары, ссылки на профили
- Каждое сообщение: кнопка «Удалить» (soft-delete с подтверждением)

**Панель действий:**
```
[Заблокировать {Иван}]  [Заблокировать {Пётр}]  [Экспорт JSON]  [Экспорт CSV]
```

### 8.3 Логика блокировки

- `blockUserChat(userId)` → устанавливает `User.chatBlockedAt = now()`
- `sendMessage` Server Action → проверяет `chatBlockedAt`, возвращает ошибку
- В UI заблокированному показывается: «Ваши сообщения ограничены администратором»
- Разблокировка: `unblockUserChat(userId)` → сбрасывает в `null`

### 8.4 Экспорт переписки

```typescript
// JSON формат:
[
  {
    "id": "msg-uuid",
    "sender": "Иван Петров <ivan@example.com>",
    "text": "Расшифрованный текст",
    "sentAt": "2026-04-26T12:00:00Z",
    "deletedAt": null
  }
]

// CSV формат: id,sender,text,sentAt,deletedAt
```

Каждый просмотр `/admin/chats/[id]` и каждый экспорт → запись в `AuditLog`:
```
action: "ADMIN_VIEW_CHAT" | "ADMIN_EXPORT_CHAT"
targetId: conversationId
actorId: adminId
```

### 8.5 Навигация Admin

Добавить в `apps/web/src/app/admin/(protected)/layout.tsx`:
```typescript
{ href: "/admin/chats", icon: MessageSquare, label: "Чаты" }
```

---

## 9. Тестирование (Phase 8 foundation)

### 9.1 Unit тесты (Vitest)

```
apps/web/src/services/__tests__/chat.service.test.ts
  ✓ sendMessage шифрует текст перед записью в БД
  ✓ getMessages расшифровывает текст при чтении
  ✓ sendMessage заблокированного пользователя выбрасывает ошибку
  ✓ deleteMessage устанавливает deletedAt, не удаляет запись
  ✓ startConversation не создаёт дубли для одной пары в одном контексте

apps/web/src/shared/lib/__tests__/crypto.test.ts
  ✓ encrypt → decrypt возвращает исходный текст
  ✓ разные вызовы encrypt дают разные IV (уникальность)
  ✓ decrypt с неверным ключом выбрасывает ошибку
```

### 9.2 E2E (Playwright)

```
e2e/chat.spec.ts:
  ✓ Исполнитель открывает чат с объявления → отправляет сообщение
  ✓ Клиент видит сообщение в реальном времени (SSE)
  ✓ NotificationBell показывает счётчик непрочитанных
  ✓ Прочтение сообщения → счётчик обнуляется
```

### 9.3 Setup (если Vitest ещё не установлен)

```bash
cd apps/web
npm install -D vitest @vitest/coverage-v8 @testing-library/react jsdom
```

---

## 10. Порядок реализации — 4 параллельных трека

```
Старт ───────────────────────────────────────────────────────────────────▶

Трек 1 [Инфраструктура]  Redis → pubsub.ts → /api/events → useRealtime → publish() в actions
Трек 2 [Сервисный слой]  Миграция → crypto.ts → chat.service.ts → Server Actions → REST API
        │                     │
        └─────────────────────┘  (оба завершены)
                                      │
Трек 3 [UI чата]                  ConversationList → ChatWindow → MessageBubble → MessageInput → /chat page → точки входа
Трек 4 [Админ]                    /admin/chats → /admin/chats/[id] → блокировка → экспорт → AuditLog

        └─────────────────────┘  (3 и 4 параллельно)
```

**Зависимости:**
- Трек 3 требует завершения Трека 2 (нужны server actions)
- Трек 4 требует завершения Трека 2 (нужен chat.service.ts)
- Трек 3 и 4 НЕ зависят друг от друга
- Трек 1 и 2 НЕ зависят друг от друга

---

## 11. ENV переменные (новые)

```env
REDIS_URL=redis://localhost:6379
ENCRYPTION_KEY=<64 hex символа>
```

---

## 12. Что НЕ входит в эту фазу

- Typing indicators (WebSocket — не приоритет)
- Push-уведомления (Firebase — Фаза 9, Mobile)
- Голосовые/видео сообщения
- Групповые чаты (только диалоги 1-на-1)
- Пользовательская блокировка (заблокировать другого пользователя — не admin)
