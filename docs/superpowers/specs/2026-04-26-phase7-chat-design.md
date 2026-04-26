# Спецификация Фазы 7 — Чат и уведомления

> Дата: 2026-04-26  
> Статус: Утверждена  
> Реализация: 4 параллельных трека через субагентов

---

## 1. Контекст и цели

Фаза 7 добавляет real-time коммуникацию между клиентами и исполнителями внутри платформы. Чат привязан к контексту (заказ или объявление), что позволяет разрешать споры и модерировать переписку.

**Ключевые решения:**
- **Socket.io** (WebSocket) — единая система для сообщений, типинг-индикатора и уведомлений. Нативно работает в React Native (`socket.io-client`). Redis синхронизирует несколько инстансов через `@socket.io/redis-adapter`.
- PostgreSQL — единственное хранилище сообщений (Redis только транспорт/pub-sub)
- AES-256-GCM — шифрование поля `Message.text` на уровне приложения
- Чат открывается через заказ (после отклика) или через объявление (кнопка на странице)
- Полная модерация в админке: чтение, удаление, блокировка, экспорт
- Типинг-индикатор «печатает...» через Socket.io (нет HTTP-оверхеда)
- Infinite scroll с курсорной пагинацией (подгрузка предыдущих сообщений)
- Datetime-разделители между сообщениями (сегодня / вчера / дата)
- Read receipts (прочитано / не прочитано)
- Nginx: добавить заголовки `Upgrade` и `Connection` для WebSocket

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

## 4. Real-time инфраструктура — Socket.io (Трек 1)

### 4.1 Зависимости

```bash
# apps/web
npm install socket.io socket.io-client @socket.io/redis-adapter ioredis
```

### 4.2 Custom Next.js сервер
**Файл:** `apps/web/server.ts`

```typescript
import { createServer } from "http";
import next from "next";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { getRedis } from "@/shared/lib/redis";
import { registerSocketHandlers } from "@/shared/lib/socket-handlers";

const app = next({ dev: process.env.NODE_ENV !== "production" });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handler);
  const io = new Server(httpServer, {
    cors: { origin: process.env.NEXT_PUBLIC_APP_URL },
  });

  // Redis adapter — синхронизация между несколькими инстансами
  const pubClient = getRedis();
  const subClient = pubClient.duplicate();
  io.adapter(createAdapter(pubClient, subClient));

  registerSocketHandlers(io);

  httpServer.listen(3000);
});
```

**Docker:** изменить команду запуска с `next start` на `node server.js` (собирается из `server.ts`).

### 4.3 Socket события (типы)
**Файл:** `apps/web/src/shared/lib/socket-events.ts`

```typescript
// Сервер → Клиент
export type ServerToClientEvents = {
  "new:message":      (data: { conversationId: string; message: MessageDTO }) => void;
  "new:notification": (data: { notification: NotificationDTO }) => void;
  "new:proposal":     (data: { orderId: string }) => void;
  "new:order":        (data: { orderId: string }) => void;
  "typing:start":     (data: { conversationId: string; userId: string; userName: string }) => void;
  "typing:stop":      (data: { conversationId: string; userId: string }) => void;
  "message:deleted":  (data: { conversationId: string; messageId: string }) => void;
  "user:blocked":     () => void;
};

// Клиент → Сервер
export type ClientToServerEvents = {
  "join:conversation":  (conversationId: string) => void;
  "leave:conversation": (conversationId: string) => void;
  "typing:start":       (conversationId: string) => void;
  "typing:stop":        (conversationId: string) => void;
};
```

### 4.4 Socket handlers (серверная логика)
**Файл:** `apps/web/src/shared/lib/socket-handlers.ts`

- Аутентификация при подключении: читать сессию из cookie, отключать анонимов
- При `join:conversation` — проверить что юзер участник, добавить в Socket.io room
- При `typing:start/stop` — транслировать другим участникам комнаты
- Graceful degradation: если Redis недоступен — Socket.io работает в single-instance режиме

### 4.5 Клиентский хук
**Файл:** `apps/web/src/shared/hooks/use-socket.ts`

```typescript
"use client";
import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function useSocket() {
  // Singleton — одно соединение на всё приложение
  if (!socket) {
    socket = io({ path: "/socket.io", autoConnect: true });
  }
  return socket;
}
```

### 4.6 Типинг-индикатор (клиент)
```typescript
// В MessageInput.tsx:
const handleTyping = useMemo(() => debounce(() => {
  socket.emit("typing:stop", conversationId);
}, 2000), [conversationId]);

const handleChange = (e) => {
  setText(e.target.value);
  socket.emit("typing:start", conversationId);
  handleTyping(); // через 2 сек тишины — typing:stop
};
```

### 4.7 Интеграция emit() в Server Actions

Server Actions не имеют прямого доступа к Socket.io серверу, поэтому используем Redis для публикации — socket-handlers подписаны на те же каналы:

| Action | Событие на клиенте |
|--------|--------------------|
| `sendMessageAction` | `new:message` → участникам комнаты |
| `submitProposalAction` | `new:proposal` + `new:notification` → владельцу заказа |
| `createOrderAction` | `new:order` → всем авторизованным в ленте |
| `acceptProposalAction` | `new:notification` → исполнителю |
| `deleteMessage` (admin) | `message:deleted` → участникам |
| `blockUserChat` (admin) | `user:blocked` → заблокированному |

### 4.8 Docker
```yaml
# docker-compose.yml — добавить:
redis:
  image: redis:7-alpine
  restart: unless-stopped

# Nginx — добавить в location /:
# proxy_http_version 1.1;
# proxy_set_header Upgrade $http_upgrade;
# proxy_set_header Connection "upgrade";
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
