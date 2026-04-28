# PROJECT_STATE.md — Живое состояние проекта УслугиРядом

> ⚡ Этот файл — быстрый снапшот для агентов. Читай его первым.
> 📖 Полный план со всеми деталями: `DEVELOPMENT_PLAN.md`

> 🕓 Последнее обновление: 2026-04-28 (Фаза 7: Чат — Production Ready, Внедрен Presence и Оптимизация UX)

---

## Текущая ветка
`refactor/uslugi-ryadom` (активная, включает в себя `feature/phase7-chat`), `master` — продакшен

---

## Статус фаз

| Фаза | Название | Статус |
|------|----------|--------|
| 1–6 | Фундамент, Auth, БД, UI, Listings | ✅ Завершены |
| 7 | Чат и уведомления (Redis + Socket.io + Presence) | ✅ Стабилизирована (Production Ready) |
| 8 | Тесты и CI/CD | ❌ Не начата |
| 9 | React Native (Expo) | ❌ Не начата |
| 10 | Geo-поиск и карты | ❌ Не начата |
| 11–12 | Полировка, Монетизация | ❌ Не начата |

---

## Фаза 7 — что сделано

### ✅ Инфраструктура
- `server.ts` — кастомный HTTP-сервер (tsx runner) + Socket.io + Redis адаптер (`@socket.io/redis-adapter`)
- `src/shared/lib/socket-handlers.ts` — auth через кастомные JWT cookies (jose), комнаты `conv:{id}` / `user:{id}`
- `src/shared/lib/get-io.ts` — `getIO()` через `global._io` для emit из Server Actions
- `src/shared/lib/crypto.ts` — AES-256-GCM шифрование, 12-byte IV (NIST), lazy `getKey()`

### ✅ DAL (Data Access Layer)
- `src/services/chat.service.ts` — полный DAL с шифрованием/дешифрованием, cursor pagination, CSV-экспорт, методы: `getConversations`, `getMessages`, `sendMessage`, `getOrCreateConversation`, `getUnreadCount`, `deleteMessage`, `blockUserChat`, `unblockUserChat`, `exportConversation`

### ✅ Server Actions
- `src/features/chat/api/send-message.ts` — отправка + emit `new:message`
- `src/features/chat/api/start-conversation.ts` — создание/открытие диалога
- `src/features/chat/api/get-messages.ts` — загрузка с пагинацией
- `src/features/chat/api/mark-as-read.ts` — отметка прочитанного
- `src/features/chat/api/admin-actions.ts` — 4 admin-action: delete, block, unblock, export

### ✅ Клиентские хуки
- `src/shared/hooks/use-socket.ts` — модульный синглтон, `useSocket()` → `{ socket, connected }`
- `src/shared/hooks/use-typing.ts` — debounced 2s, emit `typing:start/stop`

### ✅ UI компоненты
- `src/features/chat/ui/ChatWindow.tsx` — infinite scroll (IntersectionObserver), виртуализация через `react-virtuoso`, оптимистичные обновления, typing indicator, Sonner notifications для фоновых чатов.
- `src/features/chat/ui/MessageBubble.tsx` — Быстрая анимация (opacity), поддержка удаления сообщений, премиальный дизайн.
- `src/features/chat/ui/ConversationList.tsx` — реальное время, индикация Online статуса, подсветка активного чата.
- `src/features/chat/ui/ConversationHeader.tsx` — детальная информация о собеседнике (имя + фамилия + онлайн статус).
- `src/features/chat/ui/MessageInput.tsx` — адаптивная высота, анимация кнопки отправки.
- `src/features/chat/ui/NotificationBellClient.tsx` — бейдж непрочитанных в хедере.
- `src/features/chat/ui/ChatNotificationListener.tsx` — глобальные тоасты для новых сообщений.

### ✅ Presence & UX (Новое)
- **Online Presence**: Система отслеживания онлайн-статуса и времени последнего визита (`lastSeenAt`). Хранится в Redis (TTL 3s) + DB.
- **Full Name**: Отображение Имени и Фамилии во всех компонентах чата.
- **UX Optimization**:
  - Устранено мигание аватарок (через `delayMs` в Fallback).
  - Облегчены анимации сообщений для устранения "тягучести".
  - Исправлен резкий скролл при переключении чатов.

### ✅ Багфиксы
- **Real-time Live Chat**: Все сервисы на порту **3000**. Кастомный `upgrade` хендлер.
- **Приоритет сессий**: Исправлен конфликт сессий в WebSocket (Auth.js > Admin).
- **Deep-linking**: Исправлены ссылки «Перейти к заказу» (SEO-структура).
- **Type Safety**: Исправлены все ошибки типов в компонентах чата и сервисах.

### ✅ Страницы
- `(main)/chat` — список диалогов + окно чата (Desktop/Mobile)
- `admin/chats` — модерация диалогов для администратора
- `api/v1/conversations` — REST API для мобильных

### ✅ DevOps
- `docker-compose.yml` — Redis (`redis:7-alpine`), healthcheck.
- `nginx/default.conf` — WebSocket proxy headers.
- `apps/web/e2e/chat.spec.ts` — Playwright тесты.

---

## ⚠️ Перед мёрджем в master — ОБЯЗАТЕЛЬНО

**1. Prisma-миграция**:
`20260427000000_add_chat_models` — все модели (Conversation, Message) добавлены в БД.

**2. Добавить переменные окружения** в `.env`:
```
REDIS_URL=redis://localhost:6379
ENCRYPTION_KEY=<64 hex символа>
```

---

## Тесты

| Тип | Статус |
|-----|--------|
| Unit (Vitest) | ✅ 16/16 — crypto.ts, chat.service.ts |
| E2E (Playwright) | ✅ 6/6 PASSED — чат, редиректы, API |
| TypeScript | ✅ 0 ошибок в модуле чата |

---

## 🔄 Агентам: как обновлять этот файл

После каждой задачи, которая:
- Завершает или частично выполняет пункт фазы → обнови таблицу статусов
- Создаёт/меняет/удаляет ключевой файл → обнови раздел «Ключевые файлы»
- Добавляет миграцию → добавь строку в таблицу «БД — последние миграции»
- Решает известный TODO → удали его из списка

**Обновляй минимально** — только изменившееся. Дату обновления — актуализируй всегда.
