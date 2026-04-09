# Roadmap: District Master — от 60% до Production-Ready

> Архитектура: Next.js 16 App Router + Prisma + PostgreSQL/PostGIS + Tailwind v4 + FSD
> Дата: 2026-04-09

---

## Sprint 1: Админ-панель

**Цель:** Полный контроль над платформой — модерация, метрики, управление.

### Шаг 1.1 — Админ-мидлварь и защита роутов

**Файлы:** `src/proxy.ts` (уже есть matcher для `/admin/:path*`)

Что сделать:
1. Убедиться что middleware проверяет `role === 'ADMIN'` для `/admin/*` роутов
2. Добавить редирект не-админов на `/dashboard` с ошибкой 403

```ts
// В proxy.ts, после расшифровки JWT:
if (url.pathname.startsWith('/admin') && session.role !== 'ADMIN') {
  return NextResponse.redirect(new URL('/dashboard?error=forbidden', request.url))
}
```

### Шаг 1.2 — Layout админки

**Создать:** `src/app/admin/layout.tsx`

Содержимое:
- Боковая навигация (sidebar) с пунктами:
  - Дашборд (`/admin`)
  - Пользователи (`/admin/users`)
  - Заявки мастеров (`/admin/master-applications`)
  - Модерация задач (`/admin/tasks`)
  - Модерация отзывов (`/admin/reviews`)
  - Метрики (`/admin/metrics`)
- Проверка роли ADMIN на сервере, редирект если не админ
- Общий стиль: тёмная тема, согласованная с основным приложением

### Шаг 1.3 — Админ-дашборд

**Создать:** `src/app/admin/page.tsx`

Метрики для отображения:
- Всего пользователей (за сегодня / за неделю / всего)
- Активных задач (OPEN / IN_PROGRESS / COMPLETED)
- Ожидают верификации мастеров (count `MasterProfile` где `isVerified: false`)
- Новые отклики за 24ч
- Средний рейтинг платформы
- График задач по дням (за последние 30 дней)

**Server Action:** `src/features/admin/api/get-dashboard-stats.ts`
- Запросы к Prisma: `user.count()`, `taskRequest.count()`, `taskResponse.count()`, `review.count()`
- Группировка по `createdAt` для графика

### Шаг 1.4 — Управление пользователями

**Создать:** `src/app/admin/users/page.tsx`

Функционал:
- Таблица пользователей: ID, Telegram username, роль, дата регистрации, статус
- Поиск по username / telegramId
- Фильтр по роли (USER / MASTER / ADMIN)
- Пагинация (использовать существующий PAGE_SIZE=7 или отдельный для админки)
- Действия:
  - Изменить роль (dropdown → server action)
  - Забанить/разбанить (поле `isBanned` в User)
  - Просмотреть профиль мастера (если MASTER)

**Server Actions:** `src/features/admin/api/update-user-role.ts`, `ban-user.ts`

### Шаг 1.5 — Заявки на верификацию мастеров

**Создать:** `src/app/admin/master-applications/page.tsx`

Функционал:
- Список `MasterProfile` где `isVerified: false`
- Карточка заявки:
  - Имя мастера, bio, опыт, категории
  - Портфолио (фото)
  - Рейтинг (если есть отзывы)
  - Количество выполненных задач
- Кнопки: **Аппрувить** / **Отклонить**
- При аппруве: `isVerified: true`, отправка уведомления мастеру

**Server Actions:** `src/features/admin/api/verify-master.ts`, `reject-master.ts`

### Шаг 1.6 — Модерация задач

**Создать:** `src/app/admin/tasks/page.tsx`

Функционал:
- Список всех задач с фильтрами (статус, категория, дата)
- Просмотр деталей задачи
- Действия:
  - Скрыть задачу (`isVisible: false` или новое поле `isFlagged`)
  - Удалить задачу (каскадное удаление откликов)
  - Изменить категорию
- Жалобы (если будет добавлено поле `reports` в TaskRequest)

### Шаг 1.7 — Модерация отзывов

**Создать:** `src/app/admin/reviews/page.tsx`

Функционал:
- Список отзывов с фильтрами (по рейтингу, дате)
- Просмотр: текст, рейтинг, автор, задача
- Действия:
  - Скрыть отзыв
  - Удалить отзыв
  - Пересчитать рейтинг мастера после удаления

