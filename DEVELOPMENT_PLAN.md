# DEVELOPMENT PLAN: УслугиРядом

> Полная переработка проекта "Районный Мастер" → "УслугиРядом"
> Доска объявлений услуг для города: Desktop Web + React Native
> Дата создания: 2026-04-16

---

## Содержание

1. [Обзор проекта](#1-обзор-проекта)
2. [Текущий статус (снимок на 2026-04-17)](#текущий-статус-снимок-на-2026-04-17)
3. [Фаза 1 — Фундамент и ребрендинг](#фаза-1--фундамент-и-ребрендинг-2-недели)
4. [Фаза 2 — Новая система авторизации](#фаза-2--auth--security-system-завершена-x)
5. [Фаза 3 — Эволюция модели данных](#фаза-3--эволюция-модели-данных-1-неделя--частично)
6. [Фаза 4 — REST API слой](#фаза-4--rest-api-слой-15-недели)
7. [Фаза 5 — Desktop Web UI](#фаза-5--desktop-web-ui-3-недели)
8. [Фаза 6 — Объявления от исполнителей](#фаза-6--объявления-от-исполнителей-15-недели)
9. [Фаза 7 — Чат и уведомления](#фаза-7--чат-и-уведомления-2-недели)
10. [Фаза 8 — Тесты и CI/CD](#фаза-8--тесты-и-cicd-1-неделя)
11. [Фаза 9 — React Native (Expo)](#фаза-9--react-native-expo-3-4-недели)
12. [Фаза 10 — Geo-поиск и мульти-город](#фаза-10--geo-поиск-и-мульти-город-15-недели)
13. [Фаза 11 — Полировка и запуск](#фаза-11--полировка-и-запуск-1-неделя)
14. [Фаза 11.5 — Расширенная функциональность (YouDo-scope)](#фаза-115--расширенная-функциональность-youdo-scope-2-3-недели)
15. [Фаза 12 — Монетизация MVP](#фаза-12--монетизация-mvp-15-недели)
16. [KPI и метрики запуска](#kpi-и-метрики-запуска)
17. [Прод-инфраструктура (cross-cutting)](#прод-инфраструктура-cross-cutting-по-ходу-фаз-8-11)
18. [Сводная карта зависимостей](#сводная-карта-зависимостей)

---

## 1. Обзор проекта

### Что было (Районный Мастер)
- Telegram Web App для поиска мастеров по ремонту
- Авторизация только через Telegram
- Мобильный UI, заточенный под TWA
- Один поток: заказчик создаёт задачу → мастер откликается

### Что будет (УслугиРядом)
- **Концепт YouDo:** проект должен быть похож на https://youdo.com, но с нашими изменениями и особенностями
- **Полноценная доска услуг** для города — любые услуги, не только ремонт
- **Desktop-first** веб-приложение с адаптивным дизайном
- **React Native** мобильное приложение (Expo)
- **Два потока:**
  1. Заказ — пользователь создаёт задачу, исполнители откликаются
  2. Объявление — исполнитель публикует услугу, клиенты находят
- **Мульти-город** — поддержка нескольких городов с самого начала
- **Множественная авторизация** — email/телефон + Telegram + OAuth

### Что переиспользуем из текущей базы
- **Архитектура и структура кода:** можно брать за основу реализацию FSD-модулей из `buhgalter-box` (`C:\Users\drobi\Desktop\projects\antigraviti\buhgalter-box`), в частности:
  - Систему защиты роутинга и мидлварей (`src/proxy.ts`)
  - Паттерны для безопасных Server Actions (`shared/lib/create-safe-action.ts`)
  - Модули авторизации и доступа к данным (`features/auth`, `shared/lib/auth.ts`, `shared/lib/dal.ts`)
  - Вспомогательные утилиты: rate limits, пагинация, почта, загрузка файлов (`shared/lib/rate-limit.ts`, `pagination.ts`, `server-upload.ts` и др.)
  - Паттерны слоев (`widgets/sidebar`, `widgets/dashboard-layout`)
- Prisma-схема (с миграциями под новую модель)
- Бизнес-логика server actions (вынесем в сервисный слой)
- Админка (~90% готова)
- Docker-инфраструктура (PostgreSQL/PostGIS, docker-compose)
- Shared UI компоненты (Shadcn — адаптируем под десктоп)
- Утилиты: rate-limit, file-storage, safe-action, JWT

### Ключевая терминология

| Было | Стало | Комментарий |
|---|---|---|
| Master / Мастер | Provider / Исполнитель | Любой, кто оказывает услуги |
| MasterProfile | ProviderProfile | Профиль исполнителя |
| become-master | become-provider | Стать исполнителем |
| TaskRequest | Order | Заказ от пользователя |
| TaskResponse | Proposal | Отклик/предложение исполнителя |
| — (новое) | ServiceListing | Объявление об услуге от исполнителя |

### Основные принципы и стандарты (Global Rules)

При разработке строго соблюдаются следующие глобальные стандарты (Next.js 16+, архитектура Enterprise-уровня):

1. **Архитектура Feature-Sliced Design (FSD):**
   - `shared/` (low-level, UI, libs).
   - `features/` (изолированные доменные модули — `auth`, `chat`).
   - `widgets/` (блоки интерфейса — `Header`, `Sidebar`).
   - `app/` (тонкие обертки для роутинга).
2. **Next.js 16+ Standards:**
   - **Proxy over Middleware:** используем `src/proxy.ts` (только легковесные проверки). Вся логика в Server Actions / DAL.
   - **Server Components:** все компоненты серверные по умолчанию. `'use client'` только для интерактивности.
   - Мутации данных **строго** через Server Actions. API Routes (`route.ts`) — только вебхуки/внешние интеграции.
3. **Безопасность (Enterprise Grade):**
   - **Zero Trust:** все входящие данные валидируются через Zod.
   - JWT сессии строго в `httpOnly`, `Secure`, `SameSite=Lax` cookies. `localStorage` запрещен.
   - Строгий `select` в Prisma. Не возвращать полные PII-модели и парольные хеши на клиент.
   - Обязательно оборачивать мутации в `createSafeAction`.
4. **Управление состоянием и Пагинация:**
   - **Серверная пагинация (Критично):** все списки (более 50 элементов) рендерятся и пагинируются сервером (skip/take). Клиентская пагинация недопустима для динамических списков!
   - Состояние интерфейса: параметры (открытые поп-апы) — в Zustand, фильтры/пагинация — в URL (`searchParams`) для share-ability и збережения контекста.
5. **UI, Стилизация и Эстетика:**
   - **Дизайн-код 2026 года:** легкий, минималистичный и интуитивно понятный интерфейс, не перегруженный лишними деталями ("воздушный дизайн").
   - Обязательная поддержка переключения тем (Светлая / Темная) с сохранением выбора пользователя (с использованием, например, `next-themes`).
   - Библиотеки: **Shadcn UI** (SSOT стилей без хардкода за пределами компонентов), **Tailwind CSS** + `cn()`, **Lucide React**.
   - Анимации: плавные, естественные, не отвлекающие внимание макро- и микро-анимации. Простые — Tailwind (`transition-all`, `animate-in`), сложные — **Motion**. Оповещения — **Sonner**.

---

## Текущий статус (снимок на 2026-04-17)

### Что реально сделано (Обновлено 2026-04-18)
- **Монорепо:** Turborepo, `apps/web`, `apps/mobile` (пустой), `packages/{shared-types, validation, api-client}` — созданы.
- **Ребрендинг:** Prisma-схема переведена (Master→Provider, TaskRequest→Order, TaskResponse→Proposal).
- **Авторизация (Auth.js v5):**
  - Email + Password (регистрация, верификация, логин, сброс пароля) — **OK**.
  - Telegram Login (Desktop Widget + TWA) — **OK**.
  - **Исправлено:** Логика объединения аккаунтов (Telegram + Email) теперь обходит `Unique constraint` через транзакционный сброс ID.
  - **Исправлено:** Runtime-конфигурация `BOT_ID` (теперь передается как проп, а не берется из build-time env).
- **Безопасность:** `next-safe-action` внедрён. Мутации защищены.
- **Инфраструктура (Локальная):**
  - Скрипт `npm run dev:full` полностью автоматизирован: чистит порты (3000, 4040), ждет готовности Postgres, активирует PostGIS.
  - База данных синхронизирована под именем `uslugi_db`.
- **Инфраструктура (Прод):** Docker multi-stage, авто-резолв `P3009`.

### Что запланировано, но НЕ сделано (или сделано частично)

| Фаза | Статус | Что осталось |
|---|---|---|
| 3. Модель данных | ✅ завершена | Все модели (City, Category tree, ServiceListing, Order, Proposal) полностью синхронизированы, PostGIS настроен, сиды исправлены. |
| 4. REST API | ⚠️ в процессе | Сервисный слой (`src/services/`) полностью реализован. Осталось создать HTTP эндпоинты `app/api/v1/*`. |
| 5. Desktop UI | ❌ | Маршрутизация всё ещё `/dashboard/*` (наследие TWA). Нет groups `(main)`/`(auth)`. Widgets только `CategoryGrid`, `OrderFeed`. Нет Header/Sidebar/Footer/BottomNav, темы-переключения, Inter-шрифта. |
| 6. Объявления | ❌ | Feature `listing/` не создан, страниц каталога нет. Admin-модерация listings — нет. |
| 7. Чат | ❌ | Моделей `Conversation`, `ConversationParticipant`, `Message` нет. |
| 8. Тесты/CI | ❌ | Vitest/Playwright не установлены. `.github/workflows/*` — требуют проверки. |
| 9. React Native | ❌ | `apps/mobile/src` — пустой. Expo не инициализирован. |
| 10. Geo/мульти-город | ❌ | Зависит от Фазы 3 (`City`). PostGIS запросы не реализованы. |
| 11. Полировка | ❌ | SEO, sitemap, Sentry, PWA-manifest — не сделано. |

### Критичный следующий шаг
**Фаза 4.2.** Создание REST API эндпоинтов на базе готовых сервисов для мобильного приложения.

### Принятые архитектурные решения (фиксация)
- **Auth.js v5 (next-auth@beta)** вместо кастомного JWT-слоя. Session-стратегия: JWT (для Edge-совместимости). Схема БД — расширенная стандартная (`Account`, `Session`, `VerificationToken`).
- **`next-safe-action`** вместо самописного `createSafeAction` — паттерн из `buhgalter-box` заменён библиотекой.
- **AuditLog** — отдельная модель для логирования критических действий (смены ролей, банов, модерации). Не было в оригинальном плане.
- **Alpine-образ + `@tailwindcss/oxide-linux-x64-musl`** — фикс нативного бинарника Tailwind 4 в проде (`48d796f`).
- **Авто-резолв `P3009`** зафейленных миграций при старте контейнера (`ea1e345`) — решает прод-инцидент с битыми миграциями.
- **Email-сервис сейчас mock** (логирует в `email-debug.log`) — в Фазе 8/11 заменить на прод SMTP.

### Консолидация документов
- `DEVELOPMENT_PLAN.md` (этот документ) — **единый источник правды** для пивота на УслугиРядом.
- `ROADMAP.md` и `docs/04_Status_and_Roadmap.md` — **устарели** (описывают «Районный Мастер»), помечены баннерами deprecated. Не использовать для принятия решений.

---

## Фаза 1 — Фундамент и ребрендинг (2 недели)

### 1.1 — Структура монорепо

Для того чтобы web и mobile делили типы, валидацию и API-контракты, переходим на monorepo через Turborepo.

**Целевая структура:**

```
uslugi-ryadom/
├── apps/
│   ├── web/                    # Next.js (текущий проект, переработанный)
│   │   ├── src/
│   │   │   ├── app/            # App Router pages
│   │   │   ├── features/       # FSD features
│   │   │   ├── entities/       # FSD entities
│   │   │   ├── widgets/        # FSD widgets
│   │   │   └── shared/         # Web-specific shared (UI, hooks)
│   │   ├── public/
│   │   ├── prisma/
│   │   ├── next.config.ts
│   │   └── package.json
│   │
│   └── mobile/                 # React Native (Expo) — Фаза 9
│       ├── src/
│       ├── app.json
│       └── package.json
│
├── packages/
│   ├── shared-types/           # Общие TypeScript типы
│   │   ├── src/
│   │   │   ├── domain.ts       # Order, Proposal, ServiceListing, Provider...
│   │   │   ├── auth.ts         # SessionPayload, AuthProvider
│   │   │   ├── api.ts          # API request/response types
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── validation/             # Zod-схемы (shared между web и mobile)
│   │   ├── src/
│   │   │   ├── order.ts        # createOrderSchema, updateOrderSchema
│   │   │   ├── proposal.ts     # createProposalSchema
│   │   │   ├── listing.ts      # createListingSchema
│   │   │   ├── auth.ts         # loginSchema, registerSchema
│   │   │   ├── profile.ts      # updateProfileSchema, providerProfileSchema
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── api-client/             # Типизированный API-клиент (для mobile)
│       ├── src/
│       │   ├── client.ts       # fetch wrapper с auth
│       │   ├── orders.ts       # ordersApi.create(), .list(), .getById()
│       │   ├── proposals.ts
│       │   ├── listings.ts
│       │   ├── auth.ts
│       │   └── index.ts
│       └── package.json
│
├── turbo.json
├── package.json                # Workspaces root
├── docker-compose.yml
└── DEVELOPMENT_PLAN.md
```

**Шаги:**

```
[x] 1.1.1  Инициализировать Turborepo в корне проекта
       - npm install turbo --save-dev (в корне)
       - Создать turbo.json с pipeline: build, dev, lint, test
       - Настроить workspaces в корневом package.json:
         "workspaces": ["apps/*", "packages/*"]

[x] 1.1.2  Перенести текущий Next.js проект в apps/web/
       - Переместить все файлы (src/, prisma/, public/, next.config.ts, etc.)
       - Обновить пути в tsconfig.json, next.config.ts
       - Обновить Dockerfile (контекст сборки)
       - Обновить docker-compose.yml (build.context)
       - Проверить что `npm run dev` работает из apps/web/

[x] 1.1.3  Создать пакет packages/shared-types/
       - package.json с name "@uslugi/shared-types"
       - tsconfig.json
       - Пока пустой src/index.ts — заполним в Фазе 3

[x] 1.1.4  Создать пакет packages/validation/
       - package.json с name "@uslugi/validation", dependency: zod
       - tsconfig.json
       - Пока пустой src/index.ts — заполним в Фазе 3

[x] 1.1.5  Проверить что всё собирается:
       - turbo run build
       - turbo run dev (запускается web)
       - docker-compose up --build (деплой работает)
```

### 1.2 — Ребрендинг: переименование сущностей

Глобальное переименование в коде. Делаем **ПОСЛЕ** переезда в monorepo.

**Файлы, которые затрагиваются:**

```
[x] 1.2.1  Prisma-схема (apps/web/prisma/schema.prisma)
       
       Переименования моделей:
       - MasterProfile    → ProviderProfile
       - MasterCategory   → ProviderCategory
       - TaskRequest      → Order
       - TaskResponse     → Proposal
       
       Переименования полей:
       - User.masterProfile       → User.providerProfile
       - Order.customerId         → Order.clientId (заказчик → клиент)
       - Order.customer           → Order.client
       - Order.assignedMasterId   → Order.assignedProviderId
       - Order.assignedMaster     → Order.assignedProvider
       - Proposal.masterId        → Proposal.providerId
       - Review.masterId          → Review.providerId
       - Notification: NEW_TASK   → NEW_ORDER
       
       Переименования enum:
       - Role: MASTER → PROVIDER
       
       Новые поля (пока просто добавить, логику позже):
       - User.email         String?  @unique
       - User.displayName   String?
       - User.isBanned      Boolean  @default(false)
       - User.authProvider   AuthProvider @default(TELEGRAM)
       - User.passwordHash  String?   (уже есть)
       
       Новый enum:
       - enum AuthProvider { TELEGRAM, EMAIL, GOOGLE, PHONE }
       
       !!! ВАЖНО: создать миграцию !!!
       npx prisma migrate dev --name rebrand_to_uslugi_ryadom

[x] 1.2.2  Переименование в features/
       
       Директории:
       - features/master-registration/ → features/provider-registration/
       - features/task-creation/       → features/order-creation/
       - features/task-response/       → features/proposal/
       - features/task-view/           → features/order-view/
       
       Файлы внутри каждой feature — обновить импорты и названия функций:
       - saveMasterProfileAction  → saveProviderProfileAction
       - createOrderAction        (название уже хорошее, оставить)
       - respondToTaskAction      → submitProposalAction
       - acceptResponseAction     → acceptProposalAction
       - completeTaskAction       → completeOrderAction
       - cancelTaskAction         → cancelOrderAction
       
       Zod-схемы:
       - taskSchema               → orderSchema  
       - responseSchema           → proposalSchema
       - masterProfileSchema      → providerProfileSchema

[x] 1.2.3  Переименование в entities/
       - entities/task/  → entities/order/
       - TaskCard.tsx    → OrderCard.tsx
       - TaskCardBase    → OrderCardBase
       - TaskListItem    → OrderListItem

[x] 1.2.4  Переименование в widgets/
       - widgets/TaskFeed/     → widgets/OrderFeed/
       - TaskFeed.tsx          → OrderFeed.tsx
       - TaskFeedClient.tsx    → OrderFeedClient.tsx
       - loadTasksAction       → loadOrdersAction

[x] 1.2.5  Переименование в app/ (роуты)
       - app/dashboard/create-task/    → app/dashboard/create-order/
       - app/dashboard/my-tasks/       → app/dashboard/my-orders/
       - app/dashboard/my-responses/   → app/dashboard/my-proposals/
       - app/dashboard/task/[id]/      → app/dashboard/order/[id]/
       - app/dashboard/masters/[id]/   → app/dashboard/provider/[id]/
       - app/dashboard/become-master/  → app/dashboard/become-provider/
       - app/admin/master-applications → app/admin/provider-applications/
       
[x] 1.2.6  Переименование в shared/
       - shared/types/domain.ts: TaskCardData → OrderCardData, MasterStats → ProviderStats
       - shared/lib/telegram/bot-notify.ts: notifyMastersInCategories → notifyProvidersInCategories
       - shared/lib/jobs/expire-tasks.ts → expire-orders.ts
       
[x] 1.2.7  Обновить все импорты (grep + replace)
       Ключевые паттерны для замены:
       - "master" → "provider" (в путях и переменных, учитывая контекст)
       - "task-request" / "taskRequest" → "order"
       - "task-response" / "taskResponse" → "proposal"
       - "TaskRequest" → "Order" (в Prisma-вызовах: prisma.order.*)
       - "TaskResponse" → "Proposal" (prisma.proposal.*)
       - "MasterProfile" → "ProviderProfile" (prisma.providerProfile.*)
       
[x] 1.2.8  Обновить тексты UI на русском:
       - "Мастер" → "Исполнитель"
       - "Стать мастером" → "Стать исполнителем"
       - "Отклик" → "Предложение"
       - "Задача" / "Задание" → "Заказ"
       - "Районный Мастер" → "УслугиРядом"
       
[x] 1.2.9  Запустить проект, убедиться что нет ошибок:
       - npx tsc --noEmit (проверка типов)
       - npm run build (сборка)
       - npm run dev + проверить ключевые страницы
```

### 1.3 — Обновление метаданных проекта

```
[x] 1.3.1  Обновить package.json:
       - name: "uslugi-ryadom" (корневой)
       - name: "@uslugi/web" (apps/web/)
       
[x] 1.3.2  Обновить app/layout.tsx metadata:
       - title: "УслугиРядом — услуги рядом с вами"
       - description: "Доска объявлений услуг в вашем городе"
       - og:title, og:description, og:siteName
       
[x] 1.3.3  Обновить docker-compose.yml:
       - Название сервисов: masters-app → uslugi-web
       - Название образа: masters-app → uslugi-ryadom
       
[x] 1.3.4  Обновить .env.example:
       - Добавить новые переменные (пока с комментариями):
         # Auth
         GOOGLE_CLIENT_ID=
         GOOGLE_CLIENT_SECRET=
         SMTP_HOST=           # для email-авторизации
         SMTP_PORT=
         SMTP_USER=
         SMTP_PASS=
         # Multi-city
         DEFAULT_CITY=moscow
```

---

## Фаза 2 — Auth & Security System (Завершена) [x]

### 2.1 — Миграция на Auth.js (v5)

[x] 2.1.1  Интеграция Auth.js и PrismaAdapter:
       - Установка `next-auth@beta`, `@auth/prisma-adapter`
       - Настройка `src/auth.ts` и `src/auth.config.ts`
       - Поддержка Telegram Credentials Provider

[x] 2.1.2  Обновление модели данных:
       - Добавление таблиц `Account`, `Session`, `VerificationToken`
       - Расширение модели `User` под стандарты Auth.js

[x] 2.1.3  Безопасные сессии и Proxy:
       - Обновление `src/proxy.ts` для проверки сессий Auth.js
       - Переход на JWT-стратегию сессий для совместимости с Edge

[x] 2.1.4  Safe Actions (Security Layer):
       - Внедрение `next-safe-action`
       - Создание `authActionClient` и `adminActionClient`
       - Рефакторинг `createOrderAction` под новый стандарт

[x] 2.1.5  Refactoring remaining actions:
       - Перевести `proposal`, `moderate-order`, `review` на `safe-action` (Выполнено)

### 2.2 — Схема БД для мульти-авторизации

```
[x] 2.2.1  Обновить prisma/schema.prisma:

       // Новая модель — привязка аккаунтов
       model Account {
         id                String  @id @default(uuid())
         userId            String
         user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)
         
         provider          AuthProvider    // TELEGRAM, EMAIL, GOOGLE, PHONE
         providerAccountId String          // telegramId, email, googleId, phone
         
         // Для OAuth:
         accessToken       String?
         refreshToken      String?
         tokenExpires      DateTime?
         
         createdAt         DateTime @default(now())
         
         @@unique([provider, providerAccountId])
         @@index([userId])
       }
       
       enum AuthProvider {
         TELEGRAM
         EMAIL
         GOOGLE
         PHONE
       }
       
       // Обновить User:
       model User {
         // ... существующие поля
         email         String?   @unique
         displayName   String?
         isBanned      Boolean   @default(false)
         emailVerified Boolean   @default(false)
         
         accounts      Account[]   // Привязанные аккаунты (новое)
         // telegramId  оставляем для обратной совместимости
       }
       
[x] 2.2.2  Создать миграцию:
       npx prisma migrate dev --name add_multi_auth
```

### 2.3 — Email + Password авторизация

```
[x] 2.3.1  Создать features/auth/api/register-email.ts (через Auth.js + src/features/auth/model/actions.ts):
       
       Server Action: registerWithEmail(data)
       - Входные данные: { email, password, displayName }
       - Валидация: Zod (email формат, password 8+ символов, displayName 2-50)
       - Проверить что email не занят
       - Хэшировать пароль (bcrypt, rounds: 12)
       - Создать User + Account (provider: EMAIL, providerAccountId: email)
       - НЕ создавать сессию сразу — требовать верификацию email
       - Отправить verification email (см. 2.3.4)
       - Return { success: true, message: "Проверьте почту" }

[x] 2.3.2  Создать features/auth/api/login-email.ts (интегрировано в Auth.js):
       
       Server Action: loginWithEmail(data)
       - Входные данные: { email, password }
       - Найти Account с provider: EMAIL, providerAccountId: email
       - Проверить bcrypt.compare(password, user.passwordHash)
       - Проверить emailVerified === true
       - Проверить isBanned === false
       - Rate-limit: 5 попыток за 60 секунд по email
       - Создать JWT сессию (существующий createSession)
       - Return { success: true }

[x] 2.3.3  Создать features/auth/api/verify-email.ts (verifyEmailAction):
       
       Server Action: verifyEmail(token)
       - Декодировать JWT-токен верификации (отдельный секрет)
       - Найти пользователя, обновить emailVerified: true
       - Создать сессию (автологин после верификации)
       - Redirect на /dashboard

[x] 2.3.4  Создать shared/lib/email/send-email.ts (Mock implementation):
       
       Утилита для отправки email через SMTP (nodemailer):
       - sendVerificationEmail(to, token)
       - sendPasswordResetEmail(to, token)
       
       Шаблоны:
       - Верификация: "Подтвердите ваш email — УслугиРядом"
       - Сброс пароля: "Восстановление пароля — УслугиРядом"
       
       Зависимость: npm install nodemailer @types/nodemailer

[x] 2.3.5  Создать features/auth/api/forgot-password.ts (requestPasswordReset):
       
       Server Action: forgotPassword({ email })
       - Найти пользователя по email
       - Сгенерировать JWT-токен сброса (1 час TTL)
       - Отправить email
       - Всегда возвращать { success: true } (не раскрывать существование аккаунта)

[x] 2.3.6  Создать features/auth/api/reset-password.ts (resetPasswordAction):
       
       Server Action: resetPassword({ token, newPassword })
       - Декодировать JWT
       - Обновить passwordHash
       - Инвалидировать все сессии (опционально)
       - Redirect на /login
```

### 2.4 — Рефакторинг Telegram авторизации [х]

```
[x] 2.4.1  Обновить features/auth/model/actions.ts — loginWithTelegram:
       - При первом входе: создать Account { provider: TELEGRAM, providerAccountId: telegramId }
       - При повторном входе: найти Account → получить userId → создать сессию
       - **OK:** Исправлен баг `Unique constraint failed (telegramId)` при объединении.

[x] 2.4.2  Обновить features/auth/ui/TelegramAuth.tsx:
       - Вынести в отдельную кнопку "Войти через Telegram"
       - Работает только внутри Telegram WebApp (проверка window.Telegram)
       - На десктопе показывать Telegram Login Widget

[x] 2.4.3  Создать features/auth/ui/TelegramLoginWidget.tsx:
       - Для десктопа: Telegram Login Widget (кнопка на сайте)
       - **OK:** Исправлен баг с `undefined` BOT_ID через runtime пропсы.

[x] 2.4.4  Создать app/api/auth/telegram/callback/route.ts:
       - GET handler — принимает данные от Telegram Login Widget
       - Валидация hash
       - Upsert User + Account
       - Создать сессию
       - Redirect на /dashboard
```

### 2.5 — Google OAuth [skip] (отменён 2026-04-17)

Отказались от Google OAuth в пользу упрощения auth-flow: остаются Email (пароль + верификация) и Telegram Login. Причина: Google требовал поддержки домена + OAuth consent screen и давал минимум пользы при наличии Telegram/Email. Решение продуктовое, обратимо (можно включить обратно за час).

### 2.6 — UI авторизации (Desktop) [x]

```
[x] 2.6.1  Создать app/(auth)/login/page.tsx (Унифицированная Glassmorphic страница):
       
       Десктопная страница логина:
       ┌─────────────────────────────────────┐
       │           УслугиРядом               │
       │                                     │
       │  ┌─────────────────────────────┐    │
       │  │  Email                      │    │
       │  ├─────────────────────────────┤    │
       │  │  Пароль                     │    │
       │  ├─────────────────────────────┤    │
       │  │  [ Войти ]                  │    │
       │  │                             │    │
       │  │  Забыли пароль?             │    │
       │  │                             │    │
       │  │  ── или ──                  │    │
       │  │                             │    │
       │  │  [🔵 Войти через Telegram]  │    │
       │  │                             │    │
       │  │  Нет аккаунта? Регистрация  │    │
       │  └─────────────────────────────┘    │
       └─────────────────────────────────────┘

2.6.2  Создать app/(auth)/register/page.tsx:
       
       Форма регистрации:
       - Имя (displayName)
       - Email
       - Пароль
       - Подтверждение пароля
       - Кнопка "Зарегистрироваться"
       - Ссылки: "Уже есть аккаунт? Войти"

2.6.3  Создать app/(auth)/verify-email/page.tsx:
       - Страница "Проверьте вашу почту"
       - Кнопка "Отправить повторно"

2.6.4  Создать app/(auth)/reset-password/page.tsx:
       - Форма ввода нового пароля (по токену из URL)
       
2.6.5  Создать app/(auth)/layout.tsx:
       - Чистый layout без sidebar
       - Центрированная карточка
       - Логотип сверху
```

### 2.7 — Обновление middleware

```
2.7.1  Обновить proxy.ts:
       
       Текущие правила (оставить):
       - /dashboard/* → требует сессию
       - /admin/* → требует роль ADMIN
       
       Новые правила:
       - /login, /register, /verify-email → публичные
       - /api/auth/* → публичные (OAuth callbacks)
       - /api/v1/* → проверка Bearer token (для mobile)
       
       Для mobile API (Фаза 4):
       - Помимо cookie-сессии поддерживать Authorization: Bearer <jwt>
       - Один и тот же JWT, но передаётся в header вместо cookie
       
2.7.2  Обновить shared/lib/auth.ts — getSession():
       
       function getSession() {
         // 1. Проверить cookie (web)
         const cookieSession = cookies().get("session")
         if (cookieSession) return decrypt(cookieSession.value)
         
         // 2. Проверить Authorization header (mobile)
         const authHeader = headers().get("Authorization")
         if (authHeader?.startsWith("Bearer "))
           return decrypt(authHeader.slice(7))
         
         return null
       }
```

---

## Фаза 3 — Эволюция модели данных (1 неделя) [⚠️ частично]

> **Статус:** модель `ServiceListing` добавлена в обрезанном виде (только `providerId`, `categoryId`, `title`, `description`, `price`, `images`). Мульти-город (`City`) и расширение `Category` не начаты. Shared-типы/валидации в пакетах — не наполнены.
> **Стратегия:** одна большая миграция `expand_domain_model` (City + CityCategory + расширение Category) + отдельная миграция `expand_service_listing` (нормализация существующей модели). Seed — отдельно.

### 3.1 — Мульти-город

```
3.1.1  Добавить в prisma/schema.prisma:

       model City {
         id        String   @id @default(cuid())
         name      String   @unique    // "Москва"
         slug      String   @unique    // "moscow"
         region    String?              // "Московская область"
         
         location  Unsupported("geometry(Point, 4326)")?  // центр города
         
         users     User[]
         orders    Order[]
         listings  ServiceListing[]
         categories CityCategory[]      // какие категории популярны в городе
         
         isActive  Boolean  @default(true)
         createdAt DateTime @default(now())
       }
       
       // Связь города с категориями (для популярных/рекомендуемых)
       model CityCategory {
         cityId     String
         city       City     @relation(fields: [cityId], references: [id])
         categoryId String
         category   Category @relation(fields: [categoryId], references: [id])
         sortOrder  Int      @default(0)
         
         @@id([cityId, categoryId])
       }

3.1.2  Обновить модель User:
       - Добавить cityId String? + relation к City
       - Город определяется при регистрации или в настройках

3.1.3  Обновить модель Order:
       - Добавить cityId String + relation к City
       - Город обязателен при создании заказа

3.1.4  Создать миграцию:
       npx prisma migrate dev --name add_multi_city

3.1.5  Seed: начальные города
       Создать prisma/seed-cities.ts:
       - Москва, Санкт-Петербург, Новосибирск, Екатеринбург, Казань
       - (или начать с одного города для MVP)
```

### 3.2 — Расширение категорий

```
3.2.1  Обновить модель Category:
       
       model Category {
         id          String  @id @default(cuid())
         name        String  @unique
         slug        String  @unique       // НОВОЕ: для URL
         icon        String?
         description String?               // НОВОЕ: описание категории
         parentId    String?               // НОВОЕ: подкатегории
         parent      Category? @relation("SubCategories", fields: [parentId], references: [id])
         children    Category[] @relation("SubCategories")
         
         sortOrder   Int     @default(0)   // НОВОЕ: порядок отображения
         isActive    Boolean @default(true) // НОВОЕ: скрыть категорию
         
         orders      Order[]
         providers   ProviderCategory[]
         listings    ServiceListing[]       // НОВОЕ (Фаза 6)
         cities      CityCategory[]
       }

3.2.2  Seed: универсальный набор категорий
       Создать prisma/seed-categories.ts:

       Основные категории:
       ├── Ремонт и строительство
       │   ├── Сантехника
       │   ├── Электрика
       │   ├── Отделочные работы
       │   ├── Мебель на заказ
       │   └── Кондиционеры
       ├── Уборка
       │   ├── Квартиры
       │   ├── Офисы
       │   ├── После ремонта
       │   └── Химчистка мебели
       ├── Красота и здоровье
       │   ├── Парикмахер
       │   ├── Маникюр/педикюр
       │   ├── Массаж
       │   └── Косметолог
       ├── Репетиторы и обучение
       │   ├── Математика
       │   ├── Английский
       │   ├── Программирование
       │   └── Музыка
       ├── Авто
       │   ├── Ремонт
       │   ├── Мойка
       │   ├── Шиномонтаж
       │   └── Эвакуатор
       ├── Перевозки и доставка
       │   ├── Грузоперевозки
       │   ├── Переезды
       │   └── Курьер
       ├── IT и техника
       │   ├── Ремонт компьютеров
       │   ├── Настройка ПО
       │   ├── Создание сайтов
       │   └── Видеонаблюдение
       ├── Фото и видео
       │   ├── Фотограф
       │   ├── Видеограф
       │   └── Монтаж
       ├── Юристы и финансы
       │   ├── Консультация юриста
       │   ├── Бухгалтерия
       │   └── Оценка имущества
       └── Другое
           ├── Няни и сиделки
           ├── Выгул собак
           ├── Организация праздников
           └── Прочее

3.2.3  Создать миграцию:
       npx prisma migrate dev --name expand_categories
```

### 3.3 — Модель объявления (ServiceListing) [⚠️ частично — требует нормализации]

> **Фактически в schema.prisma:** минимальная модель `ServiceListing { id, providerId, categoryId, title, description, price, images, createdAt, updatedAt }`. Отсутствуют: `cityId`, `status`, `priceFrom/priceTo/priceUnit`, `location`, `address`, `views`, индексы, enums `ListingStatus`/`PriceUnit`.
>
> **План миграции `expand_service_listing`:**
> - Добавить enums `ListingStatus { ACTIVE, PAUSED, ARCHIVED, MODERATION, REJECTED }`, `PriceUnit { PER_HOUR, PER_SERVICE, PER_METER, NEGOTIABLE }`.
> - Добавить поля: `cityId String` (FK → City), `status ListingStatus @default(ACTIVE)`, `priceFrom Float?`, `priceTo Float?`, `priceUnit PriceUnit?`, `location Unsupported("geometry(Point, 4326)")?`, `address String?`, `views Int @default(0)`.
> - Удалить поле `price` (единое) — вместо него `priceFrom/priceTo/priceUnit`. Если есть данные — скопировать в `priceFrom`.
> - Индексы: `@@index([cityId, categoryId, status])`, `@@index([providerId])`.

```
3.3.1  Добавить в prisma/schema.prisma:

       model ServiceListing {
         id          String   @id @default(cuid())
         
         providerId  String
         provider    ProviderProfile @relation(fields: [providerId], references: [id])
         
         categoryId  String
         category    Category @relation(fields: [categoryId], references: [id])
         
         cityId      String
         city        City     @relation(fields: [cityId], references: [id])
         
         title       String              // "Установка кондиционеров"
         description String              // Подробное описание услуги
         images      String[]            // Фото работ
         
         priceFrom   Float?              // Цена от
         priceTo     Float?              // Цена до
         priceUnit   PriceUnit?          // За что цена
         
         status      ListingStatus @default(ACTIVE)
         
         views       Int      @default(0)
         
         location    Unsupported("geometry(Point, 4326)")?
         address     String?
         
         createdAt   DateTime @default(now())
         updatedAt   DateTime @updatedAt
         
         @@index([cityId, categoryId, status])
         @@index([providerId])
       }
       
       enum ListingStatus {
         ACTIVE
         PAUSED
         ARCHIVED
         MODERATION  // На модерации
         REJECTED
       }
       
       enum PriceUnit {
         PER_HOUR      // за час
         PER_SERVICE   // за услугу
         PER_METER     // за м²
         NEGOTIABLE    // договорная
       }
       
       // Обновить ProviderProfile:
       model ProviderProfile {
         // ... существующие поля
         listings    ServiceListing[]    // НОВОЕ
       }

3.3.2  Создать миграцию:
       npx prisma migrate dev --name add_service_listings
```

### 3.4 — Вынести shared-типы в пакет

```
3.4.1  Наполнить packages/shared-types/src/domain.ts:
       
       // Типы для API responses
       export interface OrderCard {
         id: string
         title: string
         description: string
         budget: number | null
         address: string | null
         status: OrderStatus
         category: { id: string; name: string; icon: string | null }
         city: { id: string; name: string }
         client: { displayName: string; avatar: string | null }
         images: string[]
         proposalCount: number
         createdAt: string
       }
       
       export interface ListingCard {
         id: string
         title: string
         description: string
         priceFrom: number | null
         priceTo: number | null
         priceUnit: PriceUnit | null
         images: string[]
         category: { id: string; name: string }
         provider: { displayName: string; avatar: string | null; rating: number }
         city: { id: string; name: string }
         views: number
         createdAt: string
       }
       
       export interface ProviderCard {
         id: string
         displayName: string
         avatar: string | null
         bio: string | null
         rating: number
         reviewCount: number
         categories: { id: string; name: string }[]
         completedOrders: number
         isVerified: boolean
       }
       
       // ... и другие типы

3.4.2  Наполнить packages/validation/src/:
       - Перенести Zod-схемы из features в пакет
       - Экспортировать для использования в web и mobile
```

---

## Фаза 4 — REST API слой (1.5 недели)

### Цель
Создать REST API, который будут использовать:
1. React Native приложение (через fetch)
2. Возможные внешние интеграции

Web-приложение продолжает использовать Server Actions напрямую (они эффективнее для SSR).

### 4.1 — Сервисный слой (извлечение бизнес-логики)

Сейчас бизнес-логика живёт в Server Actions. Нужно вынести её в **сервисы**, чтобы и Server Actions, и REST API могли её использовать.

```
4.1.1  Создать apps/web/src/services/ (новая директория):
       
       services/
       ├── order.service.ts
       ├── proposal.service.ts
       ├── listing.service.ts
       ├── provider.service.ts
       ├── auth.service.ts
       ├── user.service.ts
       ├── review.service.ts
       ├── notification.service.ts
       ├── category.service.ts
       ├── city.service.ts
       └── upload.service.ts

4.1.2  Пример: order.service.ts
       
       export const orderService = {
         async create(data: CreateOrderInput, userId: string) {
           // Текущая логика из createOrderAction
           // БЕЗ revalidatePath, БЕЗ rate-limit (это обёртка добавит)
         },
         
         async getById(id: string, userId?: string) { ... },
         
         async list(params: OrderListParams) {
           // Текущая логика из loadTasksAction
         },
         
         async getByClient(userId: string, params: PaginationParams) { ... },
         
         async accept(orderId: string, proposalId: string, userId: string) { ... },
         
         async complete(orderId: string, userId: string) { ... },
         
         async cancel(orderId: string, userId: string) { ... },
       }

4.1.3  Рефакторинг существующих Server Actions:
       
       // БЫЛО (в features/order-creation/api/create-order-action.ts):
       export async function createOrderAction(data) {
         const user = await getCurrentUser()
         // ... вся логика здесь
         revalidatePath("/dashboard")
       }
       
       // СТАЛО:
       export async function createOrderAction(data) {
         const user = await getCurrentUser()
         if (!user) return { error: "Unauthorized" }
         
         const result = await orderService.create(data, user.id)
         
         revalidatePath("/dashboard")
         revalidatePath("/dashboard/feed")
         return result
       }
       
       // Логика перенесена в orderService.create()

4.1.4  Повторить для всех features:
       - proposal.service.ts ← из task-response/api/actions.ts
       - provider.service.ts ← из master-registration/api/actions.ts
       - review.service.ts ← из review/api/actions.ts
       - notification.service.ts ← из notifications/api/actions.ts
       - auth.service.ts ← из auth/model/actions.ts
```

### 4.2 — REST API роуты

```
4.2.1  Структура API:

       app/api/v1/
       ├── auth/
       │   ├── register/route.ts       POST — регистрация
       │   ├── login/route.ts          POST — вход (email)
       │   ├── login/telegram/route.ts POST — вход через Telegram
       │   ├── refresh/route.ts        POST — обновить JWT
       │   ├── logout/route.ts         POST — выход
       │   └── me/route.ts             GET  — текущий пользователь
       │
       ├── orders/
       │   ├── route.ts                GET  — список заказов (с фильтрами)
       │   │                           POST — создать заказ
       │   ├── [id]/
       │   │   ├── route.ts            GET  — детали заказа
       │   │   │                       PATCH — обновить заказ
       │   │   │                       DELETE — отменить заказ
       │   │   ├── proposals/
       │   │   │   └── route.ts        GET  — предложения к заказу
       │   │   │                       POST — отправить предложение
       │   │   └── complete/
       │   │       └── route.ts        POST — завершить заказ
       │   └── my/
       │       └── route.ts            GET  — мои заказы
       │
       ├── listings/
       │   ├── route.ts                GET  — список объявлений
       │   │                           POST — создать объявление
       │   ├── [id]/
       │   │   └── route.ts            GET, PATCH, DELETE
       │   └── my/
       │       └── route.ts            GET  — мои объявления
       │
       ├── proposals/
       │   ├── [id]/
       │   │   ├── accept/route.ts     POST — принять предложение
       │   │   └── reject/route.ts     POST — отклонить предложение
       │   └── my/
       │       └── route.ts            GET  — мои предложения
       │
       ├── providers/
       │   ├── route.ts                GET  — список исполнителей
       │   ├── [id]/
       │   │   └── route.ts            GET  — профиль исполнителя
       │   └── register/
       │       └── route.ts            POST — стать исполнителем
       │
       ├── reviews/
       │   └── route.ts                POST — оставить отзыв
       │
       ├── categories/
       │   └── route.ts                GET  — список категорий
       │
       ├── cities/
       │   └── route.ts                GET  — список городов
       │
       ├── upload/
       │   └── route.ts                POST — загрузить файл
       │
       └── notifications/
           ├── route.ts                GET  — мои уведомления
           └── [id]/read/route.ts      POST — прочитать

4.2.2  Пример реализации: app/api/v1/orders/route.ts

       import { orderService } from "@/services/order.service"
       import { getSessionFromRequest } from "@/shared/lib/auth"
       import { createOrderSchema } from "@uslugi/validation"
       
       // GET /api/v1/orders?cityId=...&categoryId=...&search=...&cursor=...
       export async function GET(request: NextRequest) {
         const session = await getSessionFromRequest(request)
         if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
         
         const params = Object.fromEntries(request.nextUrl.searchParams)
         const result = await orderService.list(params)
         
         return NextResponse.json(result)
       }
       
       // POST /api/v1/orders
       export async function POST(request: NextRequest) {
         const session = await getSessionFromRequest(request)
         if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
         
         const body = await request.json()
         const parsed = createOrderSchema.safeParse(body)
         if (!parsed.success) return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 })
         
         const result = await orderService.create(parsed.data, session.userId)
         return NextResponse.json(result, { status: 201 })
       }

4.2.3  Middleware для API:
       
       Обновить proxy.ts:
       - Для /api/v1/* — проверять Authorization: Bearer <jwt>
       - Rate-limiting на уровне middleware (по IP или userId)
       - CORS headers для мобильного приложения

4.2.4  Создать shared/lib/api-helpers.ts:
       
       // Хелперы для API роутов
       export function apiSuccess(data, status = 200)
       export function apiError(message, status = 400)
       export function apiUnauthorized()
       export function withAuth(handler) — wrapper для проверки сессии
       export function withValidation(schema, handler) — wrapper для Zod валидации
```

### 4.3 — API-клиент для mobile

```
4.3.1  Наполнить packages/api-client/src/client.ts:
       
       class ApiClient {
         private baseUrl: string
         private token: string | null
         
         constructor(baseUrl: string) { ... }
         
         setToken(token: string) { ... }
         clearToken() { ... }
         
         private async request<T>(method, path, body?) {
           const res = await fetch(`${this.baseUrl}${path}`, {
             method,
             headers: {
               "Content-Type": "application/json",
               ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
             },
             body: body ? JSON.stringify(body) : undefined,
           })
           if (!res.ok) throw new ApiError(res.status, await res.json())
           return res.json() as T
         }
         
         get<T>(path) { return this.request<T>("GET", path) }
         post<T>(path, body) { return this.request<T>("POST", path, body) }
         patch<T>(path, body) { return this.request<T>("PATCH", path, body) }
         delete<T>(path) { return this.request<T>("DELETE", path) }
       }

4.3.2  Наполнить packages/api-client/src/orders.ts:
       
       export function createOrdersApi(client: ApiClient) {
         return {
           list: (params) => client.get(`/api/v1/orders?${qs(params)}`),
           getById: (id) => client.get(`/api/v1/orders/${id}`),
           create: (data) => client.post("/api/v1/orders", data),
           // ...
         }
       }
       
       // Аналогично для listings, proposals, providers, auth
```

---

## Фаза 5 — Desktop Web UI (3 недели)

### Цель
Переделать UI с мобильного TWA на desktop-first адаптивный дизайн.

### 5.1 — Новый дизайн-система

```
5.1.1  Обновить Tailwind тему (apps/web/src/app/globals.css):
       
       Текущая тема — тёмная, заточенная под Telegram.
       Новая тема — светлая основная + тёмный режим (переключатель).
       
       Цвета:
       - Background: #ffffff (light) / #0f172a (dark)
       - Card: #f8fafc (light) / #1e293b (dark)
       - Primary: #2563eb (синий) — основной акцент
       - Secondary: #64748b (серый)
       - Accent: #f59e0b (жёлтый/оранж) — для CTA
       - Success: #10b981 (зелёный)
       - Danger: #ef4444 (красный)
       
       Типографика:
       - Font: Inter (вместо Roboto Condensed)
       - Размеры: 14/16/18/20/24/32/48px
       
       Breakpoints (desktop-first):
       - xl: 1280px+ (основной десктоп)
       - lg: 1024px
       - md: 768px (планшет)
       - sm: 640px (мобильный)

5.1.2  Установить Inter шрифт:
       - next/font/google: Inter
       - Обновить layout.tsx

5.1.3  Обновить shared/ui/ компоненты:
       - Убрать Telegram-специфичные стили
       - Адаптировать под большие экраны
       - Добавить hover-состояния (на десктопе есть мышь)
```

### 5.2 — Новый Layout

```
5.2.1  Создать app/(main)/layout.tsx — основной layout:
       
       Десктоп:
       ┌──────────────────────────────────────────────────┐
       │  HEADER: Лого | Поиск | Город | [Войти/Профиль] │
       ├────────┬─────────────────────────────────────────┤
       │        │                                         │
       │  SIDE  │          MAIN CONTENT                   │
       │  BAR   │                                         │
       │        │                                         │
       │  Заказы│                                         │
       │  Услуги│                                         │
       │  Мои   │                                         │
       │  ...   │                                         │
       │        │                                         │
       ├────────┴─────────────────────────────────────────┤
       │  FOOTER: О сервисе | Контакты | Правила          │
       └──────────────────────────────────────────────────┘
       
       Мобильный:
       ┌──────────────────┐
       │  HEADER           │
       │  Лого | ☰ (меню) │
       ├──────────────────┤
       │                  │
       │  MAIN CONTENT    │
       │                  │
       ├──────────────────┤
       │  BOTTOM NAV      │
       │  🏠 📋 ➕ 💬 👤  │
       └──────────────────┘

5.2.2  Создать widgets/Header/:
       - Logo + название "УслугиРядом"
       - Поисковая строка (по заказам и услугам)
       - Выбор города (dropdown)
       - Кнопки навигации: Заказы, Услуги, Создать
       - Аватар пользователя → dropdown (Профиль, Настройки, Выйти)
       - Для незалогиненных: кнопки "Войти" / "Регистрация"

5.2.3  Создать widgets/Sidebar/:
       - Навигация для залогиненных:
         - Лента заказов
         - Каталог услуг
         - Мои заказы
         - Мои предложения (если исполнитель)
         - Мои объявления (если исполнитель)
         - Чат (Фаза 7)
         - Уведомления
         - Избранное
       - Категории (быстрый фильтр)

5.2.4  Создать widgets/Footer/:
       - О сервисе, Правила, Поддержка, Контакты
       - Ссылки на мобильное приложение (когда будет)

5.2.5  Создать widgets/BottomNav/:
       - Мобильная навигация (видна только < md)
       - Иконки: Главная, Заказы, + Создать, Чат, Профиль
```

### 5.3 — Главная страница (лендинг)

```
5.3.1  Переделать app/page.tsx:
       
       Для незалогиненных:
       ┌─────────────────────────────────────────────┐
       │  Hero: "Найдите услуги рядом с вами"        │
       │  [Подобрать исполнителя]  [Предложить услугу]│
       ├─────────────────────────────────────────────┤
       │  Популярные категории (сетка иконок)        │
       ├─────────────────────────────────────────────┤
       │  Последние заказы (превью ленты)            │
       ├─────────────────────────────────────────────┤
       │  Как это работает (3 шага)                  │
       ├─────────────────────────────────────────────┤
       │  Топ исполнители (карусель)                 │
       ├─────────────────────────────────────────────┤
       │  CTA: "Зарегистрируйтесь бесплатно"        │
       └─────────────────────────────────────────────┘
       
       Для залогиненных:
       - Redirect на /dashboard или показать персонализированную ленту

5.3.2  Создать widgets/HeroSection/
5.3.3  Создать widgets/HowItWorks/
5.3.4  Создать widgets/TopProviders/
```

### 5.4 — Лента заказов (переделка)

```
5.4.1  Переделать app/dashboard/feed/ → app/(main)/orders/:
       
       Десктоп layout:
       ┌──────────────────────────────────────────────────┐
       │  Фильтры: [Категория ▾] [Город ▾] [Бюджет ▾]   │
       │           [Сортировка ▾]   Поиск: [________]     │
       ├──────────────────────┬───────────────────────────┤
       │                      │                           │
       │  Список заказов      │  Детали выбранного        │
       │  (карточки)          │  заказа (при клике)       │
       │                      │                           │
       │  ┌─────────────────┐ │  Заголовок                │
       │  │ Заказ 1         │ │  Описание                 │
       │  │ Категория       │ │  Фото                     │
       │  │ Бюджет: 5000₽   │ │  Карта (адрес)            │
       │  └─────────────────┘ │  Предложения (список)     │
       │  ┌─────────────────┐ │  [Откликнуться]           │
       │  │ Заказ 2         │ │                           │
       │  └─────────────────┘ │                           │
       │                      │                           │
       │  Пагинация           │                           │
       └──────────────────────┴───────────────────────────┘
       
       Мобильный — как сейчас (список карточек, клик → отдельная страница)

5.4.2  Обновить entities/order/ui/OrderCard.tsx:
       - Desktop: горизонтальная карточка (фото слева, инфо справа)
       - Mobile: вертикальная карточка (как сейчас)
       - Добавить: бейдж города, время создания, кол-во откликов

5.4.3  Обновить widgets/OrderFeed/:
       - Поддержка grid (desktop) и list (mobile) view
       - Расширенные фильтры (город, ценовой диапазон, сортировка)
       - Сохранение фильтров в URL (searchParams)
```

### 5.5 — Страница заказа

```
5.5.1  Переделать app/dashboard/task/[id]/ → app/(main)/orders/[id]/:
       
       - Desktop: полная страница с sidebar (похожие заказы)
       - Галерея фото (увеличение по клику, lightbox)
       - Карта с адресом (Яндекс/Google Maps embed)
       - Список предложений от исполнителей
       - Кнопка "Откликнуться" (для исполнителей)
       - Кнопка "Редактировать" (для автора)
       - Breadcrumbs: Главная → Заказы → Категория → Заказ
```

### 5.6 — Профиль и настройки

```
5.6.1  Создать app/(main)/profile/page.tsx:
       - Публичный профиль пользователя
       - Если исполнитель: рейтинг, отзывы, объявления, выполненные заказы
       - Если клиент: только базовая информация

5.6.2  Создать app/(main)/settings/page.tsx:
       Секции:
       
       1. Основное:
          - Аватар (загрузка/смена)
          - Имя (displayName)
          - Email (readonly, если зарегистрирован через email)
          - Телефон
          - Город (dropdown)
       
       2. Привязанные аккаунты:
          - Telegram: [Привязать] / [Отвязать]
          - Google: [Привязать] / [Отвязать]
          - Показывать список привязанных аккаунтов
       
       3. Профиль исполнителя (если PROVIDER):
          - Bio, категории, опыт, портфолио
          - Редактирование на этой же странице (без отдельного /become-provider)
       
       4. Уведомления:
          - Email-уведомления (toggle)
          - Push-уведомления (toggle, когда будет mobile)
          - Telegram-уведомления (toggle, если Telegram привязан)
       
       5. Безопасность:
          - Смена пароля (если auth через email)
          - Удалить аккаунт
       
5.6.3  Создать features/user-profile/api/:
       - update-profile.ts (server action)
       - upload-avatar.ts (server action)
       - change-password.ts (server action)
       - delete-account.ts (server action)
       - link-account.ts (привязать Telegram/Google)
       - unlink-account.ts (отвязать)
```

### 5.7 — Создание заказа (переделка)

```
5.7.1  Обновить app/(main)/create-order/page.tsx:
       
       Desktop — многошаговая форма (stepper):
       
       Шаг 1: Что нужно сделать?
       - Категория (выбор из дерева категорий)
       - Подкатегория
       
       Шаг 2: Детали
       - Заголовок
       - Описание (rich textarea)
       - Фото (drag & drop на десктопе)
       
       Шаг 3: Условия
       - Бюджет (от-до или фиксированный)
       - Адрес (с автокомплитом и картой)
       - Город (предзаполнен из профиля)
       - Сроки (когда нужно выполнить)
       
       Шаг 4: Предпросмотр и публикация
       - Превью как будет выглядеть
       - Кнопка "Опубликовать"
```

### 5.8 — Удаление Telegram-специфичного кода

```
5.8.1  Удалить/рефакторить:
       - shared/lib/telegram/GlobalHaptics.tsx → удалить
       - shared/lib/telegram/use-main-button.ts → удалить
       - shared/lib/telegram/use-back-button.ts → удалить
       - shared/lib/telegram/use-haptics.ts → удалить
       - shared/ui/telegram-back-button.tsx → удалить
       - features/auth/ui/TelegramAuth.tsx → переделать (см. 2.4)
       - features/auth/api/sync-action.ts → удалить (синк профиля Telegram)
       
       Оставить:
       - shared/lib/telegram/bot-notify.ts → оставить для Telegram-уведомлений
       - shared/lib/auth.ts → validateTelegramWebAppData (для Telegram входа)
       
5.8.2  Убрать Telegram script из layout.tsx:
       - <script src="https://telegram.org/js/telegram-web-app.js">
       - Заменить на условную загрузку только на странице Telegram Login
       
5.8.3  Обновить CSP headers в next.config.ts:
       - Убрать telegram.org из разрешённых
       - Добавить Google (для OAuth)
       - Добавить fonts.googleapis.com (для Inter)
```

---

## Фаза 6 — Объявления от исполнителей (1.5 недели)

### 6.1 — Создание объявления

```
6.1.1  Создать features/listing/api/create-listing-action.ts:
       
       Server Action: createListingAction(data)
       - Валидация: Zod (title 5-100, description 20-2000, categoryId, cityId)
       - Проверка: пользователь должен быть PROVIDER
       - Rate-limit: 3 объявления в час
       - Создание ServiceListing в БД
       - Статус: MODERATION (если включена модерация) или ACTIVE
       - Уведомление администраторов о новом объявлении
       
6.1.2  Создать features/listing/model/listing-schema.ts:
       - createListingSchema (Zod)
       - updateListingSchema (partial)

6.1.3  Создать features/listing/ui/ListingForm.tsx:
       - Форма создания/редактирования объявления
       - Поля: категория, заголовок, описание, фото, цена (от/до/единица)
       - Адрес (опционально)
       - Preview перед публикацией
```

### 6.2 — Каталог объявлений

```
6.2.1  Создать app/(main)/services/page.tsx:
       
       ┌─────────────────────────────────────────────┐
       │  Каталог услуг в [Москва ▾]                 │
       ├────────────┬────────────────────────────────┤
       │            │                                │
       │ Категории  │  Карточки объявлений (grid)    │
       │ (дерево)   │                                │
       │            │  ┌──────┐ ┌──────┐ ┌──────┐   │
       │ ▶ Ремонт   │  │ Фото │ │ Фото │ │ Фото │   │
       │   Сантехника│  │ Назв.│ │ Назв.│ │ Назв.│   │
       │   Электрика │  │ Цена │ │ Цена │ │ Цена │   │
       │ ▶ Уборка    │  │ ★4.8 │ │ ★4.9 │ │ ★4.7 │   │
       │ ▶ Красота   │  └──────┘ └──────┘ └──────┘   │
       │            │                                │
       │            │  Пагинация                     │
       └────────────┴────────────────────────────────┘

6.2.2  Создать entities/listing/ui/ListingCard.tsx:
       - Карточка объявления (фото, название, цена, рейтинг, город)
       
6.2.3  Создать widgets/ListingCatalog/:
       - api/load-listings.ts (server action с фильтрами)
       - ui/ListingCatalog.tsx (server component)
       - ui/ListingCatalogClient.tsx (pagination, filters)

6.2.4  Создать app/(main)/services/[id]/page.tsx:
       - Детальная страница объявления
       - Фото, описание, цена, провайдер (карточка с рейтингом)
       - Кнопка "Связаться" → создание чата или показ контактов
       - Отзывы об этом исполнителе
       - Похожие услуги (sidebar)
```

### 6.3 — Управление объявлениями

```
6.3.1  Создать app/(main)/my/listings/page.tsx:
       - Список объявлений исполнителя
       - Статусы: Активно / На паузе / На модерации / Отклонено
       - Статистика: просмотры
       - Действия: Редактировать, Приостановить, Удалить

6.3.2  Создать features/listing/api/update-listing-action.ts
6.3.3  Создать features/listing/api/delete-listing-action.ts
6.3.4  Создать features/listing/api/toggle-listing-status.ts
```

### 6.4 — Модерация объявлений (Админка)

```
6.4.1  Создать app/admin/listings/page.tsx:
       - Таблица объявлений на модерации
       - Действия: Одобрить / Отклонить / Скрыть
       - Фильтры: по статусу, категории, городу
       
6.4.2  Создать features/admin/api/moderate-listing.ts
```

---

## Фаза 7 — Чат и уведомления (2 недели)

### 7.1 — Модель чата

```
7.1.1  Добавить в prisma/schema.prisma:

       model Conversation {
         id          String   @id @default(uuid())
         
         // Контекст — заказ или объявление
         orderId     String?
         order       Order?   @relation(fields: [orderId], references: [id])
         listingId   String?
         listing     ServiceListing? @relation(fields: [listingId], references: [id])
         
         participants ConversationParticipant[]
         messages     Message[]
         
         createdAt   DateTime @default(now())
         updatedAt   DateTime @updatedAt
       }
       
       model ConversationParticipant {
         conversationId String
         conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
         userId         String
         user           User @relation(fields: [userId], references: [id])
         
         lastReadAt     DateTime?
         
         @@id([conversationId, userId])
       }
       
       model Message {
         id             String       @id @default(uuid())
         conversationId String
         conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
         senderId       String
         sender         User         @relation(fields: [senderId], references: [id])
         
         text           String
         attachments    String[]     @default([])
         
         createdAt      DateTime     @default(now())
         
         @@index([conversationId, createdAt])
       }

7.1.2  Миграция:
       npx prisma migrate dev --name add_chat
```

### 7.2 — API чата

```
7.2.1  Создать services/chat.service.ts:
       - createConversation(userId, targetUserId, context: { orderId? | listingId? })
       - getConversations(userId) — список диалогов
       - getMessages(conversationId, userId, cursor?) — сообщения с пагинацией
       - sendMessage(conversationId, userId, text, attachments?)
       - markAsRead(conversationId, userId)

7.2.2  Создать features/chat/api/:
       - get-conversations.ts (server action)
       - get-messages.ts (server action)
       - send-message.ts (server action)
       - mark-as-read.ts (server action)
       
7.2.3  Создать app/api/v1/conversations/ (REST для mobile):
       - route.ts: GET (список), POST (создать)
       - [id]/messages/route.ts: GET (сообщения), POST (отправить)
       - [id]/read/route.ts: POST (прочитать)
```

### 7.3 — UI чата

```
7.3.1  Создать app/(main)/chat/page.tsx:
       
       Desktop (two-panel):
       ┌──────────────────────────────────────────┐
       │  Чат                                     │
       ├──────────────┬───────────────────────────┤
       │              │                           │
       │  Список      │  Переписка               │
       │  диалогов    │                           │
       │              │  [Аватар] Имя             │
       │  ┌────────┐  │  Контекст: Заказ #123     │
       │  │ Диалог1│  │  ─────────────────────    │
       │  │ Послед.│  │  Он: Привет!              │
       │  │ сообщ. │  │  Вы: Здравствуйте         │
       │  └────────┘  │                           │
       │  ┌────────┐  │                           │
       │  │ Диалог2│  │  ┌─────────────────────┐  │
       │  └────────┘  │  │ Написать...      📎 │  │
       │              │  └─────────────────────┘  │
       └──────────────┴───────────────────────────┘
       
       Mobile:
       - /chat — список диалогов
       - /chat/[id] — переписка (отдельная страница)

7.3.2  Создать features/chat/ui/:
       - ChatList.tsx — список диалогов
       - ChatWindow.tsx — окно переписки
       - MessageBubble.tsx — сообщение (входящее/исходящее)
       - MessageInput.tsx — поле ввода + загрузка файлов
       - ChatEmpty.tsx — заглушка "Нет сообщений"

7.3.3  Real-time:
       Вариант A (проще): Polling каждые 3-5 секунд
       Вариант B (лучше): Server-Sent Events (SSE)
       Вариант C (лучшее): WebSocket (Socket.io или ws)
       
       Рекомендация: Начать с SSE (встроено в Web API, работает с Next.js):
       - Создать app/api/v1/conversations/[id]/stream/route.ts
       - ReadableStream с SSE events
       - На клиенте: EventSource API
```

### 7.4 — Уведомления (расширение)

```
7.4.1  Обновить Notification enum:
       - Добавить: NEW_MESSAGE, LISTING_APPROVED, LISTING_REJECTED, ACCOUNT_LINKED
       
7.4.2  Обновить notification.service.ts:
       - Абстрагировать транспорт: email, telegram, in-app
       - Настройки пользователя определяют каналы
       
7.4.3  Email-уведомления:
       - Использовать shared/lib/email/send-email.ts
       - Шаблоны: новое сообщение, новый отклик, заказ завершён
       
7.4.4  Бейдж непрочитанных:
       - В Header: кол-во непрочитанных уведомлений + сообщений
       - Polling каждые 30 секунд (или SSE)
```

---

## Фаза 8 — Тесты и CI/CD (1 неделя)

### 8.1 — Vitest (unit + integration)

```
8.1.1  Установить в apps/web/:
       npm install -D vitest @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom jsdom

8.1.2  Создать apps/web/vitest.config.ts (конфигурация)

8.1.3  Юнит-тесты для сервисов:
       - services/__tests__/order.service.test.ts
       - services/__tests__/auth.service.test.ts
       - services/__tests__/proposal.service.test.ts
       - services/__tests__/listing.service.test.ts
       
8.1.4  Юнит-тесты для утилит:
       - shared/lib/__tests__/auth.test.ts (JWT, Telegram validation)
       - shared/lib/__tests__/rate-limit.test.ts

8.1.5  Скрипты в package.json:
       "test": "vitest"
       "test:run": "vitest run"
       "test:coverage": "vitest run --coverage"
```

### 8.2 — Playwright (E2E)

```
8.2.1  Установить:
       npm install -D @playwright/test
       npx playwright install

8.2.2  E2E сценарии:
       - e2e/auth.spec.ts (регистрация, вход, выход)
       - e2e/order-flow.spec.ts (создание заказа → отклик → принятие)
       - e2e/listing.spec.ts (создание объявления, просмотр каталога)
       - e2e/chat.spec.ts (отправка сообщения)
```

### 8.3 — GitHub Actions CI

```
8.3.1  Создать .github/workflows/ci.yml:
       Jobs: lint, typecheck, test, e2e
       Триггер: push to master, pull_request

8.3.2  Обновить .github/workflows/deploy.yml:
       - Добавить проверку тестов перед деплоем

8.3.3  Prettier + ESLint:
       - Создать .prettierrc
       - Настроить lint-staged + husky (pre-commit hook)
```

---

## Фаза 9 — React Native (Expo) (3-4 недели)

### 9.1 — Инициализация

```
9.1.1  Создать Expo проект:
       cd apps/
       npx create-expo-app mobile --template blank-typescript
       
9.1.2  Настроить Expo Router (file-based routing):
       npx expo install expo-router
       
9.1.3  Структура apps/mobile/:
       apps/mobile/
       ├── app/                    # Expo Router pages
       │   ├── (auth)/
       │   │   ├── login.tsx
       │   │   ├── register.tsx
       │   │   └── _layout.tsx
       │   ├── (tabs)/
       │   │   ├── index.tsx       # Лента заказов
       │   │   ├── services.tsx    # Каталог услуг
       │   │   ├── create.tsx      # Создать заказ
       │   │   ├── chat.tsx        # Чат
       │   │   ├── profile.tsx     # Профиль
       │   │   └── _layout.tsx     # Tab navigator
       │   ├── order/[id].tsx
       │   ├── service/[id].tsx
       │   ├── chat/[id].tsx
       │   └── _layout.tsx
       ├── src/
       │   ├── components/         # UI компоненты
       │   ├── hooks/              # Кастомные хуки
       │   ├── store/              # Zustand / AsyncStorage
       │   └── theme/              # Цвета, типографика
       ├── app.json
       └── package.json

9.1.4  Подключить packages/:
       - @uslugi/shared-types
       - @uslugi/validation
       - @uslugi/api-client
```

### 9.2 — Авторизация в RN

```
9.2.1  Создать app/(auth)/login.tsx:
       - Email + пароль
       - Кнопка "Войти через Telegram" (deep link → Telegram → callback)
       - Кнопка "Войти через Google" (expo-auth-session)
       
9.2.2  Хранение токена:
       - expo-secure-store для JWT токена
       - При старте: проверить токен → auto-login или показать auth screen
       
9.2.3  API client setup:
       import { ApiClient } from "@uslugi/api-client"
       const api = new ApiClient(API_BASE_URL)
       api.setToken(storedToken)
```

### 9.3 — Основные экраны

```
9.3.1  Лента заказов (app/(tabs)/index.tsx):
       - FlatList с OrderCard
       - Pull-to-refresh
       - Infinite scroll
       - Фильтры: категория, город
       
9.3.2  Каталог услуг (app/(tabs)/services.tsx):
       - Сетка категорий → список объявлений
       - Поиск
       
9.3.3  Создание заказа (app/(tabs)/create.tsx):
       - Пошаговая форма (как web, но адаптированная)
       - Камера для фото (expo-camera)
       - Геолокация (expo-location)
       
9.3.4  Чат (app/(tabs)/chat.tsx):
       - Список диалогов
       - Экран переписки
       - Push-уведомления (expo-notifications)
       
9.3.5  Профиль (app/(tabs)/profile.tsx):
       - Инфо пользователя
       - Мои заказы / Мои объявления / Мои предложения
       - Настройки
```

### 9.4 — Push-уведомления

```
9.4.1  Настроить expo-notifications:
       - Регистрация push-токена при первом входе
       - Сохранение токена на сервере (новое поле: User.pushToken)
       
9.4.2  Создать app/api/v1/notifications/push-token/route.ts:
       - POST { token, platform: "ios" | "android" }
       
9.4.3  Обновить notification.service.ts:
       - При создании уведомления — отправлять push через Expo Push API
```

### 9.5 — Сборка и деплой

```
9.5.1  EAS Build:
       npx eas-cli build --platform all
       
9.5.2  Подготовить:
       - Apple Developer account (для iOS)
       - Google Play Console (для Android)
       - app.json: icon, splash, bundle identifier
```

---

## Фаза 10 — Geo-поиск и мульти-город (1.5 недели)

### 10.1 — Определение города

```
10.1.1  При регистрации / первом входе:
        - Запросить геолокацию (navigator.geolocation / expo-location)
        - Определить ближайший город из списка City
        - Предложить пользователю подтвердить / изменить
        
10.1.2  Выбор города в Header:
        - Dropdown с поиском по городам
        - Сохранение в профиле (User.cityId)
        - Все запросы фильтруются по текущему городу
```

### 10.2 — Geo-поиск заказов

```
10.2.1  Обновить orderService.list():
        - Параметр: { lat, lng, radiusKm }
        - PostGIS запрос: ST_DWithin + ST_DistanceSphere
        - Сортировка по расстоянию
        
10.2.2  UI: кнопка "Рядом со мной" в фильтрах
        - Запрос геолокации
        - Слайдер радиуса: 1 / 3 / 5 / 10 / 25 км
        - Отображение расстояния на карточках
```

### 10.3 — Карта

```
10.3.1  Web: Яндекс Карты или Leaflet (OpenStreetMap)
        - Карта на странице заказа (адрес)
        - Карта в каталоге услуг (точки исполнителей)
        - Выбор адреса через карту при создании заказа

10.3.2  Mobile: react-native-maps (Google Maps / Apple Maps)
        - Аналогичный функционал
```

---

## Фаза 11 — Полировка и запуск (1 неделя)

### 11.1 — SEO

```
11.1.1  Создать app/robots.ts
11.1.2  Создать app/sitemap.ts (динамический: города, категории, объявления)
11.1.3  OG-теги для каждой страницы
11.1.4  Structured Data (JSON-LD): LocalBusiness, Service
11.1.5  PWA manifest.json
```

### 11.2 — Производительность

```
11.2.1  Bundle analyzer: проверить размер бандла
11.2.2  Image optimization: next/image для всех изображений
11.2.3  Lazy loading: тяжёлые компоненты (карта, чат)
11.2.4  Caching: Redis для сессий и rate-limiting (вместо in-memory)
```

### 11.3 — Мониторинг

```
11.3.1  Sentry: ошибки на клиенте и сервере
11.3.2  Analytics: Яндекс Метрика или Plausible
11.3.3  Uptime: healthcheck monitoring
```

### 11.4 — Юридическое

```
11.4.1  Страница "Пользовательское соглашение"
11.4.2  Страница "Политика конфиденциальности"
11.4.3  Cookie-banner (если нужен)
```

---

## Фаза 11.5 — Расширенная функциональность (YouDo-scope) (2-3 недели)

> Концепт YouDo подразумевает больше, чем просто «доска объявлений». Эта фаза декомпозирует те фичи, что отличают зрелый сервис от MVP. Делается **после** Фазы 11 (первый запуск), по мере роста.

### 11.5.1 — Верифицированные отзывы

```
[ ] 11.5.1.1  Review может быть оставлен ТОЛЬКО после Order.status === 'COMPLETED'
              - Проверка на уровне service + enforcement в БД (CHECK constraint или trigger)
[ ] 11.5.1.2  Бейдж «Проверенный отзыв» в UI — отображать рядом с рейтингом
[ ] 11.5.1.3  Запрет удаления отзывов пользователем — только через апелляцию в админку
[ ] 11.5.1.4  Поле Review.isVerified (для ручной модерации спорных случаев)
```

### 11.5.2 — Ранги исполнителей

```
[ ] 11.5.2.1  Добавить ProviderProfile.level: ProviderLevel (NEW, PRO, ELITE)
              - NEW: < 10 выполненных заказов
              - PRO: 10-100, рейтинг ≥ 4.5
              - ELITE: > 100, рейтинг ≥ 4.8, жалоб < 1%
              
[ ] 11.5.2.2  Cron-задача раз в сутки пересчитывает level:
              apps/web/src/shared/lib/jobs/recalc-provider-levels.ts
              
[ ] 11.5.2.3  UI: бейдж уровня на карточке исполнителя и в профиле
              
[ ] 11.5.2.4  Сортировка в поиске: ELITE → PRO → NEW (при равном рейтинге)
```

### 11.5.3 — Избранное (Favorites)

```
[ ] 11.5.3.1  Prisma: модель Favorite { userId, targetType (ORDER|LISTING|PROVIDER), targetId, createdAt }
              - @@unique([userId, targetType, targetId])
              
[ ] 11.5.3.2  Server actions: toggleFavoriteAction, getFavoritesAction
              
[ ] 11.5.3.3  UI: иконка сердечка на карточках (ORDER/LISTING/PROVIDER)
              
[ ] 11.5.3.4  Страница /dashboard/favorites — список избранного с табами
```

### 11.5.4 — Жалобы и модерация чата

```
[ ] 11.5.4.1  Prisma: модель Report { id, reporterId, targetType, targetId, reason, description, status, createdAt, resolvedAt, resolvedBy }
              - enum ReportStatus { PENDING, REVIEWED, ACTIONED, DISMISSED }
              - enum ReportReason { SPAM, FRAUD, INAPPROPRIATE, CONTACT_EXCHANGE, OTHER }
              
[ ] 11.5.4.2  Кнопка «Пожаловаться» на каждой карточке/сообщении чата
              
[ ] 11.5.4.3  Admin-страница /admin/reports — очередь жалоб с фильтрами
              
[ ] 11.5.4.4  Автомодерация чата (MVP): regex-фильтр на телефоны/email/telegram-ссылки
              - Детект попытки увода заказа «за периметр» платформы
              - Блюр или [скрыто модерацией] вместо контакта
```

### 11.5.5 — Диспут-центр

```
[ ] 11.5.5.1  Prisma: Dispute { orderId, initiatorId, reason, status, messages, resolution, createdAt }
              - enum DisputeStatus { OPEN, UNDER_REVIEW, RESOLVED_CLIENT, RESOLVED_PROVIDER, CLOSED }
              
[ ] 11.5.5.2  Открытие диспута — только пока Order.status === 'IN_PROGRESS' или COMPLETED (в течение 7 дней)
              
[ ] 11.5.5.3  В диспуте — чат с админом + обе стороны + вложения (скриншоты, чеки)
              
[ ] 11.5.5.4  Admin выносит решение → меняет OrderStatus, AuditLog.
              Если включён эскроу (см. 12.1) — возврат средств на нужную сторону.
```

### 11.5.6 — SEO-страницы «услуга × город»

```
[ ] 11.5.6.1  Динамический роут app/(main)/[citySlug]/[categorySlug]/page.tsx
              Пример: /moscow/plumbing, /spb/nannies
              
[ ] 11.5.6.2  Заголовок H1: «Сантехники в Москве — услуги рядом»
              
[ ] 11.5.6.3  Контент:
              - Топ-10 исполнителей категории в городе
              - 20 последних объявлений
              - Средняя цена
              - FAQ-блок (2026-04-17: наполнение текстами — отдельная задача для копирайтера)
              
[ ] 11.5.6.4  Dynamic sitemap: все пары city × category → в sitemap.xml
              
[ ] 11.5.6.5  Structured Data (JSON-LD): LocalBusiness, AggregateRating
              
[ ] 11.5.6.6  Мета-теги: OG/Twitter — автогенерация по шаблону
```

### 11.5.7 — Полнотекстовый поиск

```
[ ] 11.5.7.1  PostgreSQL FTS с русской морфологией:
              CREATE INDEX idx_order_search ON "Order"
                USING gin (to_tsvector('russian', title || ' ' || coalesce(description, '')));
              Аналогично для ServiceListing.
              
[ ] 11.5.7.2  orderService.list() / listingService.list() — принимают ?q= и добавляют WHERE
              to_tsvector('russian', title || ' ' || description) @@ plainto_tsquery('russian', :q)
              
[ ] 11.5.7.3  Опционально: pg_trgm для fuzzy-поиска при опечатках
              
[ ] 11.5.7.4  Подсветка совпадений в UI (ts_headline или клиентский highlight)
```

---

## Фаза 12 — Монетизация MVP (1.5 недели)

> Включается **после** стабильного запуска Фазы 11. Первая цель — не выручка, а проверка готовности аудитории платить. Эта фаза заменяет Sprint 8 из устаревшего `ROADMAP.md`.

### 12.1 — Платёжный провайдер

```
[ ] 12.1.1  Выбор провайдера (решение до начала):
            - Вариант A: Telegram Stars — простой, сразу доступен, но ограничен TG-аудиторией
            - Вариант B: ЮKassa / CloudPayments — фискальные чеки, поддержка карт РФ
            - Вариант C: оба одновременно (Stars для TG-пользователей, ЮKassa для веба)
            
[ ] 12.1.2  Prisma: модель Payment { id, userId, amount, currency, provider, providerTxId, status, purpose, referenceId, createdAt }
            - enum PaymentStatus { PENDING, SUCCEEDED, FAILED, REFUNDED }
            - enum PaymentPurpose { BUMP_ORDER, BUMP_LISTING, PRO_SUBSCRIPTION, ESCROW, VERIFIED_BADGE }
            
[ ] 12.1.3  Webhook-роуты для успешных платежей (app/api/webhooks/*):
            - /api/webhooks/telegram-stars
            - /api/webhooks/yookassa
            Верификация подписи — обязательно.
            
[ ] 12.1.4  Идемпотентность: по providerTxId не обрабатывать повторно.
```

### 12.2 — Платное поднятие (bump)

```
[ ] 12.2.1  Добавить Order.bumpedUntil DateTime? и ServiceListing.bumpedUntil.
            
[ ] 12.2.2  UI: кнопка «Поднять в топ» на карточке моего заказа/объявления → чекаут.
            
[ ] 12.2.3  Сортировка в feed: сначала bumpedUntil > now() (DESC), потом по createdAt.
            
[ ] 12.2.4  Тарифы: 24 часа / 3 дня / 7 дней — разные цены.
```

### 12.3 — PRO-подписка для исполнителей

```
[ ] 12.3.1  Prisma: Subscription { userId, plan, status, startedAt, endsAt, autoRenew, providerTxId }
            - enum SubscriptionPlan { PRO_MONTHLY, PRO_YEARLY }
            
[ ] 12.3.2  Привилегии PRO:
            - Безлимитные отклики (у FREE — N в день)
            - Приоритет в поиске исполнителей (после bump, выше обычных)
            - Расширенная статистика профиля (views, conversion)
            - Бейдж «PRO» на карточке
            
[ ] 12.3.3  Cron: раз в сутки проверка истёкших подписок → статус EXPIRED.
            
[ ] 12.3.4  Grace-период 3 дня: подписка показывается активной, но без доступа к PRO-фичам.
```

### 12.4 — Безопасная сделка (эскроу) — опционально

```
[ ] 12.4.1  Prisma: EscrowDeal { orderId, amount, holderAccount, status, releasedAt, refundedAt }
            - enum EscrowStatus { HELD, RELEASED, REFUNDED, DISPUTED }
            
[ ] 12.4.2  Клиент оплачивает заказ → деньги удерживаются.
            При завершении (Client подтверждает) → release на счёт провайдера (минус комиссия).
            При диспуте (11.5.5) → решение админа.
            
[ ] 12.4.3  Комиссия: 5-7% (финальная — по договорённости с провайдером).
            
[ ] 12.4.4  Это серьёзная фича — **не раньше** 10k активных заказов/мес. Пока — в бэклог.
```

### 12.5 — Реферальная программа

```
[ ] 12.5.1  Prisma: ReferralCode { userId, code, createdAt }; User.referredBy String?
            
[ ] 12.5.2  Генерация уникального кода при регистрации провайдера.
            
[ ] 12.5.3  Бонусы:
            - Реферер получает 5% от первого платежа приглашённого (bump/PRO).
            - Приглашённый получает скидку 10% на первую оплату.
            
[ ] 12.5.4  Страница /dashboard/referral — код, ссылка, статистика.
```

---

## KPI и метрики запуска

> Раздел добавлен 2026-04-17. Цель: до начала Фазы 10 определить, что считаем успехом, и подключить трекинг на старте Фазы 11.

### Acquisition (привлечение)
- Уникальные регистрации в день / неделю.
- Конверсия воронки: лендинг → регистрация → подтверждение email → первый заход в dashboard.
- Источники трафика (Яндекс.Метрика: прямые, поиск, реферальные, соцсети).

### Activation (первое успешное действие)
- **Клиент:** время от регистрации до первого созданного заказа (P50, P90).
- **Исполнитель:** время от регистрации до первого отклика.
- % пользователей, сделавших первое действие за 24 часа.

### Engagement
- Заказов на активного клиента в месяц.
- Откликов на активного исполнителя в месяц.
- Среднее число предложений на заказ (цель: ≥ 3 за 24 часа — маркер живой платформы).
- DAU / MAU ratio (цель: ≥ 15% для маркетплейса).

### Conversion (ключевая воронка)
- Order OPEN → получил ≥ 1 proposal (цель: ≥ 80%).
- Proposal → принят клиентом (цель: ≥ 25%).
- Order ACCEPTED → COMPLETED (цель: ≥ 70%).
- Время от создания Order до принятия Proposal (P50, цель: < 24 ч).

### Retention
- D1 / D7 / D30 retention по когортам.
- Churn активных исполнителей (неактивен 30 дней после первого отклика).

### Monetization (с Фазы 12)
- % платящих пользователей.
- ARPU / ARPPU.
- Выручка по источникам (bump / PRO / эскроу / рефералы).
- LTV провайдера (среднее кол-во месяцев подписки × цена).

### Инструменты
- **Яндекс.Метрика** — web-аналитика, цели, воронки, вебвизор. Основная.
- **Plausible** (self-hosted) — приватная альтернатива для GDPR, в бэклог.
- **Кастомные метрики** в БД через `prisma.$queryRaw` — для воронки и KPI (агрегация в `app/admin/metrics`).
- **PostHog** (self-hosted) — в бэклог, если понадобится продуктовая аналитика (funnels, session recordings).

---

## Прод-инфраструктура (cross-cutting, по ходу Фаз 8-11)

> Вынесено отдельно, т.к. эти задачи размазаны по нескольким фазам, но должны быть выполнены до публичного запуска.

### Redis (обязательно до запуска)
```
[ ] Заменить in-memory rate-limit в apps/web/src/shared/lib/rate-limit.ts на Redis (ioredis).
[ ] Переключить сессии Auth.js с JWT-only на hybrid JWT + Redis (чтобы логаут инвалидировал все устройства).
[ ] Добавить Redis как сервис в docker-compose.yml. Переменная REDIS_URL.
[ ] Использовать Redis для кэширования категорий/городов (TTL 1 час).
```

### Email (обязательно до запуска)
```
[ ] Заменить mock apps/web/src/shared/lib/email.ts на прод SMTP.
[ ] Варианты: Mailgun, Amazon SES, Yandex 360 for Business, Resend.
[ ] Настроить SPF / DKIM / DMARC для домена.
[ ] Шаблоны: react-email или MJML — отдельные компоненты, ревью дизайнером.
[ ] Webhook для bounces/complaints → помечать User.emailVerified = false.
```

### Observability
```
[ ] Sentry: @sentry/nextjs, client + server + edge.
    - Sample rate transactions: 0.1. Errors: 1.0.
    - Scrubbing PII (email, phone) в beforeSend.
[ ] Яндекс.Метрика: счётчик в layout.tsx, события на ключевые действия.
[ ] Uptime-monitoring: Uptime Kuma (self-hosted) или statuspage.io — /api/health endpoint есть.
[ ] Логирование: pino + loki/grafana — в бэклог для масштаба.
```

### Бэкапы и восстановление
```
[ ] PostgreSQL: pg_dump cron каждые 6 часов в S3-совместимое хранилище (Selectel/Yandex Object Storage).
[ ] Хранить 30 ежедневных + 12 месячных.
[ ] **Тест restore** на staging-инстанс — раз в квартал (записать в календарь).
[ ] Uploads (apps/web/uploads/): rsync/rclone в то же S3, или сразу мигрировать на S3 (см. shared/lib/storage).
```

### CI/CD дополнительно (к Фазе 8)
```
[ ] Secret scanning: gitleaks / truffleHog в pre-commit + в CI.
[ ] Dependabot / Renovate — автообновления npm-пакетов.
[ ] Docker image sign (cosign) — опционально, для прода.
[ ] Canary-деплой: новая версия → 10% трафика на 15 мин → мониторинг Sentry → full rollout.
```

### Безопасность прод
```
[ ] Secure headers (PART VI глобальных правил): HSTS, CSP, X-Frame-Options, nosniff.
[ ] Rate-limit на proxy.ts уровне (публичные /api/*): по IP + userId.
[ ] WAF перед Nginx (Cloudflare или selectel-shield) для защиты от ботов/DDoS.
[ ] Загрузка файлов — антивирус (ClamAV) на nginx-proxy уровне или после загрузки.
[ ] Регулярный security audit npm: npm audit + GitHub security alerts.
```

### Feature flags (опционально)
```
[ ] GrowthBook (self-hosted) или флаги через env + Redis.
[ ] Нужны для A/B экспериментов (UI вариант поиска, размер комиссии, и т.д.) и для безопасных деплоев спорных фич.
```

---

## Сводная карта зависимостей

```
Фаза 1 (Фундамент)     ──┐
                          ├──→ Фаза 2 (Auth) ──┐
                          │                     ├──→ Фаза 5 (Desktop UI) ──→ Фаза 6 (Объявления)
Фаза 3 (Модель данных) ──┤                     │                                    │
                          ├──→ Фаза 4 (API) ────┤                                    │
                          │                     ├──→ Фаза 7 (Чат) ──────────────────┤
                          │                     │                                    │
                          │                     └──→ Фаза 9 (React Native) ─────────┤
                          │                                                          │
                          └──→ Фаза 8 (Тесты) ── параллельно с любой ────────────────┤
                                                                                     │
                                              Фаза 10 (Geo) ←───── после 5, 9 ──────┤
                                                                                     │
                                              Фаза 11 (Полировка) ←─── после всех ──┘
```

### Рекомендуемый порядок

```
1 → 2 → 3 (параллельно) → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11
                                                ↑
                                       можно начать раньше
```

### Критический путь

```
Фаза 1 → Фаза 2 → Фаза 5 → Фаза 6 → Фаза 7
```

Это минимум для запуска web-версии. React Native (Фаза 9) можно делать параллельно после Фазы 4.

---

## Оценка по фазам

| Фаза | Описание | Ориентировочно | Статус |
|---|---|---|---|
| 1 | Фундамент и ребрендинг | 2 нед | ✅ |
| 2 | Авторизация (Auth.js v5) | 1 нед | ✅ |
| 3 | Модель данных (City, Category, ServiceListing) | 1 нед | ⚠️ частично |
| 4 | REST API + сервисный слой | 1.5 нед | ❌ |
| 5 | Desktop UI | 3 нед | ❌ |
| 6 | Объявления | 1.5 нед | ❌ |
| 7 | Чат | 2 нед | ❌ |
| 8 | Тесты/CI | 1 нед | ❌ |
| 9 | React Native | 3-4 нед | ❌ |
| 10 | Geo-поиск | 1.5 нед | ❌ |
| 11 | Полировка и запуск | 1 нед | ❌ |
| 11.5 | YouDo-scope (отзывы, ранги, избранное, жалобы, диспуты, SEO, FTS) | 2-3 нед | ⏳ после запуска |
| 12 | Монетизация MVP (платежи, bump, PRO, эскроу, рефералы) | 1.5 нед | ⏳ после запуска |
| — | Прод-инфраструктура (Redis, SMTP, Sentry, backups) | cross-cutting | ❌ |
| **Итого до запуска (1-11)** | | **~18-20 нед** | |
| **С расширениями (11.5, 12)** | | **~22-24 нед** | |

---

> Этот план — живой документ. Обновляй по мере продвижения.
> Ветка: `refactor/uslugi-ryadom`
