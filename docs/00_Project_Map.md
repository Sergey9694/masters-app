# 00. Карта проекта (Project Map)

> Актуализировано: 2026-04-08. Единая точка правды о структуре и ответственности модулей. При рассинхроне с другими docs — этот документ приоритетнее.

---

## 1. Что такое «Мастер Района»

Гиперлокальный маркетплейс бытовых услуг внутри **Telegram Web App (TWA)**. Заказчик создаёт тендер → соседи-мастера в радиусе 10–15 минут пешком получают уведомление и откликаются.

Монетизация: подписка для мастеров + платная верификация + буст в топе.

Текущая фаза: **2.3 (MVP стабилизация)**, готовность ~85%. Полный цикл сделки + Yandex Maps + Tailwind 4 Build Fix + Photo Upload (beta).

---

## 2. Фактический стек (по `package.json`)

| Слой | Версия | Заметка |
| :--- | :--- | :--- |
| Next.js | **16.1.7** (App Router) | `output: "standalone"` |
| React | **19.2.3** | — |
| TypeScript | 5.9.3 | strict |
| Tailwind CSS | **4** | через `@tailwindcss/postcss` |
| Prisma | **5.10.0** (не 7!) | `url = env("DATABASE_URL")` работает |
| Driver | `pg 8.20` | — |
| PostgreSQL | 16 + PostGIS 3.4 | через Docker |
| Telegram | `@twa-dev/sdk 8.0.2` | + `@twa-dev/types` |
| Auth | `jose 6.2` | JWT HS256 |
| UI | Shadcn + Radix + `@base-ui/react` | — |
| Motion | `framer-motion 12.38` + `motion` | алиасы |
| Forms | `react-hook-form` + `@hookform/resolvers` + `zod 4.3` | — |
| Images | `sharp 0.34` | resize + WebP конвертация при загрузке |
| Toasts | `sonner 2.0` | — |
| Прочее | `next-themes`, `vaul`, `date-fns`, `lucide-react`, `class-variance-authority`, `tailwind-merge`, `uuid` | — |

**Важно:** документация `03_Database.md` ссылается на «Prisma 7», но в репозитории стоит **Prisma 5**. Миграция на 7 не произведена.

---

## 3. Структура репозитория

```
masters-app/
├── docs/                       ← документация (этот файл — здесь)
├── prisma/
│   ├── schema.prisma           ← модели User, MasterProfile, TaskRequest, и т.д.
│   └── seed.ts                 ← сиды категорий и тестовых юзеров
├── scripts/
│   ├── dev.ps1                 ← запуск dev-сервера (Windows)
│   ├── db-check.ts             ← проверка подключения к БД
│   ├── resize-image.ts         ← утилита для preview-картинок
│   └── startup.js              ← init для Docker-контейнера
├── public/                     ← статика
├── postgres_data/              ← volume Postgres (в .gitignore должен быть)
├── docker-compose.yml          ← Postgres + PostGIS + app
├── Dockerfile                  ← multi-stage сборка Next.js
├── next.config.ts              ← security headers, standalone output
├── .env                        ← локальные секреты (DATABASE_URL, JWT_SECRET, TG_TOKEN)
├── .env.example                ← шаблон
├── implementation_plan.md      ← изначальный план (исторический)
└── src/
    ├── app/                    ← роутинг Next.js (App Router)
    ├── proxy.ts                ← middleware (Next.js 16 переименовал в proxy)
    ├── widgets/                ← крупные блоки UI
    ├── features/               ← пользовательские сценарии
    ├── entities/               ← бизнес-сущности
    └── shared/                 ← переиспользуемые примитивы
```

---

## 4. FSD слои — что где лежит и за что отвечает

### 4.1 `src/app/` — роутинг и композиция

| Файл/папка | Ответственность |
| :--- | :--- |
| `layout.tsx` | Корневой layout, шрифты Outfit+Mono, подключение `telegram-web-app.js`, Sonner Toaster |
| `page.tsx` | **Лендинг** `/` — публичная страница, содержит `<TelegramAuth />` (автологин) и CTA-кнопку в бота |
| ~~`providers.tsx`~~ | Удалён (был мёртвый код) |
| `template.tsx` | Обёртка для page-transition анимаций |
| `globals.css` | Tailwind 4 + CSS-переменные темы + `.container-standard` |
| `favicon.ico` | — |
| `api/health/route.ts` | `/api/health` → 200 OK для Docker healthcheck |
| `dashboard/page.tsx` | Главная защищённая страница. Вызывает `getCurrentUser()`, при null → redirect `/` |
| `dashboard/DashboardContent.tsx` | Client-компонент дашборда, рендерит категории и виджеты |
| `dashboard/create-task/page.tsx` | Страница формы создания заказа |
| `dashboard/feed/page.tsx` | Лента задач для мастеров |
| `dashboard/become-master/page.tsx` | Регистрация профиля мастера (bio + категории) |
| `dashboard/task/[id]/page.tsx` | Детальная заявки: отклики, принятие, завершение, отзыв |
| `dashboard/my-tasks/page.tsx` | Список своих заявок (для customer) по статусам |
| `dashboard/my-responses/page.tsx` | Список откликов мастера + отметка «вы выбраны» |
| `api/suggest/address/route.ts` | Серверный прокси к DaData (подсказки адресов) |
| `api/uploads/[filename]/route.ts` | Раздача загруженных фото (WebP, Cache-Control immutable) |