### Шаг 1.8 — Метрики и аналитика

**Создать:** `src/app/admin/metrics/page.tsx`

Метрики:
- Конверсия: просмотры задач → отклики → принятие → завершение
- Топ категорий по количеству задач
- Среднее время выполнения задачи
- Активность пользователей по дням недели
- Гео-распределение задач (если geo заполнено)

**Компонент:** Простые карточки + графики на чистом CSS или лёгкая библиотека (recharts)

---

## Sprint 2: Редактирование профиля

**Цель:** Пользователи могут редактировать свой профиль без повторного входа в Telegram.

### Шаг 2.1 — Страница настроек

**Создать:** `src/app/dashboard/settings/page.tsx`

Секции:
1. **Основное:**
   - Отображение текущего аватара (из Telegram)
   - Кнопка "Загрузить фото" (замена аватара)
   - Имя (input, предзаполнено из Telegram)
   - Username (readonly, из Telegram)

2. **Контакты:**
   - Телефон (input с маской, опционально)
   - Email (input, опционально)

3. **Профиль мастера** (если роль MASTER):
   - Ссылка на редактирование bio (`/dashboard/become-master` или отдельная страница)
   - Статус верификации (бейдж)
   - Категории (просмотр/редактирование)

4. **Уведомления:**
   - Toggle: push-уведомления через Telegram Bot
   - Toggle: email-уведомления (если email добавлен)

5. **Опасная зона:**
   - Кнопка "Удалить аккаунт" (с подтверждением)

### Шаг 2.2 — Server Actions для профиля

**Создать:** `src/features/user-profile/api/update-profile.ts`

```ts
// Поля: displayName, phone, email, avatarUrl
// Валидация: Zod схема
// Обновление: prisma.user.update({ where: { id }, data })
```

**Создать:** `src/features/user-profile/api/upload-avatar.ts`

