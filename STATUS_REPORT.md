# 📊 Отчёт о состоянии проекта «УслугиРядом»

> **Дата:** 2026-04-20
> **Ветка:** `refactor/uslugi-ryadom`
> **Последний коммит:** `c7cd20b feat(api): завершение REST API слоя (Фаза 4.2)`

---

## 1. Что за проект

**Пивот** со старого «Районного Мастера» (Telegram-бот для поиска мастеров по ремонту) на новую доску услуг уровня **YouDo**:

- **Концепт:** похоже на youdo.com, но со своими особенностями.
- **Целевая аудитория:** любые услуги в городе (не только ремонт).
- **Платформы:** Desktop-first web + React Native (Expo) — mobile.
- **Два потока:**
  1. **Заказ** — пользователь создаёт задачу, исполнители откликаются.
  2. **Объявление** — исполнитель публикует услугу, клиенты находят.
- **Мульти-город** — поддержка нескольких городов с самого начала.
- **Авторизация:** email+пароль, Telegram Login, (Google OAuth отменён).

### Ключевая терминология (старое → новое)

| Было | Стало |
|---|---|
| Master / Мастер | Provider / Исполнитель |
| MasterProfile | ProviderProfile |
| TaskRequest | Order (Заказ) |
| TaskResponse | Proposal (Предложение) |
| — (новое) | ServiceListing (Объявление об услуге) |

---

## 2. Что уже сделано

### ✅ Фаза 1 — Фундамент и ребрендинг

- **Монорепо** на Turborepo:
  - `apps/web` — Next.js 16 приложение (текущая основная работа).
  - `apps/mobile` — пустая заготовка под React Native (Expo).
  - `packages/shared-types` — общие TypeScript типы.
  - `packages/validation` — Zod-схемы (используются и web, и mobile).
  - `packages/api-client` — типизированный клиент для mobile.
- **Ребрендинг в Prisma-схеме и коде** выполнен полностью.
- **Тексты UI** на русском: «Мастер → Исполнитель», «Отклик → Предложение», «Заявка → Заказ», «Районный Мастер → УслугиРядом».
- **Метаданные:** `metadata.title`, `og:*`, `docker-compose.yml`, `.env.example` — всё под новый бренд.

### ✅ Фаза 2 — Авторизация

- **Auth.js v5 (`next-auth@beta`)** с `PrismaAdapter`. Сессии — JWT (совместимо с Edge).
- Таблицы `Account`, `Session`, `VerificationToken` по стандарту Auth.js.
- **Email + пароль:**
  - Регистрация с отправкой письма верификации.
  - Логин с проверкой `emailVerified` и `isBanned`.
  - Сброс пароля через токен.
  - Rate-limit на попытки логина.
- **Telegram:**
  - Login Widget для десктопа.
  - Mini App (Web App) внутри Telegram.
  - Исправлена валидация подписи, баг с `Unique constraint` при объединении аккаунтов, проблема с `BOT_ID` во время build.
- **Безопасность:**
  - JWT **только** в `httpOnly`, `Secure`, `SameSite=Lax` cookies.
  - Все мутации обёрнуты в `next-safe-action` (`authActionClient` / `adminActionClient`).
  - Strict `select` в Prisma — `passwordHash` никогда не уходит на клиент.
- **Email-сервис** сейчас mock: письма пишутся в `apps/web/email-debug.log`.

### ✅ Фаза 3 — Модель данных

- **Мульти-город:** модели `City`, `CityCategory`, привязка `User.cityId`, `Order.cityId`, `ServiceListing.cityId`.
- **PostGIS:** координатные поля `location` для City/User/Order/ServiceListing.
- **Дерево категорий:** поля `parentId`, `slug`, `sortOrder`, `isActive`, `description`.
- **ServiceListing:**
  - Статусы `ACTIVE / PAUSED / ARCHIVED / MODERATION / REJECTED`.
  - Гибкое ценообразование: `priceFrom`, `priceTo`, `priceUnit` (`PER_HOUR / PER_SERVICE / PER_METER / NEGOTIABLE`).
  - Счётчик `views`.
- **AuditLog** — логирование критических действий (модерация, баны, смены ролей).
- **Сиды:** города (Москва, Санкт-Петербург, и т.д.) и универсальный набор категорий (ремонт, уборка, красота, репетиторы, авто, перевозки, IT, фото, юристы и др.).

### ✅ Фаза 4 — REST API слой (закрыта сегодня!)