### 4.2 `src/widgets/` — крупные блоки интерфейса

| Виджет | Файлы | Что делает |
| :--- | :--- | :--- |
| `CategoryGrid` | `ui/CategoryGrid.tsx`, `index.ts` | Сетка категорий услуг на дашборде |
| `TaskFeed` | `ui/TaskFeed.tsx` (RSC), `ui/TaskFeedClient.tsx` (клиент), `ui/TaskCard.tsx`, `ui/SearchInput.tsx`, `api/load-tasks.ts`, `index.ts` | Рендер списка задач с cursor-based пагинацией, кнопкой «Показать ещё» и поиском по title/description |

### 4.3 `src/features/` — пользовательские сценарии

| Feature | Файлы | Ответственность | Статус |
| :--- | :--- | :--- | :--- |
| `auth` | `ui/TelegramAuth.tsx` (auto-login), `model/actions.ts` (`loginWithTelegram` + rate-limit, `mockLogin`), `index.ts` | Вход через TWA initData + fallback mock-login для разработки | 🟢 работает |
| `task-creation` | `ui/TaskCreateForm.tsx`, `model/task-schema.ts` (Zod), `api/create-task-action.ts` (+ rate-limit), `api/upload-action.ts` (sharp → WebP + rate-limit), `index.ts` | Создание заказа с загрузкой фото, подсказки адреса через `/api/suggest/address` | 🟢 работает |
| `master-registration` | `ui/MasterRegistrationForm.tsx`, `model/schema.ts`, `api/actions.ts` (`createMasterProfileAction`) | Регистрация профиля мастера: bio + выбор категорий, меняет User.role → MASTER | 🟢 работает |
| `task-response` | `ui/RespondForm.tsx`, `ui/AcceptResponseButton.tsx`, `ui/TaskStatusButtons.tsx`, `model/schema.ts`, `api/actions.ts` (`respondToTaskAction`, `acceptResponseAction`, `completeTaskAction`, `cancelTaskAction`) | Отклик мастера + принятие (→ IN_PROGRESS с `assignedMasterId`) + завершение (→ COMPLETED) + отмена | 🟢 работает |
| `review` | `ui/ReviewForm.tsx`, `model/schema.ts`, `api/actions.ts` (`createReviewAction`) | Отзыв на завершённую сделку (1-5 звёзд + текст), авто-пересчёт рейтинга мастера в транзакции | 🟢 работает |
| `geo-search` | `ui/LocationFilter.tsx` | Фильтр радиуса поиска для мастеров | 🛠 отложен (адрес текстовый) |

### 4.4 `src/entities/` — бизнес-сущности

| Entity | Файлы | Ответственность |
| :--- | :--- | :--- |
| `user` | `model/` (пустая), `ui/` (пустая) | ⚠️ Слой заведён, но реализации модели/UI нет — всё пока в `shared/lib/get-user.ts` |
| `task` | `api/task-geo.ts` | Гео-запросы PostGIS (ST_DWithin) для задач |

Отсутствующие entity, которые явно нужны: `category`, `master-profile` (логика в features/master-registration), `review`. `task-response` логика — в features/task-response.

### 4.5 `src/shared/` — примитивы

#### `shared/ui/` (15 компонентов Shadcn-style)
`badge`, `button`, `card`, `drawer`, `form`, `input`, `label`, `motion-toast`, `page-transition`, `select`, `skeleton`, `stagger-item`, `stagger-wrap`, `textarea`.