- Приём FormData с файлом
- Валидация: тип (image/*), размер (< 5MB)
- Сохранение через существующий storage utility
- Обновление `avatarUrl` пользователя

### Шаг 2.3 — Схема БД (миграция)

**Обновить:** `prisma/schema.prisma`

Добавить в модель `User`:
```prisma
phone       String?
email       String?
displayName String?   // если null — берётся из Telegram
isBanned    Boolean   @default(false)
avatarUrl   String?   // уже может существовать, проверить
```

```bash
npx prisma migrate dev --name add_user_profile_fields
```

### Шаг 2.4 — Роут для загрузки аватара

**Создать:** `src/app/api/upload/avatar/route.ts`

- POST, multipart/form-data
- Проверка сессии
- Обработка через Sharp (resize, crop, webp)
- Сохранение в `uploads/avatars/`
- Возврат URL

---

## Sprint 3: Чат / Сообщения

**Цель:** Переписка между заказчиком и мастером после принятия отклика.

### Шаг 3.1 — Схема БД для чата

**Обновить:** `prisma/schema.prisma`

```prisma
model Conversation {
  id          String   @id @default(uuid())
  taskRequest TaskRequest @relation("TaskConversations")
  customer    User     @relation("CustomerConversations", fields: [customerId], references: [id])
  customerId  String
  master      User     @relation("MasterConversations", fields: [masterId], references: [id])
  masterId    String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  messages    Message[]

  @@unique([taskRequestId, customerId, masterId])
}

model Message {
  id             String       @id @default(uuid())
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  conversationId String
  sender         User         @relation("MessageSender", fields: [senderId], references: [id])
  senderId       String
  text           String
  attachments    String[]     @default([]) // URLs
  isRead         Boolean      @default(false)
  createdAt      DateTime     @default(now())

  @@index([conversationId, createdAt])
}
```

Добавить relations в существующие модели:
```prisma
// В TaskRequest:
conversations Conversation[] @relation("TaskConversations")

// В User:
customerConversations Conversation[] @relation("CustomerConversations")
masterConversations  Conversation[] @relation("MasterConversations")
sentMessages         Message[]      @relation("MessageSender")
```

```bash
npx prisma migrate dev --name add_chat_schema
```

### Шаг 3.2 — Создание conversation при принятии отклика

**Обновить:** `src/features/task-response/api/accept-response.ts` (или аналогичный server action)

После принятия отклика:
```ts
await prisma.conversation.create({
  data: {
    taskRequestId: taskId,
    customerId: task.customerId,
    masterId: response.masterId,
  }
})
```

### Шаг 3.3 — Server Actions для чата

**Создать:** `src/features/chat/api/`

Файлы:
- `get-conversations.ts` — список conversation пользователя
- `get-messages.ts` — сообщения конкретной conversation с пагинацией
- `send-message.ts` — отправка сообщения
- `mark-as-read.ts` — пометить сообщения прочитанными
- `upload-attachment.ts` — загрузка файлов в чат

### Шаг 3.4 — UI чата

**Создать:** `src/features/chat/ui/`

Компоненты:
- `ChatList.tsx` — список диалогов (sidebar)
- `ChatWindow.tsx` — окно переписки
- `MessageBubble.tsx` — отдельное сообщение (входящее/исходящее)
- `MessageInput.tsx` — поле ввода + кнопка отправки + аттач
- `ChatEmpty.tsx` — заглушка когда нет сообщений

**Создать:** `src/app/dashboard/chat/page.tsx`

- Список conversation слева, выбранная conversation справа
- Адаптив: на мобиле — либо список, либо окно

**Создать:** `src/app/dashboard/chat/[conversationId]/page.tsx`

- Конкретная переписка
- Polling каждые 3 секунды или Server-Sent Events для реал-тайма
- Кнопка "Назад" к списку (для мобилы)

### Шаг 3.5 — Уведомления о новых сообщениях

**Обновить:** `src/entities/notification/` (или соответствующий feature)

- Новый тип уведомления: `NEW_MESSAGE`
- При отправке сообщения — создание Notification для получателя
- Telegram Bot: отправка сообщения мастеру/заказчику через Bot API

### Шаг 3.6 — Бейдж непрочитанных

**Обновить:** Навигация в dashboard

- Показать счётчик непрочитанных сообщений на пункте "Чат"
- Query: `prisma.message.count({ where: { conversation: { customerId/masterId: userId }, isRead: false } })`

---

## Sprint 4: Тесты

**Цель:** Покрытие критичных путей тестами, CI-проверка.

### Шаг 4.1 — Vitest установка

```bash
npm install -D vitest @vitest/coverage-v8 jsdom @testing-library/react @testing-library/jest-dom
```

**Создать:** `vitest.config.ts`

```ts
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['**/node_modules/**', '**/*.d.ts', 'prisma/**'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

**Создать:** `src/__tests__/setup.ts`

```ts
import '@testing-library/jest-dom/vitest'
```

**Обновить:** `package.json` — scripts:
```json
"test": "vitest",
"test:run": "vitest run",
"test:coverage": "vitest run --coverage"
```

### Шаг 4.2 — Моки для Next.js и Telegram

**Создать:** `src/__tests__/mocks/next.ts`

- Мок `next/server` (NextResponse, NextRequest)
- Мок `next/navigation` (useRouter, redirect)

**Создать:** `src/__tests__/mocks/telegram.ts`

```ts
// Мок window.Telegram.WebApp
globalThis.Telegram = {
  WebApp: {
    initData: 'mock_init_data',
    initDataUnsafe: { user: { id: 12345, username: 'testuser' } },
    ready: () => {},
    expand: () => {},
    themeParams: {},
    MainButton: { show: () => {}, hide: () => {}, setText: () => {} },
    HapticFeedback: { notificationOccurred: () => {} },
  }
}
```

### Шаг 4.3 — Юнит-тесты: Server Actions

**Приоритет:** Критичные server actions

Тесты для:
- `loginWithTelegram` — валидная initData, невалидная подпись, просроченная initData
- `createTask` — валидные данные, missing поля, неавторизованный
- `acceptResponse` — создание conversation, проверка прав
- `updateProfile` — валидация, обновление

**Создать:** `src/features/auth/__tests__/login.test.ts`
**Создать:** `src/features/task-creation/__tests__/create-task.test.ts`
**Создать:** `src/features/task-response/__tests__/accept-response.test.ts`

### Шаг 4.4 — Юнит-тесты: Утилиты

Тесты для:
- `src/shared/lib/auth.ts` — JWT создание/верификация/refresh
- `src/shared/lib/rate-limit.ts` — лимит срабатывает, лимит не срабатывает
- `src/shared/lib/telegram/` — HMAC валидация

**Создать:** `src/shared/lib/__tests__/auth.test.ts`
**Создать:** `src/shared/lib/__tests__/rate-limit.test.ts`

### Шаг 4.5 — Интеграционные тесты: API роуты

**Создать:** `src/__tests__/integration/`

Тесты для:
- `GET /api/health` — возвращает 200
- `GET /api/suggest/address` — запрос с query, пустой запрос
- `GET /api/jobs/expire-tasks` — expire задач с истёкшим deadline

Для интеграционных тестов нужна тестовая БД:
- Использовать `docker-compose` с отдельным контейнером `postgres-test`
- Или использовать SQLite как тестовый бэкенд Prisma

### Шаг 4.6 — Playwright E2E

```bash
npm install -D @playwright/test
npx playwright install
```

**Создать:** `playwright.config.ts`

Критичные E2E сценарии:
1. **Авторизация:** Открыть app → Telegram Web App → редирект на /dashboard
2. **Создание задачи:** /dashboard/create-task → заполнить форму → увидеть в ленте
3. **Отклик на задачу:** /dashboard/feed → открыть задачу → отправить отклик
4. **Принятие отклика:** Заказчик видит отклик → принимает → появляется чат
5. **Чат:** Отправить сообщение → получить сообщение
6. **Завершение задачи:** Заказчик завершает → оставляет отзыв

**Создать:** `e2e/auth.spec.ts`
**Создать:** `e2e/task-flow.spec.ts`
**Создать:** `e2e/chat.spec.ts`

### Шаг 4.7 — CI проверка тестов

**Обновить:** `.github/workflows/ci.yml` (см. Sprint 5)

---

## Sprint 5: CI/CD и инфраструктура

### Шаг 5.1 — GitHub Actions CI

**Создать:** `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [master]
  pull_request:
    branches: [master]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'
      - run: npm ci
      - run: npm run lint

  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'
      - run: npm ci
      - run: npx tsc --noEmit

  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgis/postgis:16-3.4
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'
      - run: npm ci
      - run: npx prisma generate
      - run: npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
      - run: npm run test:run
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run build
      - run: npx playwright test
```

### Шаг 5.2 — Prettier + Husky

```bash
npm install -D prettier husky lint-staged
```

**Создать:** `.prettierrc`

```json
{
  "semi": false,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

```bash
npm install -D prettier-plugin-tailwindcss
```

**Обновить:** `package.json` — scripts:
```json
"format": "prettier --write \"src/**/*.{ts,tsx,css,json}\"",
"format:check": "prettier --check \"src/**/*.{ts,tsx,css,json}\"",
"prepare": "husky"
```

**Создать:** `.husky/pre-commit`

```bash
#!/bin/sh
npx lint-staged
```

**Создать:** `lint-staged.config.js`

```js
export default {
  'src/**/*.{ts,tsx}': ['eslint --fix', 'prettier --write'],
  'src/**/*.{css,json}': ['prettier --write'],
}
```

### Шаг 5.3 — Bundle Analyzer

```bash
npm install -D @next/bundle-analyzer
```

**Обновить:** `next.config.ts`

```ts
import bundleAnalyzer from '@next/bundle-analyzer'

const withBundleAnalyzer = bundleAnalyzer({ enabled: process.env.ANALYZE === 'true' })

export default withBundleAnalyzer({
  // ...existing config
})
```

**Обновить:** `package.json` — script:
```json
"analyze": "ANALYZE=true next build"
```

### Шаг 5.4 — Sentry мониторинг

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

Что настроит wizard:
- `sentry.client.config.ts` — клиентский Sentry
- `sentry.server.config.ts` — серверный Sentry
- `sentry.edge.config.ts` — edge runtime
- Source maps upload в build процессе

Добавить `SENTRY_DSN` в `.env`

### Шаг 5.5 — SEO / OG

**Создать:** `src/app/robots.ts`

```ts
export default function robots() {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: 'https://district-master.ru/sitemap.xml',
  }
}
```

**Создать:** `src/app/sitemap.ts`

```ts
export default async function sitemap() {
  return [
    { url: 'https://district-master.ru', lastModified: new Date() },
    // Динамические роуты: задачи, мастера
  ]
}
```

**Обновить:** `src/app/layout.tsx` — добавить metadata:

```ts
export const metadata: Metadata = {
  title: 'Районный Мастер — найдите мастера рядом',
  description: 'Сервис поиска мастеров и специалистов в вашем районе',
  openGraph: {
    title: 'Районный Мастер',
    description: 'Найдите проверенного мастера рядом с вами',
    url: 'https://district-master.ru',
    siteName: 'Районный Мастер',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    locale: 'ru_RU',
    type: 'website',
  },
}
```

**Создать:** `public/manifest.json` — TWA manifest

```json
{
  "name": "Районный Мастер",
  "short_name": "Мастер",
  "description": "Поиск мастеров и специалистов рядом",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#1a1a2e",
  "theme_color": "#1a1a2e",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

**Создать:** `public/og-image.png` — OG изображение (1200x630)

---

## Sprint 6: Geo-поиск

**Цель:** Полноценный поиск мастеров и задач по геолокации.

### Шаг 6.1 — Заполнение taskLocation

**Обновить:** `src/features/task-creation/` (форма создания задачи)

1. Добавить определение геолокации при создании задачи:
   - Вариант A: Использовать `navigator.geolocation` (браузерный GPS)
   - Вариант B: Геокодировать адресс из `address` поля через API (DaData или Nominatim)
   - Вариант C: Ручной выбор точки на карте (Leaflet карта)

2. Сохранять `lat` + `lng` в скрытых полях формы

**Обновить:** Server action создания задачи — передавать `taskLocation` как PostGIS Point

```ts
// Prisma не поддерживает Unsupported поля напрямую,
// нужно через $queryRaw:
await prisma.$executeRaw`
  UPDATE "TaskRequest"
  SET "taskLocation" = ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)
  WHERE id = ${taskId}
