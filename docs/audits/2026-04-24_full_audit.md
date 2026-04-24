# 🔍 Полный Аудит Проекта «УслугиРядом»

**Дата:** 24 апреля 2026  
**Версия:** Next.js 16.1.7, React 19.2.3, Prisma 5.22.0  
**Scope:** Безопасность · Баги · Оптимизация · Мёртвый код · SEO · Архитектура · Docker · Типизация

---

## Сводка

| Приоритет | Кол-во |
|-----------|--------|
| 🔴 CRITICAL | 7 |
| 🟠 HIGH | 12 |
| 🟡 MEDIUM | 16 |
| 🔵 LOW | 10 |

---

## 🔴 CRITICAL — Немедленное исправление

### C1. Email НЕ отправляется — `sendEmail()` это заглушка
**Файл:** [email.ts](file:///c:/Users/drobi/Desktop/projects/antigraviti/uslugi_ryadom/apps/web/src/shared/lib/email.ts#L29-L49)

Функция `sendEmail` пишет в лог-файл и возвращает `{ success: true }`, но **не отправляет реальные письма**. Регистрация через email, сброс пароля, верификация — всё нерабочее в проде.

```diff
-  // Просто пишет в файл
-  console.log(logContent);
-  return { success: true };
+  // Нужна интеграция с SMTP (nodemailer / Resend / Postmark)
```

### ~~C2. `validateCredentials` возвращает ПОЛНЫЙ объект User~~ ✅ ИСПРАВЛЕНО
**Файл:** [auth.service.ts:143](file:///c:/Users/drobi/Desktop/projects/antigraviti/uslugi_ryadom/apps/web/src/services/auth.service.ts#L143-L145)

Добавлен `select` с явным перечислением полей: `id, email, firstName, role, passwordHash, emailVerified`. PII-данные (telegramId, isBanned, avatar) больше не загружаются.

### ~~C3. `AUTH_SECRET` отсутствует в `.env.example` корня~~ ✅ ИСПРАВЛЕНО
**Файл:** [.env.example](file:///c:/Users/drobi/Desktop/projects/antigraviti/uslugi_ryadom/.env.example)

Корневой `.env.example` полностью синхронизирован с `apps/web/.env.example`: добавлены `AUTH_SECRET`, `CRON_SECRET`, `TELEGRAM_BOT_NAME/ID`, удалён устаревший `DEFAULT_CITY`.

### C4. Дублирование `upload-action` — два файла делают одно и то же
**Файлы:**
- [shared/lib/upload-action.ts](file:///c:/Users/drobi/Desktop/projects/antigraviti/uslugi_ryadom/apps/web/src/shared/lib/upload-action.ts)
- `features/order-creation/api/upload-action.ts`

Два Server Action для загрузки файлов. Потенциальный баг: один может обновиться, другой нет. Нужен единый источник.

### ~~C5. `seed.ts` использует `e: any`~~ ✅ ИСПРАВЛЕНО
**Файл:** [seed.ts:29](file:///c:/Users/drobi/Desktop/projects/antigraviti/uslugi_ryadom/apps/web/prisma/seed.ts#L29)

Заменено `catch (e: any)` → `catch (e: unknown)` с `instanceof Error` guard.

### ~~C6. Захардкоженный пароль админа в seed~~ ✅ ИСПРАВЛЕНО

Убран захардкоженный хеш `password123` из обоих seed-файлов (`seed.ts` и `seed.mjs`). Теперь `ADMIN_PASSWORD` обязателен — без него создание админа пропускается с предупреждением.

### C7. Два seed-файла: `seed.ts` и `seed.mjs`
**Файлы:** `prisma/seed.ts` и `prisma/seed.mjs`

`startup.js` запускает `seed.mjs`, а `package.json.prisma.seed` указывает на `seed.ts`. Рассинхрон может привести к неконсистентным данным при разных путях деплоя.

---

## 🟠 HIGH — Исправить в ближайшем спринте

### H1. Rate-limit НЕ применён на auth-маршрутах
Rate-limit есть на `upload`, `proposal`, `createOrder`, но **отсутствует** на:
- `/auth/login` (Email + Password) — **brute-force уязвимость**
- `/auth/register` — спам-регистрации
- `/auth/reset-password` — хотя есть in-memory cooldown, нет полноценного rate-limit

### H2. In-memory rate-limiter не работает при масштабировании
**Файл:** [rate-limit.ts](file:///c:/Users/drobi/Desktop/projects/antigraviti/uslugi_ryadom/apps/web/src/shared/lib/rate-limit.ts)

`Map` в памяти процесса. При нескольких инстансах (горизонтальное масштабирование) или перезапуске контейнера — полный сброс лимитов. Для прода нужен Redis.

### H3. `proxy.ts` — тяжёлая операция `auth()` на каждый запрос
**Файл:** [proxy.ts:11](file:///c:/Users/drobi/Desktop/projects/antigraviti/uslugi_ryadom/apps/web/src/proxy.ts#L11)

```typescript
const session = await auth(); // ← Вызывает DB-запрос через jwt callback
```

`auth()` в `jwt` callback делает `db.user.findUnique` на **каждый** запрос. Это противоречит правилу: «В proxy.ts выполняй только легковесные проверки». Роль пользователя должна кэшироваться в JWT токене.

### H4. `auth.ts` — `PrismaAdapter(db as any)`
**Файл:** [auth.ts:8](file:///c:/Users/drobi/Desktop/projects/antigraviti/uslugi_ryadom/apps/web/src/auth.ts#L8)

Каст `as any` маскирует потенциальную несовместимость PrismaAdapter с текущей версией Prisma Client.

### H5. Отсутствует `robots.txt` и `sitemap.xml`
Ни `robots.ts`, ни `sitemap.ts` не найдены в `src/app/`. Для индексации поисковыми системами это **критично**.

### H6. Open Graph метаданные только на одной странице
`openGraph` найден только в `orders/[citySlug]/[slug]/[orderSlug]/page.tsx`. Остальные страницы (главная, список заказов, профили) не имеют OG-тегов — ссылки в соцсетях будут без превью.

### H7. `order.service.ts` — 505 строк
**Файл:** [order.service.ts](file:///c:/Users/drobi/Desktop/projects/antigraviti/uslugi_ryadom/apps/web/src/services/order.service.ts)

Превышает лимит 200 строк. Нужен рефакторинг: разделить на `order-query.service.ts` и `order-mutation.service.ts`.

### H8. Path traversal в uploads — частичная защита
**Файл:** [route.ts](file:///c:/Users/drobi/Desktop/projects/antigraviti/uslugi_ryadom/apps/web/src/app/api/uploads/%5Bfilename%5D/route.ts#L13)

Regex `/^[a-f0-9-]+\.webp$/` защищает от traversal, но `uploadsDir` берётся из env без валидации. Если `UPLOADS_DIR` скомпрометирован, можно читать файлы.

### H9. `listing.service.ts` — `create` и `update` без авторизации
**Файл:** [listing.service.ts:104-121](file:///c:/Users/drobi/Desktop/projects/antigraviti/uslugi_ryadom/apps/web/src/services/listing.service.ts#L104-L121)

```typescript
async create(data: CreateListingInput) { // ← нет userId, нет проверки владельца
async update(id: string, data: ...) {    // ← нет проверки, что обновляет владелец
```

Любой может создать/изменить листинг, если вызовет сервис напрямую.

### H10. `logAudit` не записывает IP-адрес
**Файл:** [audit.ts](file:///c:/Users/drobi/Desktop/projects/antigraviti/uslugi_ryadom/apps/web/src/shared/lib/audit.ts)

Поле `ipAddress` в схеме есть, но `logAudit()` его не принимает и не записывает. Бесполезно для расследования инцидентов.

### H11. `Proposal` не имеет статуса
**Файл:** [schema.prisma:228-238](file:///c:/Users/drobi/Desktop/projects/antigraviti/uslugi_ryadom/apps/web/prisma/schema.prisma#L228-L238)

Нет поля `status` (PENDING/ACCEPTED/REJECTED). Невозможно отследить жизненный цикл отклика. Вся логика на стороне Order.status — хрупко.

### H12. `framer-motion` вместо `motion`
**package.json** содержит `"framer-motion": "^12.38.0"`, но по правилам 2026 года пакет переименован в `motion`. 16 файлов импортируют `from "framer-motion"`.

---

## 🟡 MEDIUM — Запланировать на следующие итерации

### M1. 20+ использований `as any` в кодовой базе
Найдено **20 мест** с `as any`:
- `access-check.ts` — `// @ts-ignore` для `session.user.role`
- `api-helpers.ts` — `request as any` (2 места)
- `auth.ts` — `PrismaAdapter(db as any)`
- `expire-orders.ts` — `"EXPIRED" as any`
- `CategoryGrid.tsx` — `(Icons as any)[cat.icon]`
- `use-haptics.ts` — `(window as any).Telegram` (6 мест)
- `use-main-button.ts` — `(window as any).Telegram` (6 мест)
- `orders/[orderSlug]/page.tsx` — `(p: any)` (4 места)
- `api/v1/auth/me/route.ts` — `user as any`

Для Telegram SDK: создать `global.d.ts` с типизацией `window.Telegram`.

### M2. `dadata.ts` — `any` в публичном API
**Файл:** [dadata.ts](file:///c:/Users/drobi/Desktop/projects/antigraviti/uslugi_ryadom/apps/web/src/shared/lib/dadata.ts)

```typescript
[key: string]: any;           // строка 16
locations?: any[]             // строка 23
```

### ~~M3. `upload.service.ts` — мёртвый код~~ ⚠️ ЛОЖНОЕ СРАБАТЫВАНИЕ

Используется в `api/v1/upload/route.ts`. Не удалять. Но `deleteFile()` — заглушка, стоит дореализовать при необходимости.

### ~~M4. Легаси-скрипты в `scripts/`~~ ✅ ИСПРАВЛЕНО

Удалены: `rename-types.js`, `rename-types-2.js`, `rename-types-3.js`, `rename-types-4.js`, `resize-image.ts`. Оставлены полезные: `auth-selftest.ts`, `db-check.ts`, `geo-sync.ts`, `dev.ps1`, `startup.js`.

### M5. `template.tsx` — framer-motion на КАЖДОМ переходе
**Файл:** [template.tsx](file:///c:/Users/drobi/Desktop/projects/antigraviti/uslugi_ryadom/apps/web/src/app/template.tsx)

`motion.div` с `willChange: "opacity"` на корневом template. Это создаёт composite layer на **каждой странице** и замедляет навигацию на слабых устройствах.

### ~~M6. `check-env.js` — пустой файл (57 байт)~~ ✅ УДАЛЁН
**Файл:** `apps/web/check-env.js` — вероятно, заглушка. Удалить или реализовать.

### ~~M7. `postgres_data/` в корне проекта~~ ✅ ПРОВЕРЕНО — в `.gitignore`

### M8. Нет `error.tsx` и `not-found.tsx` на уровне app
Отсутствуют глобальные обработчики ошибок Next.js:
- `src/app/error.tsx` — для runtime ошибок
- `src/app/not-found.tsx` — для 404

### M9. `DEFAULT_PAGE_SIZE = 7` — нестандартное значение
**Файл:** [constants.ts](file:///c:/Users/drobi/Desktop/projects/antigraviti/uslugi_ryadom/apps/web/src/shared/lib/constants.ts)

Стандарт: 10, 20, 25, 50. Значение 7 приводит к частым подгрузкам и лишним запросам.

### M10. Dual-auth система — сложность и путаница
Проект использует **одновременно**:
1. Auth.js (NextAuth v5) — для Web-сессий (JWT в cookies)
2. Кастомный JWT (`shared/lib/auth.ts`) — для API/Mobile

Два параллельных механизма сессий усложняют отладку и создают потенциальные дыры. `proxy.ts` вынужден проверять оба.

### M11. CSP: `unsafe-inline` + `unsafe-eval`
**Файл:** [next.config.mjs:34](file:///c:/Users/drobi/Desktop/projects/antigraviti/uslugi_ryadom/apps/web/next.config.mjs#L34)

```
script-src 'self' 'unsafe-inline' 'unsafe-eval' https://telegram.org
```

`unsafe-eval` полностью нейтрализует защиту CSP от XSS. Для Next.js нужен nonce-based подход.

### M12. `tailwindcss-animate` + `tw-animate-css` — дублирование
**Файл:** [package.json](file:///c:/Users/drobi/Desktop/projects/antigraviti/uslugi_ryadom/apps/web/package.json#L51-L52)

Установлены оба пакета. Они решают одну задачу. Оставить один.

### M13. `@base-ui/react` — неиспользуемая зависимость?
Пакет `@base-ui/react` в dependencies, но при поиске не найдено импортов. Потенциально мёртвая зависимость.

### M14. `Proposal` нет уникального индекса `[orderId, providerId]`
**Файл:** [schema.prisma:228-238](file:///c:/Users/drobi/Desktop/projects/antigraviti/uslugi_ryadom/apps/web/prisma/schema.prisma#L228-L238)

Защита от дублей реализована в коде (`findFirst`), но без DB-индекса гонка состояний может создать дубли.

### M15. `review.service.ts` — пагинация отзывов отсутствует
```typescript
async getByProvider(providerId: string) {
  return db.review.findMany({ ... }); // ← загружает ВСЕ отзывы
}
```

### M16. `Order.slug` — nullable, нет fallback в URL
**Файл:** [schema.prisma:192](file:///c:/Users/drobi/Desktop/projects/antigraviti/uslugi_ryadom/apps/web/prisma/schema.prisma#L192)

`slug String? @unique` — при `null` SEO-ссылки сломаются. Slug должен быть обязательным.

---

## 🔵 LOW — Улучшения качества кода

### L1. `console.log` в 9+ файлах продакшен-кода
Файлы с debug-логами, которые стоит заменить на structured logging или удалить:
- `email.ts`, `upload-action.ts`, `image-convert.ts`, `dadata.ts`
- `expire-orders.ts`, `upload.service.ts`, `geo-search/actions.ts`

### L2. `turbo: "latest"` в root package.json
Пинить версию для воспроизводимых билдов: `"turbo": "^2.x.x"`.

### L3. `@types/sharp` — deprecated
`@types/sharp` (devDependencies) не нужен — sharp включает свои типы начиная с v0.32.

### L4. `city.service.ts` + `category.service.ts` — минимальные обёртки
Оба файла < 50 строк и просто проксируют Prisma-запросы без бизнес-логики. Можно инлайнить.

### L5. `entities/` — нарушение FSD
`src/entities/order/` и `src/entities/user/` существуют, но FSD-слой `entities` не описан в правилах проекта (только `shared`, `features`, `widgets`, `app`). Нужно решить: либо формализовать, либо перенести в `features`.

### L6. `apps/mobile/` — пустая директория
Директория `apps/mobile/` существует, но содержимое неясно. Если пустая — удалить из workspaces.

### L7. `prisma/cities.config.ts` — 271 байт
Крайне маленький конфиг. Связь с `seed-data.mjs` неочевидна.

### ~~L8. `.env` файлы с реальными секретами в репозитории~~ ✅ ПРОВЕРЕНО — в `.gitignore`

`git ls-files` подтвердил: ни `.env`, ни `apps/web/.env`, ни `postgres_data/` не отслеживаются.

### L9. `db.ts` — `beforeExit` может не работать в serverless
```typescript
process.on("beforeExit", async () => await db.$disconnect());
```

В serverless/edge-среде `beforeExit` не вызывается. Для standalone это OK, но стоит задокументировать.

### L10. Нет `loading.tsx` на ключевых маршрутах
Отсутствуют Suspense-boundaries:
- `(main)/orders/page.tsx`
- `(main)/orders/[citySlug]/[slug]/[orderSlug]/page.tsx`

Без них пользователь видит белый экран при загрузке данных.

---

## 📊 Матрица рисков

```
Критичность ▲
             │
  CRITICAL   │  C1 C2 C3 C6    ← Продакшен-блокеры
             │
  HIGH       │  H1 H3 H5 H6 H9 ← Безопасность + SEO
             │
  MEDIUM     │  M1 M5 M10 M11   ← Техдолг
             │
  LOW        │  L1 L2 L5        ← Качество кода
             │
             └──────────────────► Срочность
                Soon   Sprint   Backlog
```

---

## ✅ Что сделано хорошо

| Аспект | Оценка |
|--------|--------|
| FSD-архитектура | ✅ Чёткое разделение `shared/features/widgets/app` |
| Security headers | ✅ HSTS, X-Frame-Options, Referrer-Policy в next.config |
| Safe Actions | ✅ `next-safe-action` с auth/admin middleware |
| Zod validation | ✅ Валидация на Server Actions |
| Cookie security | ✅ httpOnly, Secure, SameSite=lax |
| Prisma select | ✅ Большинство запросов используют `select` |
| Image processing | ✅ Sharp + WebP + resize на сервере |
| Path traversal protection | ✅ Regex-фильтр на uploads |
| Audit logging | ✅ AuditLog модель с metadata |
| Cursor pagination | ✅ Серверная пагинация во всех сервисах |
| Docker multi-stage | ✅ builder/runner с Alpine |
| Ban system | ✅ `isBanned` проверка в safe-action middleware |
| Startup resilience | ✅ P3009 auto-resolve в startup.js |

---

## 🗺️ Рекомендуемый план действий

### Неделя 1 — Критические фиксы
1. **C1**: Подключить SMTP (Resend/Nodemailer)
2. **C2**: Добавить `select` в `validateCredentials`
3. **C3**: Синхронизировать `.env.example` файлы
4. **C6**: Убрать захардкоженный пароль — сделать обязательным `ADMIN_PASSWORD`
5. **C4/C7**: Удалить дубликаты (upload-action, seed)

### Неделя 2 — Безопасность
6. **H1**: Rate-limit на auth-маршруты
7. **H9**: Добавить ownership check в listing.service
8. **H3**: Кэшировать роль в JWT, убрать DB-запрос из proxy
9. **M11**: Заменить `unsafe-eval` на nonce-based CSP

### Неделя 3 — SEO + Оптимизация
10. **H5**: Добавить `robots.ts` и `sitemap.ts`
11. **H6**: Open Graph на всех публичных страницах
12. **M5**: Убрать или упростить template.tsx анимацию
13. **M8**: Добавить `error.tsx`, `not-found.tsx`, `loading.tsx`

### Неделя 4 — Техдолг
14. **M1**: Устранить все `as any` (создать типы для Telegram SDK)
15. **H7**: Рефакторинг order.service.ts
16. **M4**: Удалить легаси-скрипты
17. **H12**: Мигрировать `framer-motion` → `motion`