#### `shared/lib/`
| Файл | Назначение |
| :--- | :--- |
| `auth.ts` | JWT (jose): `encrypt/decrypt`, `createSession`, `getSession`, `logout`, `updateSession`, `validateTelegramWebAppData` (HMAC-SHA256) |
| `db.ts` | Singleton Prisma Client |
| `get-user.ts` | DAL: `getCurrentUser()` с `select` только нужных полей |
| `motion.ts` | Пресеты анимаций: `STAGGER_CONTAINER`, `STAGGER_ITEM`, `BLUR_IN`, `HOVER_GLOW`, `CLICK_SCALE`, `TRANSITIONS` |
| `cn.ts` | `clsx + tailwind-merge` helper |
| `rate-limit.ts` | In-memory rate-limiter для Server Actions (ключ, лимит, окно) |
| `storage/file-storage.ts` | Загрузка фото: sharp resize 1920px → WebP q85, сохранение в `<cwd>/uploads/` (Docker volume) |
| `telegram/use-haptics.ts` | Хук Haptic Feedback TWA |
| `telegram/use-main-button.ts` | Хук tg.MainButton |
| `maps.ts` | Утилита генерации ссылок для Яндекс Карт |

#### `shared/types/`
| Файл | Содержит |
| :--- | :--- |
| `auth.ts` | `SessionPayload`, `Role` |
| `domain.ts` | Доменные типы (TaskStatus, категории) |

#### `shared/api/` — **пустая папка** (зарезервирована под Telegram Bot API, внешние интеграции)

### 4.6 `src/proxy.ts` — middleware Next.js 16

Защита маршрутов. Matcher: `/dashboard/*`, `/admin/*`, `/api/*`. Проверяет `session` cookie, валидирует JWT, продлевает сессию (sliding), при невалидности — чистит cookie и редиректит на `/`.

Мёртвая ссылка на `/api/auth/telegram` убрана.

---

## 5. БД — модели Prisma

Файл: [prisma/schema.prisma](../prisma/schema.prisma)

| Модель | Ключевые поля | Связи |
| :--- | :--- | :--- |
| `User` | `id`, `telegramId` (BigInt unique), `phone`, `role` (enum), `firstName`, `lastName`, `avatar`, `location` (PostGIS Point) | 1:1 `MasterProfile`, 1:N `TaskRequest`, 1:N `Review` (автор) |
| `MasterProfile` | `bio`, `isVerified`, `isLocal`, `rating` | 1:1 `User`, N:M `Category` через `MasterCategory`, 1:N `TaskResponse`, 1:N `Review` |
| `TaskRequest` | `title`, `description`, `images[]`, `budget`, `address`, `status` (enum: OPEN/IN_PROGRESS/COMPLETED/CANCELED), `assignedMasterId`, `taskLocation` (Point) | N:1 `User` (customer), N:1 `Category`, N:1 `MasterProfile` (assigned, optional), 1:N `TaskResponse`, 1:1 `Review` |
| `TaskResponse` | `price`, `message` | N:1 `TaskRequest`, N:1 `MasterProfile` |
| `Category` | `name`, `icon` | 1:N `TaskRequest`, N:M `MasterProfile` |
| `MasterCategory` | composite PK | связка M:N |
| `Review` | `taskId` (unique), `rating` (Int), `text` | 1:1 `TaskRequest`, N:1 `MasterProfile`, N:1 `User` (author) |

**Отсутствующие индексы (критично для production):**
- GIST на `User.location` и `TaskRequest.taskLocation`
- B-tree на `TaskRequest(status, categoryId, createdAt)`
- B-tree на `TaskResponse(taskId)`

---

## 6. Авторизация — как работает (сейчас)

```
┌─────────────────────────────────────────────────────────────────────┐
│ 1. Юзер открывает TWA в Telegram → загружается /                    │
│ 2. layout.tsx вставляет <Script src="telegram-web-app.js">          │
│ 3. page.tsx рендерит <TelegramAuth />                               │
│ 4. useEffect читает window.Telegram.WebApp.initData                 │
│ 5. Если initData есть → вызов Server Action loginWithTelegram       │
│ 6. Server: validateTelegramWebAppData() — HMAC проверка подписи     │
│ 7. Server: upsert User по telegramId (find → create)                │
│ 8. Server: createSession → JWT в httpOnly cookie "session"          │
│ 9. Client: router.push("/dashboard")                                │
│ 10. proxy.ts проверяет cookie → decrypt → пропускает                │
│ 11. dashboard/page.tsx: getCurrentUser() → RSC рендер               │
└─────────────────────────────────────────────────────────────────────┘
```

**Dev fallback**: на лендинге есть кнопка «Войти как Тестовый Админ» → вызывает `mockLogin` (только в NODE_ENV=development).

Секреты: `JWT_SECRET`, `TELEGRAM_BOT_TOKEN` в `.env`.

---

## 7. Известные текущие проблемы