`
```

### Шаг 6.2 — Geo-поиск задач

**Создать:** `src/features/geo-search/api/geo-search.ts`

Server action для поиска задач в радиусе:

```ts
const tasks = await prisma.$queryRaw`
  SELECT *,
    ST_DistanceSphere(
      "taskLocation",
      ST_SetSRID(ST_MakePoint(${userLng}, ${userLat}), 4326)
    ) as distance
  FROM "TaskRequest"
  WHERE status = 'OPEN'
    AND ST_DWithin(
      "taskLocation",
      ST_SetSRID(ST_MakePoint(${userLng}, ${userLat}), 4326),
      ${radiusInMeters}
    )
  ORDER BY distance ASC
  LIMIT ${limit}
`
```

### Шаг 6.3 — UI geo-поиска

**Обновить:** `src/features/geo-search/ui/`

- `GeoSearchFilter.tsx` — фильтр по радиусу (слайдер: 1км / 5км / 10км / 25км)
- `DistanceBadge.tsx` — отображение расстояния до задачи в карточке
- Кнопка "Рядом со мной" в ленте задач

### Шаг 6.4 — Geo-поиск мастеров

Аналогично задачам, но для поиска мастеров по локации заказчика:

**Создать:** `src/features/geo-search/api/find-masters.ts`

