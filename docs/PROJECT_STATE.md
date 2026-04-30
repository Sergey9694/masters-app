# PROJECT_STATE.md — Живое состояние проекта УслугиРядом

> ⚡ Этот файл — быстрый снапшот для агентов. Читай его первым.
> 📖 Полный план со всеми деталями: `DEVELOPMENT_PLAN.md`

> 🕓 Последнее обновление: 2026-04-29 (Trust/Safety MVP)

---

## Обновление 2026-04-29 (Trust/Safety MVP)
- **Prisma Trust Layer**: Добавлена миграция `20260429181417_add_trust_safety` с `UserBlock`, `Report`, `ReportTargetType`, `ReportReason`, `ReportStatus` и связями в `User`.
- **Backend Enforcement**: Создан `apps/web/src/services/trust.service.ts`; `chatService.startConversation` и `chatService.sendMessage` теперь проверяют личные блокировки на сервере.
- **Reports Evidence**: `trust-evidence.ts` собирает snapshot последних сообщений без plaintext: только encrypted text, SHA-256 hash, метаданные, attachments и deletedAt.
- **User Actions & UI**: Добавлен feature-модуль `features/trust`: блокировка/разблокировка, жалоба на пользователя/сообщение, `BlockedState` в чате, socket payload `user:blocked`.
- **Admin Queue**: Создана `/admin/reports` с фильтрами, evidence summary и действиями `REVIEWED` / `DISMISSED` / `ACTIONED`, решения пишутся в `AuditLog`.
- **Verification**:
  - `npx tsc --noEmit` — PASS.
  - `npm run test -- --run` — PASS, 4 файла / 19 тестов.
  - HTTP-smoke `/admin/reports` без auth — PASS, `307 -> /auth/login?callbackUrl=%2Fadmin%2Freports`.
  - Playwright Chromium не запускался: escalation отклонен авто-ревью из-за лимита доступа.

---

## 🔥 Обновление 2026-04-29: Multi-agent System Deep Upgrade
- **Deep Upgrade**: Все существующие агенты (Orchestrator, Architect, Code Quality, Performance, QA, SEO) прошли «глубокую прокачку» инструкций. Теперь они ориентированы на Enterprise-стандарты 2026 года, DDD, Clean Architecture и нативную производительность.
- **New Specialized Agents**:
    - `agent-mobile-expert`: Специалист по React Native (Expo) и мобильному UX.
    - `agent-monorepo-master`: Мастер Turborepo и синергии воркспейсов.
    - `agent-devops-cicd`: Эксперт по автоматизации деплоя, GitHub Actions и Sentry.
- **Protocol Expansion**: Внедрены принципы "Proactive Refactoring", "Context Management" и "Conflict Resolution" на уровне Оркестратора.
- **Preparation for Phase 9**: Система полностью готова к разработке мобильного приложения с общим кодом через `packages/shared`.

---

## Текущая ветка
`refactor/uslugi-ryadom` (активная, включает в себя `feature/phase7-chat`), `master` — продакшен

---

## Статус фаз

| 1–6 | Фундамент, Auth, БД, UI, Listings | ✅ Завершены |
| 7 | Чат и уведомления (Redis + Socket.io + Presence) | ✅ Завершена и смержена |
| 7.1| Security Audit & Remediation (Enterprise Gate) | ✅ Завершена |
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
```bash
# Локально: порт 6380 (проброшен из Docker для избежания конфликтов на хосте)
# Внутри Docker (на VPS): redis://uslugi_redis:6379
REDIS_URL=redis://localhost:6380
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

## Обновление 2026-04-29 (Agent System): Codex Entry Point
- **Codex Integration**: Добавлен `AGENTS.md` — входной файл для Codex, который подключает существующие `.agent/skills/` без дублирования правил.
- **Instruction Integrity**: `CLAUDE.md`, `GEMINI.md` и `agent-protocol/SKILL.md` теперь явно включают `AGENTS.md` в список синхронизируемых инструкций.
- **Cheatsheet**: `docs/CHEATSHEET.md` обновлен, чтобы Codex-сессии начинались с правильного входного файла.

---

## Обновление 2026-04-29 (Agent System): Security Gatekeeper Protocol
- **Existing Security Agent Confirmed**: `agent-security` уже существовал, поэтому дубль не создавался; файл усилен до роли главного Security Gatekeeper / AppSec-DevSecOps, а подробные чеклисты вынесены в `agent-security/references/security-checklists.md`.
- **Security Gate Before Code**: `agent-protocol`, `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `agent-orchestrator` и `docs/CHEATSHEET.md` синхронизированы: любой runtime-код сначала проходит Security Gate, а CRITICAL/HIGH риск блокирует работу.
- **Frontend/Backend Boundary**: Зафиксировано правило `Frontend is untrusted`: на клиенте только UI/UX, публичные данные и временное состояние; secrets, permissions, ownership, бизнес-правила безопасности, rate limits и доступ к БД остаются только на backend.
- **API Abuse Controls**: В Security Gate явно добавлены `Idempotency-Key`, per-endpoint rate limits и API throttling/backpressure для дорогих или non-idempotent операций.
- **Current Documentation Rule**: Для security-sensitive решений агент обязан сверяться с актуальными источниками через `context7`/`ref` или официальную документацию (OWASP ASVS/Cheat Sheets, Next.js/Auth.js/Prisma/Socket.io/Docker/npm) и фиксировать источники в verdict.

