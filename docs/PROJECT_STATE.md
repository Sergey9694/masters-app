# PROJECT_STATE.md — Живое состояние проекта УслугиРядом

> ⚡ Этот файл — быстрый снапшот для агентов. Читай его первым.
> 📖 Полный план со всеми деталями: `DEVELOPMENT_PLAN.md`
> 🕓 Последнее обновление: 2026-04-27 (Фикс ссылок, аватарок и типизации в Чате)

---

## Текущая ветка
`feature/phase7-chat` (worktree) → мёрдж в `master`

---

## Статус фаз

| Фаза | Название | Статус |
|------|----------|--------|
| 1–5 | Фундамент, Auth, БД, API, Desktop UI | ✅ Завершены |
| 6 | Объявления от исполнителей | ✅ Завершена |
| 7 | Чат и уведомления (Socket.io + Redis) | ✅ Завершена |
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
- `src/features/chat/ui/ChatWindow.tsx` — infinite scroll (IntersectionObserver), оптимистичные обновления, typing indicator, Sonner notifications для фоновых чатов, AnimatePresence анимации.
- `src/features/chat/ui/MessageBubble.tsx` — Motion анимации появления, Glassmorphism стили для входящих сообщений, улучшенная типографика.
- `src/features/chat/ui/DateSeparator.tsx`, `TypingIndicator.tsx`, `ChatEmpty.tsx`, `ConversationHeader.tsx`
- `src/features/chat/ui/ConversationList.tsx` — мгновенное обновление (real-time refresh) через события `new:message` и `conversation:update`.
- `src/features/chat/ui/MessageInput.tsx` — премиальный дизайн, адаптивная высота, анимация кнопки отправки.
- `src/features/chat/ui/StartChatButton.tsx` — кнопка «Написать» на страницах провайдера
- `src/features/chat/ui/NotificationBellClient.tsx` — бейдж непрочитанных в хедере (только счетчик)
- `src/features/chat/ui/ChatNotificationListener.tsx` — глобальные всплывающие уведомления (toasts) для всех страниц, включая админку.
- `src/features/chat/ui/AdminChatActions.tsx` — block/unblock/export для admin
- `src/features/chat/ui/AdminDeleteMessageButton.tsx` — удаление сообщения в admin UI

### ✅ Багфиксы (Критично)
- **Real-time Live Chat**: Все сервисы (Next.js + Socket.io) объединены на порту **3000**. Внедрен кастомный `upgrade` хендлер для корректной работы Socket.io параллельно с Next.js HMR. Это обеспечивает работу чата и устраняет конфликты.
- **Синхронизация комнат**: Унифицированы имена комнат `conv:${id}` во всех компонентах и экшенах.
- **Socket Events**: Исправлены имена событий (`new:message` вместо `message:new`) для корректной работы клиента.
- **Интеграция с откликами**: Исправлено автоматическое создание диалога при отправке предложения (Proposal) — теперь чат обновляется мгновенно.
- **Приоритет сессий (Socket Auth)**: Исправлен конфликт сессий в WebSocket. Теперь Auth.js сессия имеет приоритет над старой сессией админа. Это решило проблему некорректного отображения имени в индикаторе печати («Ирина» вместо «Админ»).
- **Глобальные уведомления**: Система уведомлений вынесена в `ChatNotificationListener` в `RootLayout`. Теперь тоасты о новых сообщениях работают во всем приложении, включая админ-панель.

### ✅ Страницы
- `src/app/(main)/chat/layout.tsx` — full-height flex контейнер
- `src/app/(main)/chat/page.tsx` — список диалогов + ChatEmpty (desktop two-panel)
- `src/app/(main)/chat/[id]/page.tsx` — ConversationList + ChatWindow
- `src/app/admin/(protected)/chats/page.tsx` — список всех диалогов для admin
- `src/app/admin/(protected)/chats/[id]/page.tsx` — детальная модерация диалога

### ✅ REST API (для мобильных)
- `src/app/api/v1/conversations/route.ts` — GET список диалогов
- `src/app/api/v1/conversations/[id]/messages/route.ts` — GET пагинация + POST отправка

### ✅ DevOps
- `docker-compose.yml` — добавлен Redis (`redis:7-alpine`), healthcheck, depends_on
- `nginx/default.conf` — WebSocket proxy `/socket.io/` с upgrade headers, timeout 86400s
- `.env.example` — добавлены `REDIS_URL`, `SOCKET_PORT`, `ENCRYPTION_KEY`
- `apps/web/playwright.config.ts` + `apps/web/e2e/chat.spec.ts` — E2E тесты

---

## ⚠️ Перед мёрджем в master — ОБЯЗАТЕЛЬНО