```ts
const masters = await prisma.$queryRaw`
  SELECT mp.*, u."displayName",
    ST_DistanceSphere(
      u."location",
      ST_SetSRID(ST_MakePoint(${userLng}, ${userLat}), 4326)
    ) as distance
  FROM "MasterProfile" mp
  JOIN "User" u ON mp."userId" = u.id
  WHERE mp."isVerified" = true
    AND u."location" IS NOT NULL
    AND ST_DWithin(
      u."location",
      ST_SetSRID(ST_MakePoint(${userLng}, ${userLat}), 4326),
      ${radiusInMeters}
    )
  ORDER BY mp.rating DESC, distance ASC
`
```

### Шаг 6.5 — Сохранение локации пользователя

**Обновить:** `src/features/auth/` (login flow)

При входе через Telegram:
- Запросить геолокацию через `navigator.geolocation.getCurrentPosition()`
- Сохранить в `User.location` через `$queryRaw`

**Создать:** `src/features/geo-search/api/update-user-location.ts`

---

## Sprint 7: Важные UX-улучшения

### Шаг 7.1 — Telegram Bot webhook и deep-linking

**Обновить:** Telegram Bot (существующий)

1. Настроить webhook для входящих сообщений:
   - Bot → Webhook → `/api/bot/webhook` route handler
   - Обработка `/start task_<id>` — deep-link на конкретную задачу