#### 4.1 Сервисный слой (`apps/web/src/services/`)
11 сервисов с инкапсулированной бизнес-логикой:
- `auth.service.ts` — регистрация, верификация, сброс пароля, валидация credentials.
- `user.service.ts` — чтение/обновление профиля, бан.
- `order.service.ts` — CRUD заказов, `acceptProposal`, `complete`, `cancel`, `refuse`.
- `proposal.service.ts` — `create`, `listByOrder`, `listByProvider`, `withdraw`.
- `listing.service.ts` — CRUD объявлений, `search`, `getByUser`.
- `provider.service.ts` — `saveProfile`, `getById`, `getByUserId`, `list`.
- `review.service.ts` — `create` (с пересчётом рейтинга в транзакции), `getByProvider`.
- `notification.service.ts` — `list`, `markAsRead`, `markAllAsRead`, триггеры Telegram.
- `category.service.ts` — `listRoot`, `getTree`, `getById`.
- `city.service.ts` — `list`, `search`, `getById`.
- `upload.service.ts` — обёртка над file-storage.

#### 4.2 REST-эндпоинты (`apps/web/src/app/api/v1/`)
**26 роутов**, полностью покрывают план 4.2.1:

| Группа | Путь | Методы | Назначение |
|---|---|---|---|
| **auth** | `/auth/register` | POST | Регистрация по email (отправляет письмо верификации) |
| | `/auth/login` | POST | Логин email/пароль → JWT-токен (Bearer) |
| | `/auth/login/telegram` | POST | Логин через Telegram (WebApp или Widget) → JWT |
| | `/auth/refresh` | POST | Продление сессии (новый JWT) |
| | `/auth/logout` | POST | Очистка cookie-сессии |
| | `/auth/me` | GET | Текущий пользователь |
| **orders** | `/orders` | GET | Лента заказов (фильтры: категория, поиск) |
| | `/orders` | POST | Создать заказ |
| | `/orders/[id]` | GET | Детали заказа |
| | `/orders/[id]` | PATCH | Обновить заказ (только автор, статус OPEN) |
| | `/orders/[id]` | DELETE | Отменить заказ |
| | `/orders/[id]/complete` | POST | Завершить заказ (только автор) |
| | `/orders/[id]/proposals` | GET | Предложения к заказу (только автор) |
| | `/orders/[id]/proposals` | POST | Отправить предложение |
| | `/orders/my` | GET | Мои заказы (я — клиент) |
| **listings** | `/listings` | GET | Каталог объявлений |
| | `/listings` | POST | Создать объявление (исполнитель) |
| | `/listings/[id]` | GET | Детали объявления |
| | `/listings/[id]` | PATCH | Обновить (только владелец) |
| | `/listings/[id]` | DELETE | Soft-delete → ARCHIVED |
| | `/listings/my` | GET | Мои объявления |
| **proposals** | `/proposals/[id]/accept` | POST | Клиент принимает предложение |
| | `/proposals/[id]/reject` | POST | Исполнитель отзывает своё |
| | `/proposals/my` | GET | Мои предложения (я — исполнитель) |
| **providers** | `/providers` | GET | Список исполнителей (фильтры: город/категория) |
| | `/providers/[id]` | GET | Профиль исполнителя |
| | `/providers/register` | POST | Стать исполнителем / обновить профиль |
| **reviews** | `/reviews` | POST | Отзыв по завершённому заказу |
| **categories** | `/categories` | GET | Список категорий (`?tree=1` для дерева) |
| **cities** | `/cities` | GET | Список городов (`?search=...`) |
| **notifications** | `/notifications` | GET | Мои уведомления |
| | `/notifications/[id]/read` | POST | Отметить прочитанным |
| **upload** | `/upload` | POST | Загрузить файлы (multipart) |

#### 4.3 Инфраструктура API
- `apps/web/src/shared/lib/api-helpers.ts` — `apiSuccess / apiError / apiUnauthorized / apiForbidden / withAuth / withValidation`.
- `getSessionFromRequest()` — читает сессию и из cookie, и из `Authorization: Bearer <JWT>`.
- `proxy.ts` настроен: для `/api/v1/*` проверяется Bearer, для не-auth роутов возвращает 401.
- Все мутации валидируются через Zod-схемы из `@uslugi/validation`.

---

## 3. Чего ещё НЕТ (пробелы на сегодня)

