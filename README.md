# УслугиРядом

Доска объявлений услуг для города. Desktop-first веб + React Native (в разработке).

> **Ветка активной разработки:** `refactor/uslugi-ryadom`
> **Полный план:** [`DEVELOPMENT_PLAN.md`](./DEVELOPMENT_PLAN.md) — единый источник правды (статус, фазы, архитектурные решения).

---

## Стек

- **Web:** Next.js 16 (App Router, RSC, Server Actions), TypeScript, Tailwind 4, Shadcn UI
- **Mobile:** React Native (Expo) — apps/mobile, заготовка
- **БД:** PostgreSQL 16 + PostGIS, Prisma 7
- **Auth:** Auth.js v5 (`next-auth@beta`) + `@auth/prisma-adapter` — email/пароль, Telegram, Google OAuth
- **Security:** `next-safe-action`, Zod (валидация), JWT httpOnly cookies
- **Инфра:** Docker multi-stage (Alpine), Nginx
- **Монорепо:** Turborepo

## Структура

```
.
├── apps/
│   ├── web/        # Next.js приложение (основное)
│   └── mobile/     # React Native (Expo) — в разработке
├── packages/
│   ├── shared-types/   # Общие TS-типы
│   ├── validation/     # Zod-схемы
│   └── api-client/     # Типизированный API-клиент для mobile
├── DEVELOPMENT_PLAN.md # План разработки
└── docker-compose.yml
```

## Быстрый старт (dev)

Требования: Node.js 22+, Docker, npm.

```bash
# 1. Установить зависимости (корень монорепо)
npm install

# 2. Поднять БД (Postgres + PostGIS)
docker-compose up -d postgres

# 3. Настроить env (в apps/web/)
cp apps/web/.env.example apps/web/.env
# Заполнить: DATABASE_URL, NEXTAUTH_SECRET, TELEGRAM_BOT_TOKEN, GOOGLE_CLIENT_ID/SECRET, SMTP_*

# 4. Применить миграции и сид
npx prisma migrate deploy --schema apps/web/prisma/schema.prisma
node apps/web/prisma/seed.mjs

# 5. Запустить dev-сервер
npm run dev
# или только web: turbo run dev --filter=@uslugi/web
```

Открыть [http://localhost:3000](http://localhost:3000).

## Полный Docker-стек

```bash
docker-compose up --build
```

Поднимает Postgres/PostGIS + web (production build). Nginx/reverse-proxy — в рабочих конфигах прода.

## Команды

```bash
turbo run build        # Сборка всех пакетов и приложений
turbo run lint         # Линт
turbo run typecheck    # Проверка типов
npm run dev            # Dev-сервер web
```

## Архитектура

Feature-Sliced Design (FSD) в `apps/web/src/`:

```
app/        # Next.js App Router (тонкие обёртки)
widgets/    # Композиционные UI-блоки
features/   # Изолированные бизнес-модули (auth, order-creation, ...)
entities/   # Доменные сущности
shared/     # Переиспользуемые примитивы (ui, lib, api)
proxy.ts    # Защита роутов (вместо middleware.ts)
```

Правила импортов: `app` → `widgets` → `features` → `entities` → `shared` (строго сверху вниз).

Все мутации — через Server Actions, обёрнутые в `next-safe-action`. REST API (`app/api/v1/*`) — запланирован для мобильного клиента.

## Статус проекта

См. раздел **«Текущий статус»** в [`DEVELOPMENT_PLAN.md`](./DEVELOPMENT_PLAN.md) — там актуальная таблица что сделано / что осталось по фазам.