---

## Обновление 2026-04-29 (Planning): Trust/Safety Plan Refresh
- **Trust/Safety Architecture**: `docs/trust_system_implementation_plan.md` переписан как отдельный слой платформы: личные блокировки, универсальные жалобы, evidence snapshot без plaintext и admin-очередь `/admin/reports`.
- **Development Plan Sync**: В `DEVELOPMENT_PLAN.md` обновлены пункты 11.5.4 и 11.5.12, чтобы не плодить отдельные модели блокировок и использовать единый `UserBlock`.
- **Chat Architecture Clarification**: В `docs/CHAT_ARCHITECTURE.md` уточнено, что текущий AES-256-GCM — это server-side at-rest encryption, а не end-to-end encryption.

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
- [x] **Фаза 6: ServiceListing & Security Hardening** (Завершено)
    - Полнофункциональный каталог услуг и поиск.
    - Личный кабинет исполнителя.
    - Модерация объявлений через Admin Actions.
    - **Security Audit & Remediation (Апрель 2026):**
        - Переход на распределенный Redis Rate Limiting (Async).
        - Внедрение `adminActionClient` для всех критических действий.
        - Единая система аудита с автоматическим захватом IP-адресов.
        - Полное устранение `any` в интеграции с Dadata.
- [ ] **Фаза 7: Чат и уведомления** (В процессе)
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

---

## Обновление 2026-04-29 (Infrastructure): Релокация портов Redis
- **Local Port Conflict Fix**: Для локальной разработки порт Redis проброшен на **6380** (в `docker-compose.yml` и `.env`). Это позволяет держать запущенными несколько проектов с Redis на одной машине без конфликтов.
- **Service Name Fix**: Внутреннее имя сервиса теперь `uslugi_redis`. В коде и Docker-сети используется стандартный порт **6379**.
- **Env Loading**: Исправлена критическая ошибка загрузки переменных в `server.ts` — теперь `dotenv` инициализируется ПЕРЕД запуском Redis-адаптера.
---

## Обновление 2026-04-29 (Security): Полное завершение аудита и релокация лимитов
- **Distributed Security**: Внедрен Redis-backed Rate Limiting для всех критических эндпоинтов. Теперь лимиты не сбрасываются при перезапуске контейнеров.
- **Admin Hardening**: Все административные Server Actions переведены на `adminActionClient`. Добавлен серверный Guard для защиты PII (Personal Identifiable Information).
- **Unified Audit**: Внедрена система `logAudit` с автоматическим определением IP (через `x-forwarded-for`) и структурированным JSON-хранилищем метаданных.
- **Zero Any Compliance**: Последние вхождения `any` удалены из интеграции Dadata и страниц управления заказами.
- **Quality Control**: Все изменения верифицированы через `npx tsc --noEmit` и `npm run test` (16 тестов).
- **Report**: Детальный отчет доступен в `docs/agent-reports/security-audit-report.md`.

---

## Обновление 2026-04-29 (Agent Protocol): Docs First Implementation
- **Docs First Mandatory**: В `agent-protocol/SKILL.md` добавлено правило №7: обязательная проверка актуальной документации через `context7`, `ref` или `search_web` перед написанием кода и при любых сомнениях.
- **Pre-flight Update**: В чеклист перед написанием кода добавлен пункт: "Сверился ли я с актуальной документацией?".
- **Instruction Sync**: Правило синхронизировано во всех входных файлах проекта: `AGENTS.md`, `GEMINI.md` и `CLAUDE.md`.
- **Goal**: Исключить ошибки из-за устаревших знаний LLM и обеспечить использование лучших практик 2026 года.