| # | Файл:линия | Проблема | Приоритет | Статус |
| :-: | :--- | :--- | :---: | :---: |
| A1 | `src/features/auth/ui/TelegramAuth.tsx` | `router.refresh()` после login | 🔴 | ✅ исправлено |
| A2 | `.env` | `JWT_SECRET` — плейсхолдер | 🔴 | ✅ исправлено |
| A3 | `src/app/providers.tsx` | Мёртвый код | 🟡 | ✅ удалён |
| A4 | `src/proxy.ts` | Ссылка на `/api/auth/telegram` | 🟡 | ✅ исправлено |
| A5 | `src/features/auth/model/actions.ts` | TTL `auth_date` initData | 🟠 | ✅ исправлено |
| A6 | `src/shared/lib/auth.ts` | `payload as any` | 🟡 | ✅ исправлено |
| A7 | `prisma/schema.prisma` | GIST-индексы для Point-полей | 🟠 | 🛠 отложено (адрес текстовый) |
| A8 | `03_Database.md` | Prisma 7 vs 5.10 | 🟡 | 📝 в `00_Project_Map` оговорено |
| A9 | FSD-barrels (`index.ts`) | Контракт слоёв | 🟡 | ✅ добавлены |
| A10 | Rate-limit на Server Actions | Абьюз `login`, `createOrder`, `upload` | 🟠 | ✅ in-memory limiter |
| A11 | CSP-заголовки | XSS → кража cookies | 🟠 | ✅ добавлены в next.config.ts |
| A12 | Tailwind 4 Build Error | Nested `@utility` | 🔴 | ✅ исправлено (08.04) |
| A13 | Broken TG Avatars | No-referrer policy | 🔴 | ✅ исправлено (08.04) |
| A14 | Maps Integration | Yandex Maps clickable links | 🟡 | ✅ реализовано (08.04) |

Подробный план фиксов — в [06_Development_Plan.md](06_Development_Plan.md).

---

## 8. Быстрые команды разработки

```bash
npm run dev           # локальный dev-сервер (scripts/dev.ps1, Windows)
npm run dev:tunnel    # dev + cloudflared туннель + авто-обновление TWA URL у DEV-бота
npm run build         # production сборка (standalone)
npm run start         # запуск production-билда
npm run lint          # ESLint

# Docker
docker compose up -d              # Postgres + PostGIS
docker compose logs -f app

# Prisma
npx prisma migrate dev            # применить миграции
npx prisma studio                 # GUI для БД
npx prisma db seed                # сид категорий

# Диагностика авторизации (без Telegram-клиента)
npx tsx scripts/auth-selftest.ts
```

### Dev-флоу для тестирования TWA на localhost

```
┌──────────────────────────────────────────────────────────────────┐
│  npm run dev:tunnel                                              │
│  ├─ стартует bin/cloudflared.exe → HTTPS URL trycloudflare.com   │
│  ├─ через Bot API (setChatMenuButton) прописывает URL у DEV-бота │
│  └─ стартует next dev на :3000                                   │
│                                                                  │
│  Ты открываешь @RayonMasterDev_Bot → WebApp уже настроен         │
└──────────────────────────────────────────────────────────────────┘
```

**Один раз настроить:** создать DEV-бота у `@BotFather` и положить его токен в `.env.local` (`TELEGRAM_DEV_BOT_TOKEN`). Prod-бот `@RayonMaster_Bot` и его URL `https://local-masters.duckdns.org` при этом не трогаются.

---

## 9. Переменные окружения (`.env`)

| Ключ | Назначение | Обязательность |
| :--- | :--- | :---: |
| `DATABASE_URL` | Строка подключения Postgres | ✅ |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | Для docker-compose | ✅ |
| `JWT_SECRET` | Подпись сессий. В проде ≥32 байта. | ✅ |
| `TELEGRAM_BOT_TOKEN` | Для валидации initData | ✅ |
| `TELEGRAM_BOT_NAME` | Имя бота (server-side) | 🟡 |
| `NEXT_PUBLIC_BOT_NAME` | Имя бота (client, для ссылок) | 🟡 |
| `NEXT_PUBLIC_APP_URL` | Публичный URL приложения | 🟡 |
| `DADATA_API_KEY` | Токен DaData для `/api/suggest/address` (server-only) | 🟡 |

---

## 10. Навигация по документации

1. [01. Введение и концепция](01_Introduction.md)
2. [02. Архитектура и стек](02_Architecture.md)
3. [03. База данных и PostGIS](03_Database.md) ⚠️ упоминает Prisma 7, по факту 5
4. [04. Статус и Roadmap](04_Status_and_Roadmap.md)
5. [05. Известные ошибки](05_Known_Issues.md)
6. [06. Аудит и план разработки](06_Development_Plan.md) ← пошаговый roadmap
7. [Жизненный цикл проекта](Project_Lifecycle.md)
8. **[00. Карта проекта](00_Project_Map.md)** (этот файл) ← начинать отсюда

---

> При изменении структуры репозитория — обновить §3, §4 этого документа. При изменении схемы БД — §5.