| Фаза | Что нужно сделать |
|---|---|
| **5. Desktop Web UI** | Маршрутизация всё ещё `/dashboard/*` (наследие Telegram Mini App). Нет групп `(main)` / `(auth)`, нет Header/Sidebar/Footer/BottomNav, нет переключателя светлой/тёмной темы, нет шрифта Inter, нет новой главной-лендинга. |
| **6. Объявления (UI)** | API готов, но фичи `listing/` и страниц каталога объявлений нет. Админ-модерация объявлений — отсутствует. |
| **7. Чат** | Моделей `Conversation`, `ConversationParticipant`, `Message` в Prisma нет. |
| **8. Тесты и CI/CD** | Vitest и Playwright не установлены. GitHub Actions — под вопросом. |
| **9. React Native** | `apps/mobile/src` пустой, Expo не инициализирован. |
| **10. Geo-поиск** | PostGIS настроен, но запросов «рядом со мной» нет. |
| **11. Полировка** | SEO, `sitemap.xml`, Sentry, PWA-manifest — не сделано. |
| **Email** | Сейчас mock (пишет в файл). Прод SMTP нужно подключать в Фазе 8/11. |

---

## 4. 🧪 План ручного тестирования

### 4.1 Запуск локально

```bash
cd C:\Users\drobi\Desktop\projects\antigraviti\masters-app
npm run dev:full
```

Откроется на `http://localhost:3000`.
Скрипт `dev:full` сам:
- чистит порты 3000 и 4040;
- поднимает Postgres (Docker);
- ждёт готовности БД;
- активирует PostGIS;
- запускает Next.js dev-сервер.

**Важно:** БД называется `uslugi_db`. Миграции применяются автоматически.

---

### 4.2 🟢 Что ДОЛЖНО работать (web-интерфейс, через браузер)

#### Тест 1 — Регистрация через Email
**Шаги:**
1. Открыть `/register`.
2. Ввести имя, email, пароль (≥8 символов), подтверждение пароля.
3. Нажать «Зарегистрироваться».

**Ожидаемо:**
- Редирект на страницу «Проверьте вашу почту».
- В файле `apps/web/email-debug.log` появляется письмо со ссылкой верификации.
- Переход по ссылке → автологин → редирект на `/dashboard`.

**Возможные проблемы:**
- ❌ Дубликат email → ошибка «Пользователь с таким email уже существует».
- ❌ Пароль <8 символов → валидационная ошибка.

---

#### Тест 2 — Логин по Email + пароль
**Шаги:**
1. Открыть `/login`.
2. Ввести email и пароль.
3. Нажать «Войти».

**Ожидаемо:**
- Редирект на `/dashboard`.
- Cookie `session` установлен (httpOnly).

**Возможные проблемы:**
- ❌ Неверный пароль → «Неверный email или пароль».
- ❌ Email не подтверждён → «Email не подтвержден. Пожалуйста, проверьте вашу почту».
- ❌ Аккаунт забанен → ошибка.

---

#### Тест 3 — Восстановление пароля
**Шаги:**
1. На `/login` нажать «Забыли пароль?».
2. Ввести email.
3. В `email-debug.log` найти ссылку сброса.
4. Перейти, ввести новый пароль.

**Ожидаемо:**
- Всегда показывается сообщение «Проверьте почту» (не раскрывает, существует ли аккаунт).
- После ввода нового пароля — редирект на `/login`, можно войти с новым.

---

#### Тест 4 — Вход через Telegram (десктоп, Login Widget)
**Шаги:**
1. На `/login` нажать «Войти через Telegram».
2. Подтвердить в Telegram (скан QR или кнопка).

**Ожидаемо:**
- Редирект на `/dashboard`.
- Если email-аккаунт уже есть с таким же Telegram ID → объединение аккаунтов.

**Возможные проблемы:**
- ❌ Если бот не настроен в BotFather (`/setdomain`) — виджет не появится или вернёт ошибку. Проверь `TELEGRAM_BOT_TOKEN` и `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` в `.env`.

---

#### Тест 5 — Создание заказа
**Шаги:**
1. Залогиниться.
2. Перейти в `/dashboard/create-order` (или по ссылке из UI).
3. Заполнить: категория, город, название, описание, бюджет (опц.), адрес.
4. Отправить.

**Ожидаемо:**
- Заказ появляется в `/dashboard/feed` (лента заказов).
- Исполнители в этой категории получают уведомление в Telegram (если у них есть `telegramId`).

**Возможные проблемы:**
- ❌ Описание <10 символов → валидационная ошибка.
- ❌ Не выбрана категория/город → ошибка.

---

#### Тест 6 — Стать исполнителем
**Шаги:**
1. Перейти в `/dashboard/become-provider`.
2. Заполнить: bio (≥20 символов), категории (1–8), стаж, минимальная цена, портфолио (фото).
3. Сохранить.

**Ожидаемо:**
- Профиль создан, роль `USER → PROVIDER`.
- Теперь доступны: `/dashboard/my-proposals`, возможность откликаться на заказы.

---

