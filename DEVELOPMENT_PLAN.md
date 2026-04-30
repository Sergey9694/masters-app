# DEVELOPMENT PLAN: УслугиРядом

> Полная переработка проекта "Районный Мастер" → "УслугиРядом"
> Доска объявлений услуг для города: Desktop Web + React Native
> Дата создания: 2026-04-16

---

## Статус фаз

| Фаза | Название | Статус | Готовность |
|---|---|---|---|
| 1 | Фундамент и ребрендинг | ✅ Завершена | 100% |
| 2 | Новая система авторизации | ✅ Завершена | 100% |
| 3 | Эволюция модели данных | ✅ Завершена | 100% |
| 4 | REST API слой | ✅ Завершена | 100% |
| 5 | Desktop Web UI | ✅ Завершена | 100% |
| 6 | Объявления от исполнителей | 🟡 Частично | ~70% |
| 7 | Чат и уведомления | ✅ Завершена | 100% |
| 8 | Тесты и CI/CD | 🟡 Базовый контур завершён | 85% |
| 9 | React Native (Expo) | ❌ Не начата | 0% |
| 10 | Geo-поиск и мульти-город (10.1–10.2 geo, 10.3–10.6 карты) | ❌ Не начата | 0% |
| 11 | Полировка и запуск | ❌ Не начата | 0% |
| 11.5 | Расширенная функциональность (YouDo-scope) | ❌ Не начата | 0% |
| 11.6 | Бизнес-витрина (BusinessProfile) | ❌ Не начата | 0% |
| 12 | Монетизация MVP | ❌ Не начата | 0% |

---

## Стратегия и дифференциация

> Обновлено: 2026-04-26. Источник: `docs/strategy/competitive-analysis-2026.md`

### Ключевые конкуренты и их слабости

| Платформа | Модель монетизации | Слабые стороны |
|---|---|---|
| **Profi.ru** | Платные отклики (даже без результата) | Платишь за воздух, накрутка отзывов, слив контактов |
| **YouDo** | Платные отклики | Фейковые заказы, мошенники, деньги списываются при молчании клиента |
| **Avito Услуги** | CPL-объявления | Нет специализации, всё смешано, слабый саппорт |
| **Яндекс Услуги** | CPL-объявления | Сырой UX, регистрация занимает месяц, нет ответственности |

### Три кита дифференциации

Нет ни у одного конкурента на российском рынке:

1. **Бесплатные отклики** — моментально переманивает исполнителей с Profi.ru/YouDo
2. **Безопасная сделка (escrow)** — побеждает недоверие заказчиков без принятия ответственности платформой
3. **Честные отзывы** (только по реальным закрытым сделкам) — разрушает накрутку системно

### Дифференциаторы и их статус реализации

| Дифференциатор | Блок | Статус | Фаза |
|---|---|---|---|
| Бесплатные отклики | Бизнес-модель | 🟡 Частично (механика есть, монетизации нет) | 12 |
| Безопасная сделка (escrow) | Trust & Safety | ❌ Не реализовано | 12.4 |
| Честные отзывы по реальным сделкам | Trust & Safety | ✅ Технически реализовано | 6.5.5 |
| Верификация с уровнями (щит, лицензия) | Trust & Safety | ❌ Не реализовано | 11.5.2 |
| AI-помощник при создании заказа | UX-инновации | ❌ Не реализовано | Бэклог |
| Портфолио «До/После» | UX-инновации | ❌ Не реализовано | Бэклог |
| Видео-визитка исполнителя | UX-инновации | ❌ Не реализовано | Бэклог |
| Категория «Срочно — нужно сейчас» | UX-инновации | ❌ Не реализовано | Бэклог |
| Статус «Доступен сейчас» | Фичи исполнителей | ❌ Не реализовано | 11.5.9 |
| OG-карточки / «Посоветовать мастера» | Рост без бюджета | ❌ Не реализовано | 11.5.10 |
| Бизнес-витрина /b/[slug] | Новый сегмент | ❌ Не реализовано | 11.6 |
| Telegram-бот для городских чатов | Рост без бюджета | ❌ Не реализовано | Бэклог |
| Реферальная программа | Рост без бюджета | ❌ Не реализовано | 12.5 |

### Бизнес-модель

```
Поток           Механика                            Когда
──────────────────────────────────────────────────────────
Комиссия        8–12% только от закрытых сделок     С дня 1 (Фаза 12)
Продвижение     Топ в выдаче, выделенная карточка   После 1000 исполнителей
Абонементы      5% с recurring-платежей             Фаза 2
Платная верификация  Ускоренная проверка            Фаза 2
B2B (ЖК, УК)   Белый лейбл, API                   Фаза 3
```

### Позиционирование

**Для исполнителей:**
> *"Откликайся бесплатно. Плати только когда зарабатываешь."*

**Для заказчиков:**
> *"Деньги переходят мастеру только после того, как ты принял работу."*

### Стратегия запуска (рекомендация)

```
🔴 MVP-дифференциаторы (строить первыми — Фазы 6–12):
1. Бесплатные отклики + комиссия только со сделки
2. Безопасная сделка (технический escrow, без арбитража)
3. Отзывы только по реальным закрытым сделкам (уже готово!)
4. Верификация исполнителей (уровни)

🟡 Следующий спринт (Фаза 11.5):
5. Статус «Доступен сейчас» (11.5.9)
6. OG-карточки / «Посоветовать мастера» (11.5.10)
7. Аналитика в кабинете исполнителя (11.5.16)
8. AI-подсказка цены при создании объявления (11.5.13)

🟢 Рост (Фазы 11.6+):
9. Бизнес-витрина (11.6)
10. Абонементы / «Свой мастер»
11. Telegram-бот для городских чатов
12. SEO-страницы с калькуляторами стоимости
```

---

## Содержание

