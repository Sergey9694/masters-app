# Code Quality Audit — Чат (Фаза 7)

**Дата:** 2026-04-27  
**Ветка:** `refactor/uslugi-ryadom` (worktree `phase7-chat`)  
**Аудитор:** agent-code-quality

---

## КРИТИЧЕСКИЕ проблемы (FSD нарушения, any типы)

### 1. `any` типы в `src/shared/lib/socket-emit.ts`

**Файл:** `apps/web/src/shared/lib/socket-emit.ts`, строки 16, 23, 25

```ts
// строка 16 — параметр data без типа
data: any;

// строки 23, 25 — приведение event к any
io.to(room).emit(event as any, data);
io.emit(event as any, data);
```

**Проблема:** `data: any` нарушает правило проекта (CLAUDE.md Part VIII). `event as any` — обходит типизацию `ServerToClientEvents`.

**Исправление:**
```ts
// Импортировать типы из socket-events и сузить сигнатуру
import type { ServerToClientEvents } from "./socket-events";
type EmitEvent = keyof ServerToClientEvents;
type EmitData<E extends EmitEvent> = Parameters<ServerToClientEvents[E]>[0];

async function emitToSocket<E extends EmitEvent>({ room, event, data }: {
  room?: string;
  event: E;
  data: EmitData<E>;
})
```

---

### 2. `any` типы в `apps/web/src/shared/lib/get-io.ts`

**Файл:** `apps/web/src/shared/lib/get-io.ts`, строки 5

```ts
const io = (global as any)._io;
```

**Проблема:** `global as any` — необоснованное расширение типа. Правильно использовать `declare global`.

**Исправление:**
```ts
declare global {
  var _io: Server<ClientToServerEvents, ServerToClientEvents> | undefined;
}
export function getIO() {
  return global._io ?? null;
}
```

---

### 3. TypeScript ошибка компиляции в `src/shared/lib/socket-events.ts`

**Файл:** `apps/web/src/shared/lib/socket-events.ts`, строка 13

```
error TS2304: Cannot find name 'MessageDTO'.
```

Файл реэкспортирует `MessageDTO` (строка 1) через `export type { MessageDTO }`, но сразу использует его в интерфейсе `ServerToClientEvents` без явного импорта. Это ошибка — реэкспорт не создаёт локальную привязку в пространстве имён.

**Исправление:** заменить строку 1 на:
```ts
import type { MessageDTO } from "@uslugi/shared-types";
export type { MessageDTO };
```

---

### 4. `any` в `apps/web/server.ts`

**Строки 8-9, 43, 63:**
```ts
(globalThis as any).AsyncLocalStorage = AsyncLocalStorage;
(global as any)._io = io;
```

Дублирует проблему из п.2. Два места задают `_io` (строки 43 и 63), одно из которых избыточно.

---

## ВЫСОКИЙ приоритет

### 5. `ChatWindow.tsx` — неиспользуемые импорты

**Файл:** `apps/web/src/features/chat/ui/ChatWindow.tsx`, строка 13
```ts
import { AnimatePresence, motion } from "framer-motion";
```
`AnimatePresence` не используется нигде в JSX компонента. `motion` используется только внутри `Footer`-компонента Virtuoso. Нарушение правила Karpathy §3: "Remove imports... that YOUR changes made unused."

**Файл:** `apps/web/src/features/chat/ui/ChatWindow.tsx`, строка 213
```ts
const groups = groupByDate(messages);
```
`groups` вычисляется, но **нигде не используется** — весь рендер идёт через `itemContent` Virtuoso, где дата вычисляется заново (строки 259-260). Это N-лишнее вычисление (`groupByDate` + inline `toDateString()` сравнение) — мёртвый код.

---

### 6. Бинарный `unreadCount` вместо реального счётчика

**Файл:** `apps/web/src/services/chat.service.ts`, строка 93
```ts
const unread = last && (!lastReadAt || lastReadAt < last.createdAt) ? 1 : 0;
```

`unreadCount` всегда равен 0 или 1, хотя UI в `ConversationList.tsx` отображает его как счётчик (`conv.unreadCount > 0 && <span>{conv.unreadCount}</span>`). Пользователь никогда не увидит "3 непрочитанных" — только "1".

**Тип `ConversationPreview.unreadCount: number`** — контракт предполагает реальное число.