#### Тест 7 — Отклик на заказ (как исполнитель)
**Шаги:**
1. Будучи исполнителем, в `/dashboard/feed` открыть чужой заказ.
2. Нажать «Откликнуться».
3. Ввести цену и сообщение (≥10 символов).

**Ожидаемо:**
- Предложение создано, заказчик получает уведомление.
- В `/dashboard/my-proposals` видно моё предложение.

**Возможные проблемы:**
- ❌ Попытка откликнуться на свой заказ → «Нельзя откликаться на свою заявку».
- ❌ Дубликат отклика → «Вы уже откликнулись на эту заявку».
- ❌ Заказ не в статусе OPEN → «Заявка уже не принимает отклики».

---

#### Тест 8 — Принятие предложения (как клиент)
**Шаги:**
1. Открыть свой заказ в `/dashboard/my-orders`.
2. Увидеть список откликов.
3. Нажать «Выбрать» на одном из них.

**Ожидаемо:**
- Статус заказа → `IN_PROGRESS`.
- Выбранный исполнитель получает уведомление «Вас выбрали!».
- Остальные — уведомление «Заказчик выбрал другого».

---

#### Тест 9 — Завершение заказа и отзыв
**Шаги:**
1. После `IN_PROGRESS` нажать «Завершить».
2. После `COMPLETED` — оставить отзыв (рейтинг 1–5, текст).

**Ожидаемо:**
- Статус → `COMPLETED`.
- Исполнитель получает уведомление о завершении.
- После отзыва — исполнитель получает «Новый отзыв».
- Рейтинг исполнителя пересчитывается автоматически.

---

### 4.3 🟢 Что ДОЛЖНО работать (REST API — для mobile и интеграций)

Все эндпоинты требуют `Authorization: Bearer <JWT>` в заголовке, кроме публичных (`/categories`, `/cities`, список заказов/объявлений/исполнителей).

#### Как получить JWT

```bash
# Email-логин
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123"}'

# Ответ:
# { "token": "eyJhbGci...", "expires": "...", "user": {...} }
```

#### Как использовать токен

```bash
TOKEN="eyJhbGci..."

# Текущий пользователь
curl http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer $TOKEN"

# Создать заказ
curl -X POST http://localhost:3000/api/v1/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "categoryId": "...",
    "cityId": "...",
    "title": "Починить кран",
    "description": "Капает вода из-под смесителя"
  }'

# Мои заказы
curl http://localhost:3000/api/v1/orders/my \
  -H "Authorization: Bearer $TOKEN"

# Список исполнителей
curl http://localhost:3000/api/v1/providers?cityId=XXX&categoryId=YYY

# Каталог
curl http://localhost:3000/api/v1/categories?tree=1
```

#### Чеклист эндпоинтов (прогнать по каждому)

- [ ] `POST /api/v1/auth/register` — регистрация (письмо приходит в лог).
- [ ] `POST /api/v1/auth/login` — получение Bearer-токена.
- [ ] `POST /api/v1/auth/login/telegram` (type: widget) — вход по данным Telegram Widget.
- [ ] `POST /api/v1/auth/refresh` — продление токена.
- [ ] `POST /api/v1/auth/logout` — очистка cookie.
- [ ] `GET /api/v1/auth/me` — текущий user.
- [ ] `GET /api/v1/categories` / `?tree=1` — категории.
- [ ] `GET /api/v1/cities` / `?search=москв` — города.
- [ ] `GET /api/v1/orders` / `?categoryId=...` — лента.
- [ ] `POST /api/v1/orders` — создание.
- [ ] `GET /api/v1/orders/[id]` — детали.
- [ ] `PATCH /api/v1/orders/[id]` — обновление (только автор + статус OPEN).
- [ ] `DELETE /api/v1/orders/[id]` — отмена.
- [ ] `POST /api/v1/orders/[id]/complete` — завершение.
- [ ] `GET /api/v1/orders/[id]/proposals` — отклики (только клиент).
- [ ] `POST /api/v1/orders/[id]/proposals` — отправить отклик.
- [ ] `GET /api/v1/orders/my` — мои заказы.
- [ ] `POST /api/v1/proposals/[id]/accept` — принять отклик.
- [ ] `POST /api/v1/proposals/[id]/reject` — отозвать свой отклик.
- [ ] `GET /api/v1/proposals/my` — мои отклики.
- [ ] `GET /api/v1/providers` — список исполнителей.
- [ ] `GET /api/v1/providers/[id]` — профиль исполнителя.
- [ ] `POST /api/v1/providers/register` — стать исполнителем.
- [ ] `GET /api/v1/listings` — каталог объявлений.
- [ ] `POST /api/v1/listings` — создать объявление.
- [ ] `GET /api/v1/listings/[id]` — детали.
- [ ] `PATCH /api/v1/listings/[id]` — обновить.
- [ ] `DELETE /api/v1/listings/[id]` — soft-delete.
- [ ] `GET /api/v1/listings/my` — мои объявления.
- [ ] `POST /api/v1/reviews` — оставить отзыв.
- [ ] `GET /api/v1/notifications` — мои уведомления.
- [ ] `POST /api/v1/notifications/[id]/read` — прочитать.
- [ ] `POST /api/v1/upload` (multipart) — загрузить файл.