1. [Статус фаз](#статус-фаз)
2. [Стратегия и дифференциация](#стратегия-и-дифференциация)
3. [Обзор проекта](#1-обзор-проекта)
4. [Текущий статус (снимок на 2026-04-25)](#текущий-статус-снимок-на-2026-04-25)
5. [Фаза 1 — Фундамент и ребрендинг](#фаза-1--фундамент-и-ребрендинг-2-недели)
6. [Фаза 2 — Новая система авторизации](#фаза-2-новая-система-авторизации)
7. [Фаза 3 — Эволюция модели данных](#фаза-3-эволюция-модели-данных)
8. [Фаза 4 — REST API слой](#фаза-4-rest-api-слой)
9. [Фаза 5 — Desktop Web UI](#фаза-5--desktop-web-ui-3-недели)
10. [Фаза 6 — Объявления от исполнителей](#фаза-6--объявления-от-исполнителей-15-недели)
11. [Фаза 7 — Чат и уведомления](#фаза-7--чат-и-уведомления-2-недели)
12. [Фаза 8 — Тесты и CI/CD](#фаза-8--тесты-и-cicd-1-неделя)
13. [Фаза 9 — React Native (Expo)](#фаза-9--react-native-expo-3-4-недели)
14. [Фаза 10 — Geo-поиск и мульти-город](#фаза-10--geo-поиск-и-мульти-город-15-недели)
15. [Фаза 11 — Полировка и запуск](#фаза-11--полировка-и-запуск-1-неделя)
16. [Фаза 11.5 — Расширенная функциональность (YouDo-scope)](#фаза-115--расширенная-функциональность-youdo-scope-2-3-недели)
17. [Фаза 11.6 — Бизнес-витрина (BusinessProfile)](#фаза-116--бизнес-витрина-businessprofile)
18. [Фаза 12 — Монетизация MVP](#фаза-12--монетизация-mvp-15-недели)
19. [KPI и метрики запуска](#kpi-и-метрики-запуска)
20. [Прод-инфраструктура (cross-cutting)](#прод-инфраструктура-cross-cutting-по-ходу-фаз-8-11)
21. [Сводная карта зависимостей](#сводная-карта-зависимостей)

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

## Текущий статус (снимок на 2026-04-25)

### Что реально сделано (Обновлено 2026-04-25)
- **Монорепо:** Turborepo, `apps/web`, `apps/mobile` (пустой), `packages/{shared-types, validation, api-client}` — созданы.
- **Ребрендинг:** Prisma-схема переведена (Master→Provider, TaskRequest→Order, TaskResponse→Proposal).
- **Авторизация (Auth.js v5):**
  - Email + Password (регистрация, верификация, логин, сброс пароля) — **OK**.
  - Telegram Login (Desktop Widget + TWA) — **OK**.
  - **Исправлено:** Логика объединения аккаунтов (Telegram + Email) теперь обходит `Unique constraint` через транзакционный сброс ID.
  - **Исправлено:** Runtime-конфигурация `BOT_ID` (теперь передается как проп, а не берется из build-time env).
- **Безопасность:** `next-safe-action` внедрён. Мутации защищены.
- **REST API (Фаза 4):** 11 сервисов в `apps/web/src/services/`, 26 роутов в `apps/web/src/app/api/v1/`, Bearer + cookie auth.
- **Desktop UI (Фаза 5 — частично):**
  - **5.1 Дизайн-система:** Tailwind v4 `@theme` SSOT в `globals.css`, light+dark через CSS-переменные, шрифт **Geist** (вместо Inter), primary — indigo `#6366f1`.
  - **5.2 Layout:** `(main)/layout.tsx` с Header/Sidebar/Footer/BottomNav. Виджеты реализованы, theme-toggle работает.
  - **5.3 Лендинг:** `app/page.tsx` редиректит авторизованных на `/orders`, гостям показывает Hero → PopularCategories → HowItWorks → TopProviders → CTA.
  - **5.4 Лента заказов:** `(main)/orders` с `OrderFeedCard` (YouDo-стиль), виджет `OrdersFilters` с URL-синхронизацией (search/categoryId/cityId/sort), серверная сортировка по бюджету. `/dashboard/feed` → 301 на `/orders`.
  - **5.5 Страница заказа:** `(main)/orders/[id]` с breadcrumbs, grid `1fr_320px`, `OrderGalleryLight` (нативный lightbox с клавиатурной навигацией), `RespondFormLight`, `OrderControlsLight` (accept/cancel/complete/refuse), похожие заказы в сайдбаре. `/dashboard/order/[id]` → 301.
  - **5.6 Профиль и настройки:** `(main)/profile` (read-only), `(main)/settings` с секциями (основная инфа / провайдер / смена пароля). Feature `user-profile` (schema + Server Actions). Защита `/profile`, `/settings` в `proxy.ts`.
  - **5.7 Создание заказа:** `(main)/orders/new` с `OrderWizardLight` — мастер из 5 шагов (категория/город → описание → бюджет/адрес → фото → проверка). Пошаговая валидация через `form.trigger(fields)` на едином RHF. `/dashboard/create-order` → 301, `createOrderAction` редиректит на `/orders/${id}`.
  - **5.8 Миграция `/dashboard/*` → `(main)/*` (ядро):** `(main)/my-orders` (табы active/completed/archived через `?tab=`, `groupBy` для счётчиков), `(main)/my-proposals` (табы active/won/lost с составным OR-условием по `assignedProviderId`), `(main)/notifications` (с `MarkAllReadButton`, `NotificationItemLight`). Общие компоненты `OrderStatusPill` и `MyOrderRow` вынесены в `entities/order`. Старые `/dashboard/my-orders|my-proposals|notifications|page` → `redirect(...)`. Проверены и обновлены внутренние ссылки (виджеты лендинга, `OrderCard`, `auth actions`, `sync-action`) на новые маршруты. Параметр поиска в `HeroSection` приведён к `?search=`.
  - **5.9 Миграция `/dashboard/*` → `(main)/*` (вторичные флоу):** `(main)/become-provider` с `ProviderRegistrationFormLight` (аватар, портфолио, специализации, опыт, цена), `(main)/providers/[id]` — публичный профиль исполнителя (статы, категории, портфолио, отзывы). `/dashboard/become-provider` и `/dashboard/provider/[id]` → `redirect(...)`. Все ссылки на `dashboard/provider/*` и `dashboard/become-provider` заменены на новые маршруты во всех `(main)/*` страницах, виджете `TopProviders`, `proxy.ts` и server action `saveProviderProfileAction`. Исправлен overflow длинного текста (`wrap-anywhere` + `min-w-0`) во всех карточках и страницах.
  - **5.10 Завершение Фазы 5 — чистка TWA:** `(main)/my-reviews` — светлая страница отзывов исполнителя (рейтинг, карточки с аватаром/звёздами/ссылкой на заказ). `(main)/orders/[slug]/[orderSlug]/edit` — редактирование заказа (только OPEN, только владелец); `updateOrderAction` + `OrderEditFormLight` (RHF + Zod, DadataAddressInput). Кнопка «Редактировать» в детальной странице заказа теперь ведёт на новый маршрут. `/dashboard/reviews` → `redirect("/my-reviews")`. Удалено 10 legacy TWA-компонентов (`telegram-back-button`, `stagger-wrap`, `stagger-item`, `page-header`, `section-header`, `expandable-text`, `status-accordion`, `page-transition`, `back-button`, `photo-upload-field`) и 2 мёртвых файла (`DashboardContent.tsx`, `ProviderRegistrationForm.tsx`). TypeScript clean.
- **Инфраструктура (Локальная):**
  - Скрипт `npm run dev:full` полностью автоматизирован: чистит порты (3000, 4040), ждет готовности Postgres, активирует PostGIS.
  - База данных синхронизирована под именем `uslugi_db`.
- **Инфраструктура (Прод):** Docker multi-stage, авто-резолв `P3009`.

### Что запланировано, но НЕ сделано (или сделано частично)

| Фаза | Статус | Что осталось |
|---|---|---|
| 3. Модель данных | ✅ завершена | Все модели (City, Category tree, ServiceListing, Order, Proposal) полностью синхронизированы, PostGIS настроен, сиды исправлены. |
| 4. REST API | ✅ завершена | Сервисный слой (`src/services/`) реализован. Все эндпоинты `app/api/v1/*` (auth, orders, listings, proposals, providers, categories, cities, notifications, reviews, upload) покрывают план 4.2.1. |
| 5. Desktop UI | ✅ завершена | **5.1–5.10 готовы.** Все основные страницы мигрированы на `(main)/*`. Legacy TWA-компоненты удалены. TypeScript clean. |
| 6. Объявления | 🟡 частично | **6.1–6.3 готовы** (каталог, создание, управление). Осталось: редактирование `/my-listings/[slug]/edit`, модерация в `/admin/listings`. |
| 7. Чат | ✅ завершена | Инфраструктура Socket.io + Redis, шифрование сообщений, real-time уведомления и безопасность реализованы. |
| 8. Тесты/CI | 🟡 базовый контур завершён | Vitest/Playwright/CI/deploy-gate готовы и проверены. Осталось по решению владельца: Prettier, lint-staged/husky и DOM component-testing зависимости. |
| 9. React Native | ❌ | `apps/mobile/src` — пустой. Expo не инициализирован. |
| 10. Geo/мульти-город | ❌ | Зависит от Фазы 3 (`City`). PostGIS запросы не реализованы. |
| 11. Полировка | ❌ | SEO, sitemap, Sentry, PWA-manifest — не сделано. |

### Критичный следующий шаг
**Фаза 6 (доделка)** — страница редактирования `/my-listings/[slug]/edit` + модерация `/admin/listings`.
**После** — Фаза 7 (Чат и real-time инфраструктура).

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

> **Статус: ✅ Завершена**

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

## Фаза 2. Новая система авторизации

> **Статус: ✅ Завершена**

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

[x] 2.4.5  Стабилизация Telegram Auth (Production):
       - Исправлена валидация подписи (фильтрация пустых полей и лишних параметров `callbackUrl`).
       - Детальное логирование ошибок валидации для диагностики.
       - Исправлена конфигурация домена бота в BotFather.
       - Нормализованы переменные окружения на VPS (удалены кавычки в `.env`).
```

### 2.5 — Google OAuth [skip] (отменён 2026-04-17)

Отказались от Google OAuth в пользу упрощения auth-flow: остаются Email (пароль + верификация) и Telegram Login. Причина: Google требовал поддержки домена + OAuth consent screen и давал минимум пользы при наличии Telegram/Email. Решение продуктовое, обратимо (можно включить обратно за час).

### 2.6 — UI авторизации (Desktop) [x] — обновлено: модальная архитектура

> **Актуальное состояние (2026-04-25):** Auth-страницы полностью переработаны. Основной entry point — `AuthModal` (Radix Dialog) из Header; отдельные страницы `/auth/login` и `/auth/register` сохранены как fallback с настоящим `Header` из widgets. `TelegramLoginButton` использует `bg-primary` (индиго). Тексты кнопок контекстно меняются для режимов входа / регистрации. Тёмные стили «стеклянного» дизайна заменены на светлую тему проекта.

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

## Фаза 3. Эволюция модели данных

> **Статус: ✅ Завершена**

> **Статус:** Модели `City`, `Category` (дерево), `ServiceListing` полностью реализованы и синхронизированы. PostGIS настроен. База данных готова к работе с мульти-городскими заказами и объявлениями.
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

## Фаза 4. REST API слой

> **Статус: ✅ Завершена**

### Цель
Создать REST API, который будут использовать:
1. React Native приложение (через fetch)
2. Возможные внешние интеграции

Web-приложение продолжает использовать Server Actions напрямую (они эффективнее для SSR).

### 4.1 — Сервисный слой (Завершено) [x]

Сейчас бизнес-логика живёт в Server Actions. Нужно вынести её в **сервисы**, чтобы и Server Actions, и REST API могли её использовать.

```
4.1.1  Создать apps/web/src/services/ (Завершено) [x]:
       
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

### 4.2 — REST API роуты (Завершено) [x]

```
4.2.1  Структура API:

       app/api/v1/
       ├── auth/
       │   ├── register/route.ts       POST — регистрация
       │   ├── login/route.ts          POST — вход (email)
       │   ├── login/telegram/route.ts POST — вход через Telegram
       │   ├── refresh/route.ts        POST — обновить JWT
       │   ├── logout/route.ts         POST — выход
       │   └── me/route.ts             GET  — текущий пользователь [x]
       │
       ├── orders/
       │   ├── route.ts                GET  — список заказов (с фильтрами) [x]
       │   │                           POST — создать заказ [x]
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
       │       └── route.ts            GET  — мои заказы [x]
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

4.2.3  Middleware для API: [x]
       
       Обновить proxy.ts:
       - Для /api/v1/* — проверять Authorization: Bearer <jwt> [x]
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

> **Статус: ✅ Завершена**

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

> **Статус: 🟡 частично завершена (2026-04-26)**
> 6.1–6.3 и 6.5 готовы. Осталось: редактирование объявления + модерация в /admin.

### 6.1 — Создание объявления ✅

```
✅ 6.1.1  features/listing-management/api/actions.ts:
          - createListingAction (Zod + authActionClient, проверка ProviderProfile)
          - updateListingAction, deleteListingAction, toggleListingStatusAction
          - slug генерируется при создании: slugify(title) + id.slice(0,8)

✅ 6.1.2  features/listing-management/model/schema.ts:
          - createListingSchema, updateListingSchema, toggleListingSchema, deleteListingSchema

✅ 6.1.3  app/(main)/my-listings/new/ListingForm.tsx:
          - Форма создания: категория, заголовок, описание, город, адрес, цена (от/до/единица)
          - React Hook Form + zodResolver, sonner-тосты

❌ 6.1.4  (не реализовано) Rate-limit 3 объявления/час
❌ 6.1.5  (не реализовано) Уведомление администраторов о новом объявлении
```

### 6.2 — Каталог объявлений ✅

```
✅ 6.2.1  app/(main)/listings/page.tsx:
          - Фильтры: чипы по категории и городу (searchParams-driven)
          - Server-side пагинация (← Назад / Далее →)
          - Suspense + skeleton при загрузке

✅ 6.2.2  entities/listing/ui/ListingCard.tsx:
          - Карточка: фото, название, цена (от/до + единица), рейтинг, верификация
          - showStatus prop для my-listings (значок статуса)

✅ 6.2.3  app/(main)/listings/[slug]/page.tsx:
          - getById по id или slug (SEO-friendly URLs)
          - Фото-галерея, описание, детали провайдера
          - Кнопка "Разместить заказ" → /orders/new?providerId=...

❌ 6.2.4  (не реализовано) Отзывы об исполнителе на странице объявления
❌ 6.2.5  (не реализовано) Похожие объявления (sidebar)
```

### 6.3 — Управление объявлениями ✅

```
✅ 6.3.1  app/(main)/my-listings/page.tsx:
          - Табы: Активные / Приостановлены / Архив
          - Счётчики по статусам
          - Кнопки Редактировать / Приостановить-Возобновить / Удалить

✅ 6.3.2  app/(main)/my-listings/ListingActions.tsx:
          - Client component: toggle статус и delete через Server Actions
          - Confirm-диалог перед удалением

❌ 6.3.3  (не реализовано) /my-listings/[slug]/edit — страница редактирования
```

### 6.5 — Каталог специалистов и профиль исполнителя ✅

```
✅ 6.5.1  app/(main)/providers/page.tsx — каталог специалистов:
          - Фильтр по категории через searchParams (?category=<id>)
          - Карточки ProviderCard: аватар + verified-badge, имя, рейтинг,
            количество отзывов (_count), опыт, категории (до 3 + остаток), цена от
          - Текущий пользователь скрыт из каталога (не видит сам себя)
          - Пустое состояние при 0 результатах
          - providerService.list() расширен: _count.reviews в select

✅ 6.5.2  app/(main)/providers/[id]/page.tsx — переработка профиля:
          - Страница публичная (убран редирект для незалогиненных)
          - Секция «Услуги»: активные объявления мастера через listingService.getByProvider()
            компонент ListingCompactCard (обложка, категория, город, цена, дата)
          - Секция «Отзывы»: фильтр-чипы Все / Положительные (≥4★) / Отрицательные (≤2★)
            через searchParams (?reviews=positive|negative)
          - В каждом отзыве отображается название заказа (order.title)
          - Кнопка «Предложить задачу» → /orders/new?provider=<id>:
            видна только залогиненным заказчикам (не самому мастеру)
            на десктопе — справа в строке с именем, на мобильных — полная ширина под категориями
          - Кнопка «Управлять объявлениями» → /my-listings для собственного профиля
          - Breadcrumbs: Главная → Специалисты → Имя

✅ 6.5.3  services/listing.service.ts — добавлен метод getByProvider(providerId, limit):
          - Возвращает активные объявления мастера по providerId
          - Используется на странице профиля исполнителя

✅ 6.5.4  shared/config/navigation.ts — навигация обновлена:
          - «Каталог услуг» (/listings) → «Специалисты» (/providers) с иконкой Users
          - /listings по-прежнему работает как каталог объявлений, но не в меню

❌ 6.5.5  Бейдж «Только проверенные отзывы» на странице /providers/[id]:
          - Технически уже реализовано (reviewService проверяет order.status === COMPLETED)
          - Нужно только добавить UI-элемент с объяснением
```

### 6.4 — Модерация объявлений (Админка) ❌

```
❌ 6.4.1  app/admin/listings/page.tsx — таблица объявлений на модерации
❌ 6.4.2  Server Action: одобрить / отклонить (смена статуса + уведомление исполнителю)
```

### Принятые решения Фазы 6

- **Путь каталога объявлений:** `/listings` (не `/services`) — остался доступным, но убран из навигации
- **Каталог специалистов:** `/providers` стал главным входом для поиска мастеров — заменил «Каталог услуг» в навигации
- **Модель YouDo:** объявления (listings) живут внутри профиля мастера `/providers/[id]`, не как отдельный каталог
- **Slug:** генерируется при создании двухшагово (create → update), как у Order
- **Модерация отключена:** новые объявления сразу ACTIVE (упрощено для MVP)
- **Cursor-пагинация** в `listingService.search()` и `getByUser()`, offset-пагинация на странице каталога (простой ← / →)
- **listing.service.ts** обновлён: все методы используют явный `select` (no over-fetching)
- **Прямое приглашение** (11.5.8): кнопка «Предложить задачу» добавлена как заглушка → `/orders/new?provider=<id>`, полная реализация запланирована в Фазе 11.5.8
- **Исправлен** `20260423_full_geo_fix/migration.sql` — был UTF-16 full-dump, заменён на корректный delta (добавление fiasId, lat, lng в City)

---

## Фаза 7 — Чат и уведомления (2 недели)

> **Статус: ✅ Завершена (2026-04-27)**
>
> Socket.io + Redis адаптер, AES-256-GCM шифрование, двухпанельный UI, admin-модерация, REST API для мобильных.
> ⚠️ **Перед мёрджем**: создать Prisma-миграцию (`prisma migrate dev --name add_chat_models`).

### Фаза 7 — Чат и уведомления (Socket.io + Redis)

> **Статус: ✅ Завершена (Апрель 2026)**

#### Почему Redis + SSE, а не WebSocket

| | SSE + Redis | WebSocket |
|---|---|---|
| Протокол | HTTP (однонаправленный: сервер → клиент) | TCP (двунаправленный) |
| Next.js Route Handler | ✅ Нативно | ⚠️ Требует отдельного сервера |
| Горизонтальное масштабирование | ✅ Redis синхронизирует инстансы | ⚠️ Sticky sessions или отдельный WS-сервер |
| Отправка сообщений (клиент → сервер) | Server Action (обычный POST) | по WS-каналу |
| Сложность | Низкая | Высокая |

**Вывод:** SSE достаточно для нашей модели — сервер пушит события, клиент отправляет через Server Actions. WebSocket нужен только для typing indicators и подобного — это не приоритет MVP.

#### Архитектура

```
Клиент А (браузер)                 Сервер                    Клиент Б (браузер)
        │                              │                              │
        │   Server Action              │                              │
        │─── sendMessage() ──────────▶│                              │
        │                              │── Redis PUBLISH ────────────▶│ (Pub/Sub)
        │                              │   "user:Б:chat:convId"       │
        │                              │                              │── router.refresh()
        │                              │                              │   или SSE-обновление
        │◀── optimistic update ────────│                              │
```

#### Каналы Redis

```
feed:orders              — новый заказ в ленте (все авторизованные)
user:{id}:notifications  — личные уведомления (новый отклик, статус заказа, сообщение)
user:{id}:chat:{convId}  — новое сообщение в конкретном диалоге
order:{id}:proposals     — новый отклик на заказ (для владельца заказа)
```

#### Что реализовать

```
7.0.1  Добавить Redis в инфраструктуру:
       - docker-compose.yml: добавить сервис redis:7-alpine
       - npm install ioredis (в apps/web)
       - apps/web/src/shared/lib/redis.ts — singleton клиент:

         import Redis from "ioredis";
         function getRedis() {
           // lazy singleton — не в top-level scope (Docker build)
           if (!global._redis) {
             global._redis = new Redis(process.env.REDIS_URL!);
           }
           return global._redis;
         }
         export { getRedis };

       - .env: REDIS_URL=redis://localhost:6380 (локально host-порт; внутри Docker — redis://uslugi_redis:6379)

7.0.2  Создать apps/web/src/shared/lib/pubsub.ts:
       
       Публикация события:
         export async function publish(channel: string, payload: unknown) {
           await getRedis().publish(channel, JSON.stringify(payload));
         }
       
       Типы событий:
         type RealtimeEvent =
           | { type: "NEW_ORDER"; orderId: string }
           | { type: "NEW_PROPOSAL"; orderId: string; proposalId: string }
           | { type: "NEW_MESSAGE"; conversationId: string; messageId: string }
           | { type: "NOTIFICATION"; notificationId: string }
           | { type: "ORDER_STATUS"; orderId: string; status: string };

7.0.3  Создать SSE endpoint:
       apps/web/src/app/api/events/route.ts
       
       - GET /api/events?channels=user:{id}:notifications,feed:orders
       - Аутентификация: читать сессию из cookie
       - Возвращает ReadableStream с SSE-событиями
       - Подписывается на Redis-каналы через отдельный subscriber-клиент
       - При получении Redis-события → пишет в SSE-поток
       - При disconnect → отписывается от Redis
       
       Формат SSE:
         data: {"type":"NEW_ORDER","orderId":"abc123"}\n\n
         data: {"type":"NEW_MESSAGE","conversationId":"xyz"}\n\n

       Важно:
       - Каждое соединение = отдельный Redis subscriber (не шарить!)
       - Timeout: 30 секунд heartbeat (ping) чтобы не рвалось через прокси
       - Edge Runtime совместим с SSE, но ioredis требует Node.js runtime

7.0.4  Создать клиентский хук:
       apps/web/src/shared/hooks/use-realtime.ts
       
         "use client";
         import { useEffect } from "react";
         import { useRouter } from "next/navigation";
         
         export function useRealtime(channels: string[], onEvent?: (e: RealtimeEvent) => void) {
           const router = useRouter();
           useEffect(() => {
             const params = channels.map(c => `channels=${c}`).join("&");
             const es = new EventSource(`/api/events?${params}`);
             
             es.onmessage = (e) => {
               const event = JSON.parse(e.data) as RealtimeEvent;
               onEvent?.(event);
               router.refresh(); // перерендерить server components
             };
             
             return () => es.close();
           }, [channels.join(",")]);
         }

7.0.5  Встроить publish() в существующие Server Actions:
       
       createOrderAction        → publish("feed:orders", { type: "NEW_ORDER", orderId })
       submitProposalAction     → publish(`order:${orderId}:proposals`, { type: "NEW_PROPOSAL", ... })
                                → publish(`user:${order.clientId}:notifications`, { type: "NOTIFICATION", ... })
       sendMessageAction        → publish(`user:${recipientId}:chat:${convId}`, { type: "NEW_MESSAGE", ... })
       acceptProposalAction     → publish(`user:${providerId}:notifications`, { type: "ORDER_STATUS", ... })
       completeOrderAction      → publish(`user:${providerId}:notifications`, { type: "ORDER_STATUS", ... })

7.0.6  Применить useRealtime() в клиентских компонентах:
       
       OrderFeedClient:
         useRealtime(["feed:orders"]) // новые заказы в ленте
       
       Страница заказа (детальная):
         useRealtime([`order:${orderId}:proposals`]) // новые отклики
       
       NotificationBell (в Header):
         useRealtime([`user:${userId}:notifications`]) // бейдж
       
       ChatWindow:
         useRealtime([`user:${userId}:chat:${convId}`]) // сообщения

7.0.7  Graceful degradation:
       - Если Redis недоступен — publish() логирует ошибку, не падает
       - Если SSE-соединение рвётся — EventSource автоматически переподключается
       - Без real-time фичи работают как раньше (данные актуальны при навигации)
```

---

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

7.3.3  Real-time для чата:
       → Реализовано в п. 7.0 (Redis Pub/Sub + SSE).
       
       Для ChatWindow:
       - useRealtime([`user:${userId}:chat:${convId}`])
       - При NEW_MESSAGE событии → router.refresh() обновляет список сообщений
       - Оптимистичный update: добавить сообщение в локальный state сразу после отправки,
         не ждать SSE (для отправителя)
       - Typing indicator — опционально, не приоритет MVP
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
       - Реализовать как client component NotificationBell
       - useRealtime([`user:${userId}:notifications`]) из п. 7.0
       - При событии → router.refresh() → сервер возвращает актуальный счётчик
```

---

## Фаза 8 — Тесты и CI/CD (1 неделя)

> **Статус: 🟡 Базовый контур завершён (2026-04-30)**

Факт выполнения:
- Vitest подключён к `src/**/*.{test,spec}.{ts,tsx}`, добавлен V8 coverage и unit/integration baseline: 10 файлов, 49 тестов.
- Playwright настроен с desktop Chromium и mobile 375px проектом, `webServer` запускает dev-сервер автоматически.
- Добавлены smoke E2E для auth, order-flow, listing и уже существующий chat/trust набор доведён до 26/26.
- Создан `.github/workflows/ci.yml` с jobs `lint`, `typecheck`, `test`, `e2e`; `deploy.yml` получил `verify` gate перед build/push/deploy.
- Исправлен найденный E2E-блокер: `src/proxy.ts` теперь пропускает только публичные `/api/v1/auth/login`, `/api/v1/auth/login/telegram`, `/api/v1/auth/register`; остальные `/api/v1` остаются закрытыми.
- Без согласования не добавлялись новые зависимости `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`, `prettier`, `lint-staged`, `husky`.

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

> **Статус: ❌ Не начата**

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

> **Статус: ❌ Не начата**

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

### 10.3 — Координаты заказов (подготовка к картам)

```
10.3.1  Prisma: добавить lat/lng в модель Order
        - Поля: lat Float? и lng Float? (вместо orderLocation PostGIS на этом этапе)
        - orderLocation Unsupported("geometry") оставить для будущего PostGIS-поиска (10.2)
        - Миграция: ALTER TABLE "Order" ADD COLUMN "lat" DOUBLE PRECISION,
                                        ADD COLUMN "lng" DOUBLE PRECISION;

10.3.2  Геокодирование адреса при создании заказа
        - Геокодер: Яндекс Geocoder API (бесплатно 25 000 запросов/день, лучшее
          качество для РФ) ИЛИ Nominatim/OSM (бесплатно без ограничений, хуже для РФ)
        - Ключ Яндекс Геокодера: получить на developer.tech.yandex.ru
        - Реализация: shared/lib/geocode.ts
          async function geocodeAddress(address: string, city: string):
            Promise<{ lat: number; lng: number } | null>
          - Вызов при createOrderAction: если address заполнен → геокодировать → сохранить lat/lng
          - Не блокировать создание если геокодирование упало (lat/lng = null)

10.3.3  Обновить createOrderAction:
        - После валидации и до сохранения: вызвать geocodeAddress(address, city.name)
        - Сохранить lat/lng в Order если геокодирование успешно
        - При редактировании заказа: перегеокодировать если адрес изменился
```

### 10.4 — Карта внутри карточки заказа

> Цель: вместо текстовой строки адреса показывать встроенную карту с маркером,
> как на скриншоте YouDo. Карта некликабельная (или с кнопкой «Открыть маршрут»).

```
10.4.1  Технологический стек (веб):
        - Библиотека: Leaflet.js (leaflet npm) — бесплатно, без ограничений
        - Тайлы: OpenStreetMap (tile.openstreetmap.org) — бесплатно, без API-ключа
        - Компонент только клиентский ('use client'), загружается через
          dynamic(() => import(...), { ssr: false }) — Leaflet несовместим с SSR
        
10.4.2  Компонент: shared/ui/OrderMap.tsx
        Входные данные:
        - lat: number, lng: number — координаты точки
        - address?: string — текст под картой
        - height?: number — высота карты (по умолчанию 220px)
        
        Поведение:
        - Отображает карту с маркером на переданных координатах
        - Зум: 15 (уровень улицы)
        - Интерактивность отключена (dragging: false, scrollWheelZoom: false)
          — чтобы не мешала скроллу страницы
        - Кнопка «Открыть маршрут» → ссылка на Яндекс Карты:
          https://yandex.ru/maps/?rtext=~{lat},{lng}
        - Если lat/lng = null — показывать текстовый адрес как раньше

10.4.3  Интеграция в страницу заказа:
        - app/(main)/orders/[id]/page.tsx
        - Заменить текстовый адрес на <OrderMap lat={order.lat} lng={order.lng} address={order.address} />
        - Карта рендерится только если order.lat != null

10.4.4  Маркер:
        - Кастомная иконка в стиле дизайна (цвет primary из темы)
        - Leaflet DivIcon: круг с тенью, совпадающий по цвету с --color-primary
```

### 10.5 — Карта с кластерами заказов (вид «На карте»)

> Цель: переключатель «Список / На карте» на странице /orders.
> На карте — все заказы как кластеры (как на скриншоте YouDo с 5023 / 205 в кружках).

```
10.5.1  Зависимости:
        - leaflet (уже из 10.4)
        - leaflet.markercluster — плагин кластеризации (бесплатно, MIT)
        - @types/leaflet, @types/leaflet.markercluster — типы TypeScript

10.5.2  API endpoint для карты:
        - GET /api/v1/orders/map-points
        - Возвращает только { id, lat, lng, title, budget, categoryName } для всех OPEN заказов
        - Фильтры из searchParams: cityId?, categoryId?, radiusKm? (от текущей геолокации)
        - Лимит: 500 точек (карта не должна тормозить)
        - Кэш: revalidate 60 секунд (точки не меняются мгновенно)

10.5.3  Компонент: widgets/OrdersMap/ui/OrdersMap.tsx ('use client')
        - Leaflet Map + MarkerClusterGroup
        - Зум при загрузке: fitBounds по всем точкам города
        - При клике на маркер → Popup с мини-карточкой заказа:
          название, категория, бюджет, кнопка «Смотреть» → /orders/[id]
        - Цвет кластеров по количеству точек:
          < 10 → зелёный, 10–100 → оранжевый, > 100 → красный
        - Пустой город: сообщение «В этом городе нет активных заказов»

10.5.4  Переключатель на странице /orders:
        - Две кнопки: «≡ Список» / «⊞ На карте» (иконки из Lucide)
        - Состояние: URL-параметр ?view=map|list (сохраняется при навигации)
        - На мобильном: кнопки фиксированы внизу экрана над BottomNav
        - SSR: по умолчанию view=list (карта грузится только если выбрана)

10.5.5  Зоны поиска (опционально, Фаза 2):
        - Рисование зоны на карте (Leaflet.draw плагин)
        - Заказчик ограничивает радиус поиска зоной
        - Данные зоны → передаются в фильтр через PostGIS ST_Within
```

### 10.6 — Выбор адреса через карту при создании заказа

```
10.6.1  Компонент: shared/ui/AddressPicker.tsx ('use client')
        - Поле ввода адреса с автокомплитом (Яндекс Suggest API или Nominatim)
        - При вводе адреса → автоматически геокодирует → перемещает маркер
        - Маркер можно перетащить вручную → обновляет поле адреса (reverse geocoding)
        - Возвращает: { address: string, lat: number, lng: number }

10.6.2  Интеграция в форму создания заказа:
        - app/(main)/orders/new — заменить простое поле адреса на AddressPicker
        - Скрытые поля lat/lng передаются в createOrderAction
```

### Принятые решения по картам

```
Технология:     Leaflet.js + OpenStreetMap (100% бесплатно, без API-ключа,
                без лимитов, MIT-лицензия, работает в РФ)
Геокодирование: Яндекс Geocoder API (25 000 запросов/день бесплатно,
                лучшее качество для российских адресов)
                Fallback: Nominatim/OSM (если нет ключа Яндекса)
Координаты:     lat Float? + lng Float? на модели Order (простота)
                orderLocation PostGIS — оставить для geo-поиска в 10.2
Маршруты:       Кнопка «Открыть маршрут» → Яндекс Карты (deeplink)
Кластеры:       leaflet.markercluster (MIT, бесплатно)
SSR:            Leaflet только через dynamic import с ssr: false
```

---

## Фаза 11 — Полировка и запуск (1 неделя)

> **Статус: ❌ Не начата**

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

> **Статус: ❌ Не начата**
>
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

### 11.5.4 — Trust/Safety: жалобы, блокировки и модерация чата

```
[x] 11.5.4.1  Prisma: модели Trust/Safety:
              - UserBlock { blockerId, blockedId, conversationId?, reason?, createdAt }
                @@unique([blockerId, blockedId]), индексы по blockerId/blockedId/conversationId
              - Report { id, reporterId, targetType, targetId, targetUserId?, reason, description,
                evidence, status, adminNotes, actionTaken, createdAt, resolvedAt, resolvedBy }
              - enum ReportTargetType { USER, MESSAGE, CONVERSATION, ORDER, LISTING, REVIEW, PROVIDER }
              - enum ReportStatus { PENDING, REVIEWED, ACTIONED, DISMISSED }
              - enum ReportReason { SPAM, HARASSMENT, FRAUD, INAPPROPRIATE_CONTENT, CONTACT_EXCHANGE, SAFETY_THREAT, OTHER }
              - В User добавить relation-поля для Blocker/Blocked, Reporter/ReportTargetUser/ReportResolver
              
[x] 11.5.4.2  Service layer: apps/web/src/services/trust.service.ts
              - blockUser / unblockUser / getBlockState / assertCanMessage
              - createReport с evidence snapshot последних сообщений без plaintext
              - listReports / resolveReport для admin-only модерации
              
[x] 11.5.4.3  Интеграция с чатом:
              - chatService.startConversation и sendMessage проверяют UserBlock
              - ConversationPreview или отдельный loader возвращает blockState
              - Socket event user:blocked содержит { blockerId, blockedId, conversationId? }
              - BlockedState заменяет MessageInput в заблокированном диалоге
              
[x] 11.5.4.4  UI:
              - features/trust/ui/ReportModal.tsx
              - features/trust/ui/BlockUserButton.tsx
              - actions в features/trust/api/actions.ts, не в features/chat/api
              - пункты «Пожаловаться» и «Заблокировать» в ConversationHeader

[x] 11.5.4.5  Admin-страница /admin/reports — очередь жалоб с фильтрами
              - Фильтры по статусу, причине, targetType
              - Просмотр evidence и быстрые переходы к пользователю/чату/заказу/объявлению
              - Решения модератора пишутся в AuditLog
              
[ ] 11.5.4.6  Автомодерация чата (MVP): regex-фильтр на телефоны/email/telegram-ссылки
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

### 11.5.8 — Прямое приглашение исполнителя

> Заказчик видит профиль мастера и хочет предложить ему задачу напрямую, не выкладывая заказ в общую ленту.
> Мастер получает персональное уведомление и может принять или отклонить приглашение.

```
[ ] 11.5.8.1  Prisma: поле Order.invitedProviderId String? (FK → ProviderProfile.id)
              - Если заполнено — заказ скрыт из общей ленты (/orders)
              - Только приглашённый исполнитель видит его в /my-proposals
              - enum OrderVisibility { PUBLIC, PRIVATE } или boolean isPrivate

[ ] 11.5.8.2  Миграция: ALTER TABLE "Order" ADD COLUMN "invitedProviderId" TEXT REFERENCES "ProviderProfile"("id")
              ADD COLUMN "isPrivate" BOOLEAN NOT NULL DEFAULT false

[ ] 11.5.8.3  Кнопка «Предложить задачу» на /providers/[id]:
              - Видна только залогиненным заказчикам (не самому исполнителю)
              - Ведёт на /orders/new?provider=<providerId>

[ ] 11.5.8.4  Форма /orders/new — если ?provider=<id> в URL:
              - Показать блок «Вы создаёте приглашение для [Имя мастера]»
              - Скрыть из общей ленты (isPrivate = true, invitedProviderId = providerId)
              - Кнопка «Отправить приглашение» вместо «Разместить заказ»

[ ] 11.5.8.5  Server Action createOrderAction — обработка invitedProviderId:
              - Если передан — установить isPrivate=true и invitedProviderId
              - Проверить: invitedProviderId существует и статус ACTIVE

[ ] 11.5.8.6  Лента /orders — фильтровать: WHERE isPrivate = false
              Секция /my-proposals у исполнителя — показывать приглашения отдельной вкладкой «Приглашения»

[ ] 11.5.8.7  Уведомление исполнителю (тип NEW_INVITATION):
              - Push + in-app: «[Имя заказчика] приглашает вас на задачу: [Название]»
              - Ссылка на приватный заказ

[ ] 11.5.8.8  Исполнитель принимает приглашение → Order.status = IN_PROGRESS (минуя конкурс предложений)
              Исполнитель отклоняет → Order.invitedProviderId = null, isPrivate = false (заказ уходит в ленту)
```

### 11.5.9 — Статус «Доступен сейчас» 🔴 высокий приоритет

```
[ ] 11.5.9.1  Добавить поле ProviderProfile.isAvailableNow Boolean @default(false)
              - TTL-сброс через 24 часа (cron-задача или updatedAt + порог)

[ ] 11.5.9.2  UI: кнопка-тогл на странице /settings (секция профиля исполнителя)
              - Зелёная точка "Доступен сейчас" на карточке и профиле

[ ] 11.5.9.3  Каталог /providers: фильтр "Доступен сейчас" (чип или чекбокс)
              - providerService.list() расширить параметром isAvailableNow: boolean

[ ] 11.5.9.4  Особенно актуально для срочных задач (синергия с категорией "Срочно")
              Нет ни у одного конкурента на рынке
```

### 11.5.10 — OG-карточки / «Посоветовать мастера» 🔴 высокий приоритет

```
[ ] 11.5.10.1  Настроить OG-метатеги для /providers/[id] и /b/[slug] (Фаза 11.6):
               - og:title: "[Имя] — [Специализация] в [Город]"
               - og:description: рейтинг, число отзывов, краткое bio
               - og:image: аватар (или обложка для бизнес-витрины)

[ ] 11.5.10.2  Кнопка «Поделиться» / «Посоветовать мастера» на профиле:
               - Копирует ссылку в буфер или открывает нативный share sheet
               - Отображается только для публичных профилей (не собственного)

[ ] 11.5.10.3  Вирусный механизм: каждая рекомендация = бесплатный трафик на платформу
               Особенно эффективно в связке с бизнес-витриной (Фаза 11.6)
```

### 11.5.11 — Акции с дедлайном 🟡 средний приоритет

```
[ ] 11.5.11.1  Prisma: поле ProviderProfile.activePromotion Json?
               Структура: { discountPercent: number, label: string, expiresAt: DateTime }

[ ] 11.5.11.2  UI в /settings: форма запуска акции (скидка %, текст, срок действия)
               - Валидация: expiresAt не может быть в прошлом, скидка 1–90%

[ ] 11.5.11.3  Карточки в каталоге /providers: бейдж "Акция до [дата]" при наличии activePromotion
               - Визуальный приоритет: карточки с акциями выводятся выше при прочих равных

[ ] 11.5.11.4  Cron-задача: сброс истёкших акций (expiresAt < now → activePromotion = null)
```

### 11.5.12 — Блэклист заказчиков через Trust/Safety 🟡 средний приоритет

```
[ ] 11.5.12.1  Использовать UserBlock из 11.5.4 вместо отдельной ProviderBlockedClient:
               - blockerId = userId исполнителя
               - blockedId = userId заказчика
               - reason/source хранит контекст блокировки

[ ] 11.5.12.2  Server Action: blockClientAction(clientId) / unblockClientAction(clientId)
               - Обертка над trustService.blockUser / unblockUser
               - Только для пользователей с ProviderProfile

[ ] 11.5.12.3  providerService.list() — фильтровать: исполнители у которых clientId в блэклисте
               не появляются в выдаче для этого клиента (анонимно — клиент не знает о блокировке)

[ ] 11.5.12.4  UI: кнопка «Заблокировать» в профиле клиента или в карточке заказа
               Страница /settings — список заблокированных с возможностью разблокировать
```

### 11.5.13 — AI-подсказка цены при создании объявления 🟡 средний приоритет

```
[ ] 11.5.13.1  При создании ServiceListing (форма /my-listings/new):
               После выбора категории и города — показывать подсказку:
               "В категории [Название] в [Город] средняя цена — [X] руб."

[ ] 11.5.13.2  MVP: статичные диапазоны по категориям (JSON-конфиг или таблица в БД)
               Фаза 2: агрегировать из реальных закрытых сделок через Order.budget

[ ] 11.5.13.3  listingService: метод getPriceSuggestion(categoryId, cityId) → { min, avg, max }
               На старте — fallback на статичные данные, позже — реальные агрегаты из Prisma
```

### 11.5.14 — Дайджест заказов (email/push) 🟡 средний приоритет

```
[ ] 11.5.14.1  Cron-задача раз в неделю (воскресенье, 10:00 UTC):
               - Для каждого активного исполнителя — считать новые заказы за 7 дней
                 по его категориям и городу
               - Формировать персонализированный дайджест

[ ] 11.5.14.2  Email-шаблон дайджеста:
               Тема: "В категории [Сантехник] в [Казани] появилось 12 заказов. Средний бюджет — 3200 руб."
               Тело: топ-3 заказа с прямыми ссылками + кнопка "Смотреть все"

[ ] 11.5.14.3  Настройки в /settings: переключатель "Получать еженедельный дайджест"
               User.preferences Json? — хранить настройки уведомлений

[ ] 11.5.14.4  Реализовать через shared/lib/email/ + cron в apps/web/src/shared/lib/jobs/
```

### 11.5.15 — Слоты / Расписание 🟢 позже (сложнее в реализации)

```
[ ] 11.5.15.1  Prisma: модель TimeSlot
               { id, providerId, date DateTime, startTime String, endTime String, isBooked Boolean @default(false) }
               @@index([providerId, date])

[ ] 11.5.15.2  UI исполнителя: календарь с сеткой слотов, добавление/удаление окон

[ ] 11.5.15.3  UI заказчика: на профиле исполнителя — кнопка "Забронировать время"
               Выбор даты → список доступных слотов → подтверждение

[ ] 11.5.15.4  При бронировании: TimeSlot.isBooked = true + уведомление обеим сторонам
               Синергия с чатом (Фаза 7): создать Conversation с контекстом слота

[ ] 11.5.15.5  Особенно ценно для: репетиторов, косметологов, фотографов, массажистов
               Встроенный аналог Calendly — снимает friction записи без переписки
```

### 11.5.16 — Аналитика в кабинете исполнителя

```
[ ] 11.5.16.1  Prisma: модель ProfileView
               { id, providerId String, viewedAt DateTime, source String }
               ("search" | "direct" | "listing")
               @@index([providerId, viewedAt])

[ ] 11.5.16.2  Дашборд /dashboard/analytics (или секция в /settings):
               MVP — 5 ключевых метрик:
               - Просмотры профиля за 30 дней
               - Кол-во и сумма завершённых заказов
               - Конверсия откликов (отклики / просмотренные заявки)
               - Среднее время отклика на заявки
               - Динамика рейтинга

[ ] 11.5.16.3  Период: 7 дней / 30 дней / всё время — переключатель в searchParams

[ ] 11.5.16.4  Данные агрегируются на сервере (Server Component), кэшируются (не real-time)
               analyticsService.getProviderStats(providerId, period)

[ ] 11.5.16.5  Фаза 2 аналитики:
               - Графики динамики (Recharts или Chart.js, dynamic import ssr:false)
               - Сравнение с предыдущим периодом (↑↓ дельта)
               - Аналитика витрины /b/[slug] (просмотры, клики) — для Фазы 11.6
               - Топ категорий по спросу в городе исполнителя
```

---

## Фаза 11.6 — Бизнес-витрина (BusinessProfile)

> **Статус: ❌ Не начата**
>
> Отдельный режим для малого бизнеса на платформе: кондитеры, детейлинг, фотостудии, мастерские — те у кого есть бренд, но слишком маленький для отдельного сайта. Закрывает незанятую нишу — ни Profi.ru, ни YouDo, ни Avito не дают малому бизнесу полноценную витрину.
>
> **Ключевое решение:** Бизнес-профиль — апгрейд Provider-аккаунта, не отдельный тип. Один и тот же человек может откликаться как исполнитель и иметь витрину бизнеса. Один аккаунт — два режима.

### 11.6.1 — Модель данных

```
[ ] 11.6.1.1  Prisma: модель BusinessProfile (связь 1:1 с ProviderProfile, опциональная)

              model BusinessProfile {
                id            String   @id @default(cuid())
                providerId    String   @unique
                provider      ProviderProfile @relation(fields: [providerId], references: [id])

                businessName  String               // Название бизнеса
                slug          String   @unique     // URL витрины: /b/[slug]
                logo          String?              // Логотип (URL)
                coverImage    String?              // Обложка страницы (URL)
                tagline       String?              // Короткий слоган (до 150 симв.)
                description   String?              // О нас (до 500 симв.)
                portfolio     String[]             // Галерея фото/видео (URL[])
                services      Json?                // Список услуг с ценами [{name, price}]
                workingHours  Json?                // Расписание по дням недели
                socialLinks   Json?                // TG, VK, Instagram, сайт

                categoryId    String?
                category      Category? @relation(fields: [categoryId], references: [id])
                cityId        String?
                city          City?     @relation(fields: [cityId], references: [id])
                serviceArea   String?              // Зона обслуживания (текст)

                isVerified    Boolean  @default(false)
                createdAt     DateTime @default(now())
                updatedAt     DateTime @updatedAt
              }

[ ] 11.6.1.2  Миграция: npx prisma migrate dev --name add_business_profile
              Добавить обратную связь в ProviderProfile: businessProfile BusinessProfile?
```

### 11.6.2 — Форма создания / редактирования витрины

```
[ ] 11.6.2.1  Страница /settings/business (секция "Бизнес-витрина"):
              - Кнопка "Создать витрину" для исполнителей без BusinessProfile
              - Форма редактирования для тех у кого уже есть

[ ] 11.6.2.2  Поля формы: название, slug (с проверкой уникальности), логотип, обложка,
              слоган, описание, режим работы, соцсети, категория, город, зона обслуживания

[ ] 11.6.2.3  Server Action: createBusinessProfileAction / updateBusinessProfileAction
              - Zod-валидация всех полей
              - Slug: slugify(businessName) + проверка на уникальность

[ ] 11.6.2.4  Загрузка логотипа и обложки через существующий upload.service.ts
```

### 11.6.3 — Страница витрины /b/[slug]

```
[ ] 11.6.3.1  app/(main)/b/[slug]/page.tsx — публичная страница витрины:

              Структура страницы (фиксированные секции):
              ┌─────────────────────────────────────┐
              │  Обложка (cover photo)              │
              │  Лого + Название бизнеса            │
              │  Тег-категория · Город · ★ Рейтинг  │
              ├─────────────────────────────────────┤
              │  О нас (до 500 символов)            │
              ├─────────────────────────────────────┤
              │  Портфолио (галерея фото/видео)     │
              ├─────────────────────────────────────┤
              │  Услуги и цены (список с ценами)    │
              ├─────────────────────────────────────┤
              │  Отзывы (только по реальным заказам)│
              ├─────────────────────────────────────┤
              │  Режим работы · Соцсети · Контакт   │
              └─────────────────────────────────────┘

[ ] 11.6.3.2  OG-метатеги для /b/[slug] — расшаривание в Telegram/соцсети:
              Принцип: страница должна выглядеть как настоящий сайт, а не карточка справочника
              Владелец должен захотеть скинуть ссылку клиентам и в соцсети

[ ] 11.6.3.3  businessProfileService.getBySlug(slug):
              - Возвращает витрину с провайдером, категорией, городом, отзывами
              - Инкремент счётчика просмотров (для аналитики Фазы 11.5.16)
```

### 11.6.4 — Каталог /businesses

```
[ ] 11.6.4.1  app/(main)/businesses/page.tsx — каталог бизнес-витрин:
              - Фильтры: категория, город
              - Серверная пагинация
              - Карточка витрины: обложка/лого, название, категория, рейтинг, город

[ ] 11.6.4.2  businessProfileService.list(params):
              - Фильтрация по categoryId, cityId
              - Сортировка: верифицированные выше, потом по рейтингу

[ ] 11.6.4.3  Добавить /businesses в навигацию (Sidebar, Header)
              Иконка: Building2 (Lucide)
```

### 11.6.5 — Бейдж «Бизнес» в карточках

```
[ ] 11.6.5.1  Компонент entities/provider/ui/ProviderCard.tsx:
              - Если у исполнителя есть BusinessProfile → показывать бейдж "Бизнес"
              - Бейдж отличается от бейджа верификации (другой цвет/иконка)

[ ] 11.6.5.2  Аналогично в OrderCard (при наличии assignedProvider с BusinessProfile)
              и в ListingCard (при наличии provider.businessProfile)

[ ] 11.6.5.3  providerService.list() — добавить в select: businessProfile { id, businessName, slug }
```

### 11.6.6 — Монетизация витрины

```
[ ] 11.6.6.1  Базовая витрина: бесплатно (привлечение бизнесов — ключевой мотив)

[ ] 11.6.6.2  Продвижение в каталоге /businesses:
              - Аналог bump из Фазы 12.2: BusinessProfile.bumpedUntil DateTime?
              - Топ в выдаче /businesses — платно

[ ] 11.6.6.3  Премиум-функции (Фаза 2):
              - Кастомный slug (выбор вместо автогенерированного) — платно
              - Аналитика просмотров витрины (Фаза 11.5.16)
              - Приоритет в поиске исполнителей для бизнес-аккаунтов
```

---

## Фаза 12 — Монетизация MVP (1.5 недели)

> **Статус: ❌ Не начата**
>
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

## Дополнение после фаз — технический долг Фазы 8 / CI/CD / Security

> Добавлено 2026-04-30 после внедрения базового контура тестов и CI/CD. Это не блокирует следующие фазы, но должно быть разобрано до публичного запуска и перед усилением прод-нагрузки.

```
[ ] A.1  DOM/component tests:
         - согласовать dev-dependencies @testing-library/react, @testing-library/user-event,
           @testing-library/jest-dom и jsdom;
         - после согласования покрыть интерактивные клиентские компоненты без тяжёлого E2E.

[ ] A.2  Formatting и pre-commit:
         - принять отдельное решение по prettier, lint-staged и husky;
         - если внедряем, закрепить форматирование в CI и не смешивать с feature-правками.

[ ] A.3  Deploy SSH hardening:
         - убрать use_insecure_cipher: true из appleboy ssh/scp actions после обновления SSH-алгоритмов на VPS;
         - до этого оставить как OWNER_DECISION для совместимости текущего прод-сервера.

[ ] A.4  CI security:
         - добавить gitleaks или truffleHog для secret scanning;
         - включить Dependabot / Renovate и регулярный npm audit;
         - отдельно настроить правила реакции на HIGH/CRITICAL findings.

[ ] A.5  Docker supply chain:
         - держать docker/login-action, docker/setup-buildx-action и docker/build-push-action на актуальных major-версиях;
         - после стабилизации добавить SBOM/provenance и рассмотреть cosign-подпись образов.

[ ] A.6  Deploy reliability:
         - держать cache-to type=gha non-blocking, чтобы падение cache export не блокировало прод-деплой;
         - добавить post-deploy healthcheck /api/health и, позже, staging/canary перед production rollout.

[~] A.7  CI services for integration tests:
         - Redis service добавлен в GitHub Actions для E2E/verify: host 6380 -> container 6379;
         - Playwright readiness переведён на /api/health, чтобы smoke-тесты не зависели от главной страницы и БД;
         - когда появятся тесты с реальной БД, добавить PostgreSQL service;
         - миграции и seed для CI запускать явно, без доступа к production secrets.
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
| 8 | Тесты/CI | 1 нед | 🟡 базовый контур завершён |
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