---

### 7. `cors: origin: "*"` в production-ready `server.ts`

**Файл:** `apps/web/server.ts`, строка 35
```ts
origin: "*", // More permissive for local dev/proxies
```

Комментарий "local dev" подтверждает, что это временное решение. При деплое это создаёт уязвимость: любой домен может подключаться к Socket.io. Нужно считывать из `process.env.NEXT_PUBLIC_APP_URL`.

---

### 8. Дублирование `_io = io` в `server.ts`

**Файл:** `apps/web/server.ts`, строки 43 и 63 — `(global as any)._io = io` вызывается дважды. Строка 43 — лишняя, т.к. Redis-адаптер ещё не подключён. Это не баг, но запутывающий код.

---

### 9. Утечка `router` из deps в `NotificationBellClient.tsx`

**Файл:** `apps/web/src/features/chat/ui/NotificationBellClient.tsx`, строка 52
```ts
}, [socket, router]);
```

`router` включён в зависимости `useEffect`, хотя внутри обработчика не используется напрямую. При каждом ре-рендере роутер стабилен (Next.js гарантирует это), но это вводит ненужную зависимость. Минорная проблема, но нарушает принцип точных deps.

---

## СРЕДНИЙ приоритет (файлы > 200 строк, DRY, debug-код)

### 10. `ChatWindow.tsx` — 284 строки (превышение порога)

**Файл:** `apps/web/src/features/chat/ui/ChatWindow.tsx` — 284 строки.

По правилу проекта (CLAUDE.md Part XII): файл > 200 строк → предложить разбиение.

**Предложение:** выделить логику сокетов в `useChatSocket(conversationId, currentUserId)` хук (~60 строк) и логику `loadMore` с IntersectionObserver в `useChatPagination()` (~40 строк). Компонент сократится до ~150 строк.

---

### 11. DRY: дублирование `formatDate` в двух файлах

- `apps/web/src/features/chat/ui/ConversationList.tsx`, строка 17: локальная `formatDate`
- `apps/web/src/features/chat/ui/DateSeparator.tsx`, строка 1: другая локальная `formatDate`

В `shared/lib/date.ts` уже есть `formatSmartDate` (использует `date-fns`, поддерживает "Сегодня", "Вчера"). Обе локальные функции дублируют её логику примитивно через `toLocaleDateString`. Нужно реиспользовать `formatSmartDate` / `formatRelativeTime` из `shared/lib/date.ts`.

---

### 12. Обилие `console.log` в production-коде

Клиентские `console.log` в продакшне — утечка информации о внутреннем состоянии:

| Файл | Строки |
|------|--------|
| `ChatWindow.tsx` | 53, 65, 101, 114 |
| `NotificationBellClient.tsx` | 32, 36 |
| `use-socket.ts` | 30, 39, 43 |
| `use-typing.ts` | 20 |
| `send-message.ts` | 35 |

Итого: **10 console-вызовов** в продакшн-коде feature-слоя и shared-хуков. Нужно либо удалить, либо обернуть в `if (process.env.NODE_ENV === "development")`.

Серверные логи в `socket-handlers.ts` и `get-io.ts` — ещё ~20 штук — отдельная история, но тоже нуждаются в уровне логирования (pino/winston).

---

### 13. Admin panel: прямые Prisma-запросы в page.tsx

**Файл:** `apps/web/src/app/admin/(protected)/chats/page.tsx`, строки 11-28

Прямой `db.conversation.findMany(...)` в Server Component (page), минуя `chatService`. Нарушает принцип единой точки доступа к данным (DAL). Правильно: вызывать `chatService.getAllConversations(...)`.

---

### 14. `unread` поле в `getConversations` не учитывает удалённые сообщения

**Файл:** `apps/web/src/services/chat.service.ts`, строка 62
```ts
messages: {
  where: { deletedAt: null },
  ...
  take: 1,
}
```

Но на строке 98 `mapMessage` вызывается с `{ ...last, deletedAt: null, deletedBy: null }` — хардкод `null` заглушает флаг удаления в превью диалога. Если последнее сообщение было удалено (не через этот запрос, т.к. `where: { deletedAt: null }`), это корректно. Но хардкод маскирует реальное поле — потенциальная ловушка при рефакторинге.

---

## Что проверено и ОК

