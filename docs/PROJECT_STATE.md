# PROJECT_STATE.md — Живое состояние проекта УслугиРядом

> ⚡ Этот файл — быстрый снапшот для агентов. Читай его первым.
> 📖 Полный план со всеми деталями: `DEVELOPMENT_PLAN.md`

> 🕓 Последнее обновление: 2026-04-29 (Notification Decoupling, UI Polish & Mandatory QC Protocol)

---

## Текущая ветка
`refactor/uslugi-ryadom` (активная, включает в себя `feature/phase7-chat`), `master` — продакшен

---

## Статус фаз

| Фаза | Название | Статус |
|------|----------|--------|
| 1–6 | Фундамент, Auth, БД, UI, Listings | ✅ Завершены |
| 7 | Чат и уведомления (Redis + Socket.io + Presence) | ✅ Завершена и смержена |
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
- **CI/CD Fix**: Исправлена ошибка пререндеринга `/auth/login` (добавлен `Suspense` вокруг `LoginForm`).
- **Production Stabilization**:
    - Добавлена пропущенная миграция для `lastSeenAt`.
    - `tsx` добавлен в глобальные зависимости Docker-образа.
    - Устранен конфликт портов Redis (6379) на VPS.

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
| E2E (Playwright) | ✅ 3/3 PASSED — чат, редиректы (UUID/Slug) |
| TypeScript | ✅ 0 ошибок в проекте |

---

## Обновление 2026-04-29 (Stabilization & Polish): Notifications & Chat Fixes
- **Redirection Stabilized**: Исправлена ошибка 404 при переходе из уведомлений. Роут `/orders/v/[id]` теперь поддерживает как UUID, так и слаги заказов, обеспечивая 100% доставляемость переходов.
- **Header UI Polish**: В шапку добавлен вертикальный разделитель между функциональными блоками (Чат/Уведомления vs Избранное), увеличено пространство (gap) и добавлены тени для премиального вида.
- **Chat Input Alignment**: Исправлено визуальное смещение кнопки отправки. Теперь кнопка выровнена по нижнему краю инпута (baseline), а иконка "Send" идеально центрирована внутри кнопки с учетом оптических компенсаций.
- **Auth Diagnostic Logs**: В `socket-handlers.ts` внедрено расширенное логирование процесса рукопожатия (handshake). Система теперь логирует имена всех кук и результат авторизации (`ACCEPTED`/`REJECTED`), что упрощает отладку проблем с "тихими" счетчиками.
- **Verification**: 
    - Пройдена проверка типов (`tsc --noEmit`).
    - Создан и успешно выполнен E2E тест `e2e/redirection.spec.ts`, подтверждающий корректность редиректов по обоим типам идентификаторов.

---

## Обновление 2026-04-28 (Fix): Стабилизация Production WebSocket & Presence
- **Redis Name Collision Fix**: Сервис Redis переименован в `uslugi_redis` в `docker-compose.yml`. Это устранило DNS-конфликт на VPS, где несколько проектов использовали имя `redis` в одной сети `proxy_network`.
- **WebSocket Proxy Restore**: В `server.ts` внедрен байпас для маршрута `/socket.io`. Теперь Socket.io-запросы обрабатываются напрямую Proxy-Bridge (порт 3000) и не проксируются в Next.js, что восстановило работоспособность чата в продакшене.
- **Next.js Upgrade**: Версия Next.js обновлена до `16.2.2`. Это исправило баг пустых `middleware-manifest.json` в `standalone` сборке, из-за которого не работал `src/proxy.ts` (замена Middleware).
- **Redis Adapter**: В `server.ts` интегрирован `@socket.io/redis-adapter` (и `ioredis`). Это обеспечивает синхронизацию WebSocket-событий между всеми Node.js процессами.
- **Presence Verified**: Статус "Online" теперь корректно отображается в UI (Sergei, Ирина). Ключи `user:status:*` успешно создаются в изолированном контейнере `uslugi_redis`.

---

## Обновление 2026-04-28 (UX & Polish): Доработка чата
- **Accurate Unread Counters**: Счетчик непрочитанных в списке диалогов теперь запрашивает реальное количество сообщений из БД вместо бинарного 0/1.
- **Smart Mark-as-Read**: Счетчик обнуляется мгновенно при фокусе или клике на поле ввода сообщения.
- **Socket Sync**: При прочтении чата в одном окне, событие `conversation:update` синхронизирует счетчики во всех открытых вкладках и боковой панели.
- **Name Normalization**: Внедрен формат "Имя Фамилия" во всех компонентах: `MessageBubble`, индикатор набора текста, `socket.data.userName`.
- **Premium Input UX**:
    - Инпут больше не блокируется при отправке.
    - Текст очищается мгновенно (`optimistic clear`), фокус сохраняется для непрерывного набора.
    - Добавлена обработка ошибок: текст возвращается в инпут, если отправка не удалась.

---

## Обновление 2026-04-29 (UX, Notifications & QC Protocol)
- **Notification Decoupling**:
    - Чат-уведомления отделены от системных. В хедере теперь два значка: Сообщения (иконка почты) и Уведомления (колокольчик).
    - Каждое системное событие (отклик, изменение статуса) теперь вызывает `emitToSocket`, обновляя счетчик на колокольчике в реальном времени.
- **Avito-style Tab Flashing**:
    - Реализован хук `useFlashTitle`. При наличии непрочитанных сообщений вкладка браузера мигает текстом `(N) Новое сообщение`, привлекая внимание пользователя.
- **UI Alignment**:
    - В `MessageInput.tsx` кнопка отправки и инпут выровнены строго по центру (items-center). Иконка внутри кнопки центрирована.
- **Mandatory QC Protocol**:
    - В `agent-protocol/SKILL.md` внесено правило №4: **Обязательная проверка типов (`tsc`) и тестирование** после любых изменений. "Код не проверен = Задача не выполнена".
- **Dev Environment Fix**:
    - Исправлен `dev.ps1`: теперь корректно запускает `uslugi_redis` (устранен конфликт имен) и гарантирует установку зависимостей перед Prisma push.

---

## Обновление 2026-04-29 (Fix): Исправление ссылок в уведомлениях (404)
- **Broken Link Fix**: Исправлена ошибка 404 при клике на системные уведомления (например, "Новая заявка"). Ранее система пыталась открыть `/orders/[id]`, чего не существовало в SEO-структуре роутинга.
- **Order Redirector**: Создан выделенный роут `/orders/v/[id]` (Server Component), который разрешает UUID заказа в полный SEO-путь: `/orders/[city]/[category]/[slug]`.
- **UI Sync**: Компоненты `NotificationItem` и `NotificationItemLight` обновлены для использования нового редиректора.
- **Legacy Support**: Устаревшие редиректы в `/dashboard/order/[id]` также переведены на новый механизм.
- **Verification**: Пройден полный цикл QC: L1 (TSC), L3 (Playwright E2E с проверкой редиректа на реальных данных), L4 (Manual/Browser).