---

### 4.4 🔴 Что НЕ РАБОТАЕТ (и это ОЖИДАЕМО)

#### UI / Дизайн
- ❌ **Десктопный дизайн** не переделан. Интерфейс всё ещё заточен под Telegram Mini App (узкий, тёмный, мобильный).
- ❌ **Нет Header / Sidebar / Footer / BottomNav** в новом виде.
- ❌ **Нет переключателя светлой/тёмной темы.**
- ❌ **Нет шрифта Inter** — используется старый Roboto Condensed.
- ❌ **Главная страница `/`** не переделана в лендинг («Найдите услуги рядом»).
- ❌ **Маршрутизация** всё ещё `/dashboard/*`, нет групп `(main)` / `(auth)`.

#### Объявления (ServiceListing)
- ✅ API работает (через `curl` или Postman).
- ❌ **Нет UI** для создания / просмотра / редактирования объявлений.
- ❌ **Нет страницы каталога** `/listings`.
- ❌ **Нет модерации** в админке.

#### Чат
- ❌ **Полностью отсутствует.** Ни моделей в БД, ни UI. Фаза 7.

#### Email
- ⚠️ **Mock-режим.** Письма НЕ уходят на реальный адрес — пишутся в `apps/web/email-debug.log`. Чтобы протестировать верификацию, надо смотреть файл.

#### React Native (mobile)
- ❌ **Приложения нет.** `apps/mobile/src` пустой. Expo не инициализирован. Фаза 9.

#### Geo-поиск
- ❌ **PostGIS настроен, но запросов «рядом со мной» нет.** Фаза 10.

#### Тесты / CI
- ❌ **Автоматических тестов нет** (Vitest/Playwright не установлены).
- ⚠️ **GitHub Actions** — конфиги есть, но статус не проверен.

#### SEO / PWA
- ❌ **Нет `sitemap.xml`**, robots.txt минимальный.
- ❌ **Нет PWA-manifest** для установки как приложение.
- ❌ **Sentry не подключён** — ошибки в проде никуда не отправляются.

---

## 5. Следующие шаги (по приоритету)

### Критичный следующий шаг
**Фаза 5 — Desktop Web UI.** Переделать маршрутизацию, сделать Header/Sidebar/Footer/BottomNav, переключатель темы, шрифт Inter, новую главную-лендинг.

### После Фазы 5
- **Фаза 6** — UI для объявлений (каталог, создание, редактирование, модерация).
- **Фаза 7** — Чат (Conversation/Message + UI + уведомления).
- **Фаза 8** — Тесты (Vitest unit + Playwright e2e) и CI/CD.

---

## 6. Быстрые команды

```bash
# Локальный запуск
npm run dev:full

# Прогнать TypeScript
cd apps/web && npx tsc --noEmit

# Посмотреть БД
cd apps/web && npx prisma studio

# Миграции
cd apps/web && npx prisma migrate dev

# Сиды
cd apps/web && npx prisma db seed

# Сборка прод
cd apps/web && npm run build

# Docker
docker-compose up --build
```

---

## 7. Важные файлы

| Файл | Назначение |
|---|---|
| `DEVELOPMENT_PLAN.md` | Единый источник правды по всем фазам |
| `apps/web/prisma/schema.prisma` | Модель данных |
| `apps/web/src/proxy.ts` | Защита роутов + Bearer для API |
| `apps/web/src/shared/lib/auth.ts` | JWT + Telegram валидация + `getSessionFromRequest` |
| `apps/web/src/services/` | Вся бизнес-логика (11 сервисов) |
| `apps/web/src/app/api/v1/` | REST API (26 роутов) |
| `apps/web/src/features/` | Server Actions + UI фич (FSD) |
| `packages/validation/src/` | Zod-схемы |
| `apps/web/email-debug.log` | Mock-письма (dev) |

---

**Готово к Фазе 5.** После визуальной переделки проект начнёт выглядеть как настоящий YouDo-конкурент, а не как Telegram Mini App.