- **FSD нарушений НЕТ**: `shared/` не импортирует из `features/`, chat-feature не импортирует другие features
- **Все клиентские компоненты** (`'use client'`) оправданы: используют хуки/события
- **Серверные компоненты** (`ConversationHeader`, `DateSeparator`, `ChatEmpty`) не помечены `'use client'` без нужды
- **Все Server Actions** оборачиваются в `authActionClient` / `adminActionClient` (Zod-валидация + аутентификация)
- **Rate limiting** реализован в `sendMessageAction` (30 сообщений / 60 сек)
- **Шифрование** сообщений — AES-256-GCM, lazy `getKey()` — соответствует правилу Part VII (секреты не в top-level scope)
- **JWT** в httpOnly cookies, не localStorage
- **Socket auth** — middleware проверяет cookie перед подключением
- **Props интерфейсы** — все компоненты имеют явные `interface Props`
- **`MessageDTO` тип** — определён в `@uslugi/shared-types`, реиспользуется везде
- **`ServerToClientEvents` / `ClientToServerEvents`** — типизированы в `socket-events.ts`
- **Пагинация сообщений** — cursor-based через `getMessagesAction`, Prisma делает срез
- **Оптимистичные обновления** в `ChatWindow.handleSend` — реализованы правильно (дедупликация по id)
- **Виртуализация** списка сообщений через `react-virtuoso` — правильный выбор
- **Бесконечная прокрутка** через IntersectionObserver — корректная реализация
- **Typing indicator** — debounce через `useRef`, не `useState`, не вызывает лишних рендеров
- **Admin-модерация** (блок чата, удаление сообщений, экспорт CSV) — реализована через `adminActionClient`
- **`socket-handlers.ts`** — проверяет участие в диалоге перед `socket.join(room)` (авторизация на уровне комнаты)
- **`getConversationsAction`** — Server Action вместо прямого fetch

---

## Итог по приоритетам

| # | Проблема | Файл | Приоритет |
|---|----------|------|-----------|
| 1 | `data: any` в socket-emit | `shared/lib/socket-emit.ts:16` | КРИТИЧЕСКИЙ |
| 2 | `global as any` в get-io | `shared/lib/get-io.ts:5` | КРИТИЧЕСКИЙ |
| 3 | TS ошибка: `MessageDTO` не найден | `shared/lib/socket-events.ts:13` | КРИТИЧЕСКИЙ |
| 4 | `any` дважды в server.ts | `server.ts:8,43,63` | КРИТИЧЕСКИЙ |
| 5 | `AnimatePresence` не используется, `groups` — мёртвый код | `chat/ui/ChatWindow.tsx:13,213` | ВЫСОКИЙ |
| 6 | `unreadCount` всегда 0 или 1 | `services/chat.service.ts:93` | ВЫСОКИЙ |
| 7 | `cors: origin: "*"` | `server.ts:35` | ВЫСОКИЙ |
| 8 | Двойной `_io = io` | `server.ts:43,63` | ВЫСОКИЙ |
| 9 | `router` лишний в deps | `NotificationBellClient.tsx:52` | ВЫСОКИЙ |
| 10 | 284 строки в ChatWindow | `chat/ui/ChatWindow.tsx` | СРЕДНИЙ |
| 11 | Дублирование `formatDate` | `ConversationList.tsx:17`, `DateSeparator.tsx:1` | СРЕДНИЙ |
| 12 | 10+ `console.log` в production | несколько файлов | СРЕДНИЙ |
| 13 | Прямой Prisma в admin page | `admin/chats/page.tsx:11` | СРЕДНИЙ |
| 14 | Хардкод `deletedAt: null` в mapMessage | `chat.service.ts:98` | НИЗКИЙ |

---

## Вердикт: НЕЛЬЗЯ мёрджить

**Блокеры (должны быть исправлены до merge):**
1. TS ошибка компиляции (`MessageDTO not found`) — код не компилируется чисто.
2. `data: any` в `socket-emit.ts` — нарушение обязательного правила проекта (Part VIII CLAUDE.md).
3. `unreadCount` возвращает всегда 0 или 1 — сломана пользовательская функциональность.
4. `cors: "*"` — security issue для production.

**После исправления блокеров** — можно мёрджить. Остальные замечания (console.log, dead code, DRY) — можно оформить follow-up задачами.
