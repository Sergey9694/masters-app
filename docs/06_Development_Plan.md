# Аудит проекта и план разработки «Мастер Района»

> Составлено: 2026-04-05. Это операционный документ — шаги пронумерованы и сгруппированы по приоритету. Каждый пункт привязан к конкретному файлу/слою FSD.

---

## Часть 1. Аудит текущего состояния

### 1.1 Состояние авторизации (критично)

Пользователь сообщает: **авторизация не работает при открытии приложения**. Аудит кода выявил следующие дефекты в цепочке логина:

| # | Файл | Проблема | Риск |
| :-: | :--- | :--- | :--- |
| A1 | [src/features/auth/ui/TelegramAuth.tsx:28](../src/features/auth/ui/TelegramAuth.tsx#L28) | После успешного `loginWithTelegram` вызывается только `router.push("/dashboard")` без `router.refresh()`. Серверный RSC-кэш роутера не инвалидируется, `getCurrentUser()` на `/dashboard` может вернуть `null` → редирект обратно на `/`. | 🔴 Основная причина «петли логина» |
| A2 | [src/features/auth/ui/TelegramAuth.tsx:14](../src/features/auth/ui/TelegramAuth.tsx#L14) | `window.Telegram.WebApp` опрашивается один раз в `useEffect`. Если скрипт `telegram-web-app.js` ещё не отработал (редкий race с `beforeInteractive`), `initData` не будет прочитан, и `handleLogin` просто не запустится. | 🟠 Тихий провал |
| A3 | [src/app/layout.tsx:30](../src/app/layout.tsx#L30) + [src/app/providers.tsx:33](../src/app/providers.tsx#L33) | Скрипт Telegram подключается в `layout.tsx`, а `TWAProvider` из `providers.tsx` **никуда не импортирован** → это dead-code, при этом грозит двойной загрузкой скрипта, если его «случайно» подключат. | 🟡 Архитектурный мусор |
| A4 | [src/proxy.ts:16](../src/proxy.ts#L16) | Исключение `pathname !== "/api/auth/telegram"` ссылается на роут, которого **не существует** в `src/app/api/` (там только `health`). Server Action работает, но проектировалось API-route — рассинхрон. | 🟡 Мертвая ветка логики |
| A5 | [.env:8](../.env#L8) | `JWT_SECRET="generate-a-secure-secret-here"` — плейсхолдер. В dev fallback есть, но любая сборка с `NODE_ENV=production` поднимется с нестойким секретом. | 🔴 В проде |
| A6 | [src/app/page.tsx:97](../src/app/page.tsx#L97) | Кнопка «Запустить Сервис» через `<a href>` выполняет полный переход — это сбрасывает TWA-контекст, если открыто в iOS Telegram. Кроме того, при отсутствии `NEXT_PUBLIC_BOT_NAME` (fallback `/dashboard`) браузерный юзер уйдёт в защищённый маршрут и попадёт в цикл редиректов. | 🟠 UX/цикл |
| A7 | [src/features/auth/model/actions.ts:12](../src/features/auth/model/actions.ts#L12) | Нет проверки параметра `auth_date` initData на «свежесть» (TTL). По правилам Telegram рекомендуется отклонять initData старше 24 часов. | 🟠 Security gap |
| A8 | [src/shared/lib/auth.ts:25](../src/shared/lib/auth.ts#L25) | `SignJWT(payload as any)` — приведение `SessionPayload` к `any` теряет контроль типов. `expires: Date` сериализуется в JSON строкой, а потом читается как `Date` — потенциальный баг при обновлении сессии. | 🟡 Type safety |
| A9 | Cookies | `secure: process.env.NODE_ENV === "production"` — в dev работает, но если тестировать TWA через HTTPS-туннель (ngrok) с `NODE_ENV=development`, браузер Telegram не примет `secure:false` cookie на HTTPS-странице (SameSite=Lax + insecure через iframe в TWA ломается). | 🟠 TWA-специфично |
| A10 | [src/features/auth/api/](../src/features/auth/api/) | Папка `features/auth/api/` пустая — нарушает FSD-контракт (ожидается `index.ts` с публичным API слоя). | 🟡 FSD |

**Рекомендованный первый фикс (минимальный, чтобы разблокировать юзера):**

```tsx
// src/features/auth/ui/TelegramAuth.tsx
if (result.success) {
  toast.custom(() => <MotionToast type="success">Добро пожаловать!</MotionToast>);
  router.refresh();          // ← добавить: инвалидация RSC-кэша
  router.push("/dashboard");
}
```

И поднять реальный `JWT_SECRET` (32+ байта): `openssl rand -base64 32`.

---

### 1.2 Состояние архитектуры (FSD)

| Слой | Статус | Замечания |
| :--- | :--- | :--- |
| `app/` | ✅ | `providers.tsx` не используется. `template.tsx` присутствует — убедиться, что он нужен. |
| `widgets/` | 🟡 | `TaskFeed` без пагинации/skeleton. `CategoryGrid` без состояний loading/empty. |
| `features/` | 🟡 | `auth/api/` пустой. `geo-search/` — публичный API слоя не ясен. `task-creation/` — ОК, но нет загрузки фото. |
| `entities/` | 🟡 | Нет `entities/category`, `entities/review` — они лежат «размазано». |
| `shared/` | ✅ | `lib/auth.ts`, `lib/db.ts`, `lib/motion.ts`, `lib/telegram/*` — хорошо организовано. |

**FSD-нарушения:** нет единого `index.ts` / барреля в слоях `features/*`, `widgets/*`, `entities/*`. Публичный API каждого слайса должен экспортироваться только через `index.ts`.

---

### 1.3 Состояние БД и Prisma

| Наблюдение | Приоритет |
| :--- | :--- |
| `package.json` содержит `@prisma/client: 5.10.0`, а документация 03_Database.md описывает Prisma 7. **Факт: используется Prisma 5**. Либо обновить пакет, либо поправить доки. | 🔴 Рассинхрон |
| В `schema.prisma:8` используется `url = env("DATABASE_URL")` — в Prisma 5 это валидно, в Prisma 7 — нет. Документация упоминает переход на `prisma.config.ts`, но файл отсутствует. | 🟠 |
| Нет `GIST`-индекса на `User.location` и `TaskRequest.taskLocation`. ST_DWithin по 10k+ записям без индекса — деградация O(n). | 🟠 |
| Нет `@@index` на `TaskRequest.status`, `TaskRequest.categoryId`, `TaskResponse.taskId`. | 🟡 |
| `TaskResponse.masterId` и `TaskResponse.taskId` не уникальны вместе — один мастер может откликнуться несколько раз. | 🟡 |

---

### 1.4 Безопасность

| Пункт | Статус |
| :--- | :--- |
| CSP header | ❌ отсутствует в `next.config.ts` |
| Rate limiting на Server Actions (login, task creation) | ❌ |
| Проверка `auth_date` TTL initData | ❌ |
| Zod-валидация входа `loginWithTelegram` | ✅ но поверхностная (просто `z.string()`) |
| Секреты в `.env` | 🟠 плейсхолдер JWT_SECRET |
| Санитизация `images[]` в TaskRequest | ❌ (ещё не реализовано) |
| Валидация `telegramId` как BigInt | ✅ |

---

### 1.5 Тестирование, CI/CD, DX

- ❌ Нет юнит-тестов (Vitest/Jest).
- ❌ Нет e2e (Playwright).
- ❌ Нет GitHub Actions / CI.
- ❌ Нет `husky` + `lint-staged`.
- 🟡 ESLint настроен, но нет Prettier-конфига.
- 🟡 `tsconfig.tsbuildinfo` закоммичен — должен быть в `.gitignore`.

---

## Часть 2. Пошаговый план развития

### Глобальные правила проекта (закреплены)

1. **FSD строго**: импорты только «снизу вверх» (shared → entities → features → widgets → app). Cross-imports внутри одного слоя — только через публичный `index.ts`.
2. **Zero Trust**: любые `params`, `searchParams`, `body`, `formData` проходят через Zod на сервере.
3. **JWT только в httpOnly cookies**, `SameSite=Lax`, `Secure` в проде.
4. **Server Actions** — дефолт для мутаций. API-routes только для вебхуков (Telegram bot, S3 callbacks).
5. **Prisma**: всегда `select`, никогда full-model возвратов на клиент.
6. **PostGIS**: все гео-операции через `$queryRaw` с параметризацией.
7. **TypeScript Strict**, никаких `any` без `// eslint-disable` и комментария-обоснования.
8. **Цвета и отступы** — только через CSS-переменные Tailwind 4 (`--color-*`, `container-standard`).
9. **Motion-анимации** — только через пресеты `src/shared/lib/motion.ts`.
10. **Коммиты**: Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`).

---

### ЭТАП 0 — Hotfix авторизации ✅ ЗАВЕРШЕНО

**Цель:** разблокировать вход пользователя.

- [x] **0.1** `router.refresh()` перед `router.push("/dashboard")`.
- [x] **0.2** Реальный `JWT_SECRET` в `.env`.
- [x] **0.3** Проверка `auth_date` TTL (< 24h) в `validateTelegramWebAppData`.
- [x] **0.4** Логирование в `loginWithTelegram` с префиксом `[loginWithTelegram]`.
- [x] **0.6** Удалён мёртвый `providers.tsx`.
- [x] **0.7** Убран несуществующий `/api/auth/telegram` из `proxy.ts`.
- [x] **0.8** Протестировано в Telegram Desktop — логин работает.
- [x] **бонус** `findUnique + create` заменён на атомарный `upsert` (фикс race condition).
- [x] **бонус** Polling `window.Telegram.WebApp` (до 2с) на случай race c загрузкой скрипта.

---

### ЭТАП 1 — Стабилизация фундамента ✅ ОСНОВНОЕ ЗАВЕРШЕНО

- [ ] **1.1** Привести документацию к единой версии Prisma. **Решение: остаёмся на Prisma 5.10 до GA 7.**
- [ ] **1.2** Добавить `@@index` на `TaskRequest(status, categoryId, createdAt)`, `TaskResponse(taskId)`.
- [ ] **1.3** GIST-индексы для Point-полей — отложено (адрес пока текстовый).
- [x] **1.5** FSD-barrels: `index.ts` во всех `features/*`, `widgets/TaskFeed`, `entities/task`.
- [x] **1.6** CSP-заголовки в `next.config.ts` (self + telegram.org, frame-ancestors для TWA).
- [x] **1.7** Rate-limit: in-memory `shared/lib/rate-limit.ts`, подключен к login (10/мин), createOrder (5/мин), respond (15/мин), upload (10/мин).
- [x] **1.8** `payload as any` исправлен ранее.
- [ ] **1.10** Prettier + `husky` + `lint-staged` — в очереди.

---

### ЭТАП 2 — Завершение MVP-механики заказов 🟢 В ПРОЦЕССЕ

- [x] **2.3-lite** **Task Creation**: создание заявки с адресом (DaData через server proxy), загрузка фото (sharp resize 1920px → WebP q85, `<cwd>/uploads/`, API route `/api/uploads/[filename]`).
- [x] **2.4** **Task Detail Page**: `/dashboard/task/[id]/page.tsx` — просмотр заявки, список откликов, проверка прав (owner vs master vs anonymous).
- [x] **2.5** **Task Response Flow**: `features/task-response` — `respondToTaskAction` (мастер откликается), `acceptResponseAction` (заказчик выбирает → task.status = IN_PROGRESS). Защиты: нельзя отклик на свою, нельзя дважды, только OPEN.
- [x] **2.9** **Master Registration**: `features/master-registration` — `/dashboard/become-master`, форма bio + категории, `User.role → MASTER` в транзакции.
- [x] **2.10** **DaData proxy**: `/api/suggest/address` — server-side, авторизованные only, дебаунс+AbortController на клиенте.
- [x] **2.1** **Task Feed**: cursor-based пагинация (SSR первой страницы + клиентский loadMore), поиск по title/description через Prisma contains insensitive, SearchInput с дебаунсом 350мс.
- [ ] **2.2** **Geo Search**: отложено до возвращения структурированных адресов (сейчас адрес = текстовое поле).
- [x] **2.3** **Photo Upload**: `sharp` (resize 1920px → WebP q85), `<cwd>/uploads/` (Docker volume), API route `/api/uploads/[filename]` с Cache-Control immutable, валидация filename (regex).
- [ ] **2.6** **Entity: Category** — вынести в `src/entities/category/`.
- [ ] **2.7** **User Profile Edit**: `features/profile-edit` — имя, телефон, аватар.
- [x] **2.11** **«Мои заявки» / «Мои отклики»**: `/dashboard/my-tasks`, `/dashboard/my-responses`.
- [x] **2.12** **Завершение заявки** + отзыв: `completeTaskAction`, `cancelTaskAction`, `createReviewAction` с пересчётом рейтинга мастера. `TaskRequest.assignedMasterId` + `Review.taskId` (unique).

---

### ЭТАП 3 — Telegram UX & Real-time (1-2 недели) 🚀

- [ ] **3.1** Подключить `tg.themeParams` → CSS-переменные Tailwind. 🛠
- [ ] **3.2** Интегрировать `tg.MainButton` в формы создания задачи и отклика. 🛠
- [x] **3.3** Интегрировать `tg.BackButton` для навигации (синхронно с TWA). ✅ (08.04)
- [x] **3.4** Haptic Feedback (submit, success, selection) через `useHaptics`. ✅ (08.04)
- [ ] **3.5** **Telegram Bot (notifications)**: подпроект `src/shared/api/tg-bot/` — `sendNotification(telegramId, text)` + webhook-роут `POST /api/tg/webhook`.
- [ ] **3.6** Рассылка новых задач мастерам в радиусе (очередь через `BullMQ` или `pg-boss`).
- [ ] **3.7** Очередь уведомлений: при новой задаче — PostGIS-запрос «мастера в радиусе» → пакетная отправка.
- [ ] **3.8** Deep-link в Telegram Bot: `t.me/<bot>?startapp=task_<id>` — открывает конкретную задачу в TWA.

---

### ЭТАП 4 — Админ-портал, SEO, CI/CD (1-2 недели) 🏗

- [ ] **4.1** `src/app/admin/` с гардом роли `ADMIN` в `proxy.ts`.
- [ ] **4.2** Верификация мастеров (аппрув документов, смена `isVerified`, `isLocal`).
- [ ] **4.3** Модерация заданий и отзывов.
- [ ] **4.4** Дашборд метрик (кол-во задач/мастеров по районам, retention).
- [ ] **4.5** SEO: метатеги, Open Graph, `robots.txt`, `sitemap.ts`, иконки для TWA.
- [ ] **4.6** CI/CD на GitHub Actions: lint → typecheck → test → build → deploy.
- [ ] **4.7** Docker production image оптимизация (multi-stage, non-root user).
- [ ] **4.8** Настройка мониторинга: Sentry + health-checks.

---

### ЭТАП 5 — Тесты и качество (постоянно) 🧪

- [ ] **5.1** Vitest: юнит-тесты на `validateTelegramWebAppData`, Zod-схемы, геокалькуляции.
- [ ] **5.2** Playwright: e2e-флоу `mockLogin → create task → see in feed`.
- [ ] **5.3** Bundle analyzer и Lighthouse CI в пайплайне.
- [ ] **5.4** Coverage ≥ 60% на `shared/lib`, `features/*/model`.

---

### ЭТАП 6 — Монетизация и масштабирование (после MVP) 💰

- [ ] **6.1** Подписка для мастеров (Telegram Stars или отдельный payment-провайдер).
- [ ] **6.2** Верификация за разовый платёж.
- [ ] **6.3** Платный буст карточки в топ категории.
- [ ] **6.4** Реферальная система (район → район).
- [ ] **6.5** Оптимизация PostGIS на 10k+ задач/день (материализованные представления, партиции).

---

## Часть 3. Необходимые Skills и MCP

Для этого проекта стоит подключить следующие инструменты Claude Code:

### MCP-серверы (рекомендовано добавить)

| MCP | Зачем в этом проекте |
| :--- | :--- |
| **postgres** (official) | Выполнение запросов к локальной БД из чата, проверка миграций, индексов, данных сидинга. |
| **filesystem** | Уже доступен через встроенные инструменты. |
| **github** | Создание PR/issues по roadmap этапам. |
| **playwright** | E2E-автотестирование Telegram WebApp (когда дойдёт до этапа 5). |

### Skills (custom, создать в `.claude/skills/`)

| Skill | Назначение |
| :--- | :--- |
| `fsd-lint` | Проверка нарушений импортов FSD (features → widgets запрещено и т.п.). |
| `prisma-migrate` | Авто-флоу: edit schema → format → migrate dev → seed. |
| `tg-webapp-test` | Запуск dev-сервера + ngrok + обновление URL в BotFather. |
| `audit-security` | Быстрый security-check (секреты, CSP, rate-limit, CSRF). |

Уже доступные skills, которые полезны: `simplify`, `update-config`, `schedule` (для cron-задач уведомлений).

---

## Часть 4. Метрики готовности к релизу MVP

Критерии выхода в первый тестовый микрорайон:

- [ ] Авторизация через Telegram работает стабильно (Этап 0 + 1).
- [ ] Заказчик может создать задание с фото (Этап 2.3).
- [ ] Мастер видит ленту в своём радиусе (Этап 2.1-2.2).
- [ ] Мастер откликается, заказчик видит отклик (Этап 2.5).
- [ ] Уведомление в Telegram при новом заказе (Этап 3.5-3.7).
- [ ] 10 сидированных категорий, ≥3 тестовых мастера.
- [ ] CSP + rate-limit + реальный JWT_SECRET.
- [ ] Health check + Sentry в проде.

---

> Документ живой. Каждый `[x]` фиксируем в PR с ссылкой на этот файл. После выполнения Этапа 0 — обновить [05_Known_Issues.md](05_Known_Issues.md) в разделе «История исправлений».