2. Входящие сообщения от пользователей через бота:
   - Парсинг команды `/start task_123`
   - Перенаправление на TWA с параметром `?startapp=task_123`

**Создать:** `src/app/api/bot/webhook/route.ts`

```ts
// POST handler для Telegram Bot webhook
// Парсинг update, обработка callback_query, message
```

### Шаг 7.2 — TWA Theme Sync

**Обновить:** `src/app/layout.tsx` или глобальный CSS

```ts
// В клиентском компоненте при загрузке:
const tg = window.Telegram?.WebApp
if (tg?.themeParams) {
  document.documentElement.style.setProperty('--bg-color', tg.themeParams.bg_color || '#1a1a2e')
  document.documentElement.style.setProperty('--text-color', tg.themeParams.text_color || '#ffffff')
  document.documentElement.style.setProperty('--hint-color', tg.themeParams.hint_color || '#888')
  document.documentElement.style.setProperty('--link-color', tg.themeParams.link_color || '#6366f1')
  document.documentElement.style.setProperty('--button-color', tg.themeParams.button_color || '#6366f1')
  document.documentElement.style.setProperty('--button-text-color', tg.themeParams.button_text_color || '#ffffff')
  document.documentElement.style.setProperty('--secondary-bg-color', tg.themeParams.secondary_bg_color || '#2a2a3e')
}
```

**Обновить:** `tailwind.config` — использовать CSS variables вместо хардкода

### Шаг 7.3 — Полнотекстовый поиск

**Обновить:** `src/features/task-view/` или `src/widgets/TaskFeed/`

Вариант A — PostgreSQL FTS (рекомендуется):

```ts
// Server action поиска:
const tasks = await prisma.$queryRaw`
  SELECT * FROM "TaskRequest"
  WHERE status = 'OPEN'
    AND to_tsvector('russian', "title" || ' ' || COALESCE("description", ''))
        @@ plainto_tsquery('russian', ${searchQuery})
  ORDER BY ts_rank(
    to_tsvector('russian', "title" || ' ' || COALESCE("description", '')),
    plainto_tsquery('russian', ${searchQuery})
  ) DESC
  LIMIT ${limit}
`
```

Вариант B — Fuzzy matching (проще, но менее точно):

```ts
// Через Prisma:
where: {
  OR: [
    { title: { contains: query, mode: 'insensitive' } },
    { description: { contains: query, mode: 'insensitive' } },
  ]
}
```

Вариант C — pg_trgm extension (fuzzy + GIN index):

```sql
-- Миграция:
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_task_search ON "TaskRequest" USING gin ("title" gin_trgm_ops, "description" gin_trgm_ops);
```

**Рекомендация:** Начать с варианта A (FTS), добавить pg_trgm для fuzzy если нужно.

---

## Sprint 8: Монетизация (фаза роста)

### Шаг 8.1 — Telegram Stars

- Интеграция Telegram Stars API для оплаты
- Платное поднятие задачи в топ ленты
- Платное выделение задачи цветом

### Шаг 8.2 — Featured-листинг мастеров

- Платное размещение мастера в блоке "Рекомендуемые"
- Бейдж "Рекомендуемый мастер"

### Шаг 8.3 — Подписка PRO для мастеров

- Ежемесячная подписка: приоритет в поиске, расширенная статистика, безлимитные отклики

### Шаг 8.4 — Реферальная программа

- Реферальный код для приглашения
- Бонусы за приглашённого мастера/заказчика

---

## Сводная таблица зависимостей

```
Sprint 1 (Админка)          — независимый
Sprint 2 (Профиль)          — независимый
Sprint 3 (Чат)              — зависит от Sprint 2 (частично, через user model)
Sprint 4 (Тесты)            — независимый, но лучше после 1-3
Sprint 5 (CI/CD)            — независимый, можно параллельно
Sprint 6 (Geo)              — зависит от Sprint 2 (location пользователя)
Sprint 7 (UX)               — независимый
Sprint 8 (Монетизация)      — после всех предыдущих
```

## Рекомендуемый порядок

```
1 → 2 → 3 → 4 → 5 → 6 → 7 → 8
```

Спринты 4 и 5 можно вести параллельно с основными фичами.