**1. Prisma-миграция** (✅ Применена):
`20260427000000_add_chat_models` — все модели (Conversation, Message) добавлены в БД.

**2. Добавить переменные окружения** в `.env`:
```
REDIS_URL=redis://localhost:6379
ENCRYPTION_KEY=<64 hex символа — openssl rand -hex 32>
```

---

## Ключевые файлы

```
apps/web/
├── server.ts                             — Socket.io HTTP-сервер
├── src/
│   ├── proxy.ts                          — защита роутов
│   ├── shared/
│   │   ├── lib/crypto.ts                 — AES-256-GCM шифрование
│   │   ├── lib/socket-handlers.ts        — Socket.io auth + rooms
│   │   ├── lib/get-io.ts                 — глобальный доступ к io
│   │   ├── lib/motion.ts                 — единая точка анимаций
│   │   ├── hooks/use-socket.ts           — клиентский Socket.io хук
│   │   └── hooks/use-typing.ts           — debounced typing indicator
│   ├── services/
│   │   ├── chat.service.ts               — DAL чата с шифрованием
│   │   ├── order.service.ts
│   │   ├── listing.service.ts
│   │   └── ...                           — 12 DAL-сервисов всего
│   ├── features/
│   │   ├── chat/
│   │   │   ├── api/                      — 5 server actions + admin-actions
│   │   │   └── ui/                       — 10 UI компонентов
│   │   ├── auth/
│   │   ├── listing-management/
│   │   └── order-management/
│   └── app/
│       ├── (main)/chat/                  — /chat и /chat/[id]
│       ├── admin/(protected)/chats/      — admin модерация чатов
│       └── api/v1/conversations/         — REST API для мобильных
├── prisma/
│   ├── schema.prisma                     — модель данных (chat-модели добавлены)
│   └── migrations/                       — 9 миграций (chat ещё не создана!)
├── e2e/chat.spec.ts                      — Playwright E2E тесты
└── vitest.config.ts                      — unit тесты (11/11 ✅)
```

## БД — последние миграции

| Дата | Миграция |
|------|----------|
| 2026-04-27 | `add_chat_models` — чат, участники, сообщения |
| 2026-04-25 | `add_listing_slug` |

## Тесты

| Тип | Статус |
|-----|--------|
| Unit (Vitest) | ✅ 11/11 — crypto.ts, chat.service.ts |
| E2E (Playwright) | ✅ 6/6 PASSED — чат, редиректы, API |
| TypeScript | ⚠️ 99 ошибок — все pre-existing (implicit any в callbacks) |

## Последние значимые изменения (Фаза 7)

- **Чат end-to-end**: Socket.io + Redis → AES-256-GCM шифрование → DAL → Server Actions → ChatWindow UI
- **Admin модерация**: удаление сообщений, блокировка чата пользователей, CSV-экспорт диалогов
- **NotificationBell**: real-time бейдж непрочитанных в Header, обновляется без перезагрузки
- **Deep-linking**: Исправлены битые ссылки «Перейти к заказу» в заголовке чата. Теперь ссылки строятся по полной SEO-структуре `/orders/[city]/[category]/[slug]`.
- **UI/UX Refactoring**: Все аватарки в чате переведены на Shadcn UI `Avatar` с инициалами (устранена 404 ошибка `/default-avatar.png`). Увеличен размер аватарок в чате для лучшей читаемости.
- **StartChatButton**: вход в чат с профилей провайдеров/объявлений
- **Type Safety**: Устранены ошибки типизации в `MessageBubble.tsx` (DTO импорты и форматирование даты).
- **REST API**: `/api/v1/conversations` — эндпоинты для мобильного клиента (Bearer JWT)
- **Docker**: Redis сервис, Nginx WebSocket upgrade headers

## Известные TODO / открытые вопросы

- ⚠️ **[Фаза 11 / Вариант Б]** Модерация объявлений отключена: новые объявления → `ACTIVE` без проверки. Для MVP осознанно. Включить `MODERATION` статус по умолчанию позже.
- Email — mock, пишет в `apps/web/email-debug.log`
- 99 pre-existing TypeScript ошибок (implicit any в callback params) — технический долг Фаз 1-6

---

## 🔄 Агентам: как обновлять этот файл

После каждой задачи, которая:
- Завершает или частично выполняет пункт фазы → обнови таблицу статусов
- Создаёт/меняет/удаляет ключевой файл → обнови раздел «Ключевые файлы»
- Добавляет миграцию → добавь строку в таблицу «БД — последние миграции»
- Решает известный TODO → удали его из списка

**Обновляй минимально** — только изменившееся. Дату обновления — актуализируй всегда.
