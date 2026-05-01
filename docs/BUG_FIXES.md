# Реестр исправленных багов (Bug Fix Log)

В этом файле фиксируются критические ошибки, их причины и принятые решения для предотвращения рецидивов.

---

## [2026-04-30] Deploy мог стартовать при красном CI

**Симптом:** `Deploy → Production` запускался параллельно с workflow `CI`. Из-за этого production deploy мог пройти, даже если отдельная job `CI / E2E Smoke` завершалась с ошибкой.

**Причина:** `deploy.yml` слушал `push` напрямую и имел собственный `verify`, но не зависел от результата workflow `CI`. GitHub Actions workflows по умолчанию независимы друг от друга.

**Решение:**
- В `deploy.yml` добавлен job `wait-for-ci`, который через GitHub Actions API ждёт push-run workflow `CI` для того же `head_sha` и `head_branch`.
- `verify` теперь зависит от `wait-for-ci`, поэтому `build-and-push` и `deploy` не начнутся, пока CI не завершится `success`.
- Telegram notify теперь показывает отдельный статус `CI gate`.
- В `ci.yml` и `deploy.yml` добавлены комментарии: видимые env-значения являются fake CI-only placeholders, production secrets остаются только в GitHub Secrets и VPS `.env`.

**Security verdict:** PASS_WITH_NOTES — runtime-код и secrets не менялись; добавлен CI/CD orchestration gate.

---

## [2026-04-30] CI/CD E2E: Playwright webServer ждал `/` вместо healthcheck

**Симптом:** свежий CI run `25183625449` на коммите `d838449` падал только в job `E2E Smoke`; шаг `npm run test:e2e --workspace=@uslugi/web` завершался примерно через 120 секунд.

**Причина:** Playwright `webServer.url` был равен `BASE_URL`, то есть `http://127.0.0.1:3000/`. Главная страница рендерит `PopularCategories` через БД, а CI E2E job не поднимает PostgreSQL service, потому что текущие smoke-тесты проверяют auth/protected/API-guards и не требуют главной страницы. В итоге readiness endpoint был слишком тяжёлым для smoke-окружения.

**Решение:**
- В `apps/web/playwright.config.ts` добавлен `PLAYWRIGHT_WEB_SERVER_URL` с fallback на `${BASE_URL}/api/health`.
- В `.github/workflows/ci.yml` E2E job явно задаёт `PLAYWRIGHT_WEB_SERVER_URL=http://127.0.0.1:3000/api/health`.
- `actions/upload-artifact` обновлён с `v5` до `v7`, чтобы убрать Node 20 deprecation warning из annotations.

**Security verdict:** PASS_WITH_NOTES — runtime-код и secrets не менялись; изменение ограничено тестовой конфигурацией.

---

## [2026-04-30] CI/CD E2E: Redis `ECONNREFUSED 127.0.0.1:6379`

**Симптом:** Playwright E2E запускал `tsx server.ts`, сервер поднимался, но Redis adapter постоянно логировал `connect ECONNREFUSED 127.0.0.1:6379`, после чего появлялись `MaxRetriesPerRequestError` и unhandled rejection.

**Причина:** локальная конфигурация проекта уже использует Redis на host-порту `6380` (`docker-compose.yml`: `6380:6379`, service name `uslugi_redis`), но CI задавал `REDIS_URL=redis://127.0.0.1:6379` и не поднимал Redis service.

**Решение:**
- В `ci.yml` для job `e2e` добавлен service `redis:7-alpine` с пробросом `6380:6379` и healthcheck `redis-cli ping`.
- В `deploy.yml` для job `verify` добавлен такой же Redis service.
- `REDIS_URL` в CI/deploy verify переведён на `redis://127.0.0.1:6380`.
- `.env.example`, `apps/web/.env.example` и `apps/web/scripts/dev.ps1` синхронизированы с локальным портом `6380`.

**Security verdict:** PASS_WITH_NOTES — runtime-код и secrets не менялись; изменения ограничены CI/local config.

---

## [2026-04-30] CI/CD build: отсутствует `@tailwindcss/oxide-linux-x64-gnu`

**Симптом:** deploy verify job доходил до `npm run build --workspace=@uslugi/web`, но Next/Turbopack падал на `globals.css` с ошибкой `Cannot find native binding` и `Cannot find module '@tailwindcss/oxide-linux-x64-gnu'`.

**Причина:** `package-lock.json` был зафиксирован с Windows-записью `@tailwindcss/oxide-win32-x64-msvc`, но без Linux-записи `@tailwindcss/oxide-linux-x64-gnu`. Это известный класс npm-проблем с platform-specific optional dependencies: на другой ОС lockfile может не содержать нужный native package.

**Решение:**
- В `package-lock.json` добавлена недостающая transitive optional-запись `apps/web/node_modules/@tailwindcss/oxide-linux-x64-gnu@4.2.1`.
- В CI/deploy jobs `npm ci --include=dev` заменён на `npm ci --include=dev --include=optional`, чтобы optional native bindings не отбрасывались конфигурацией runner.

**Security verdict:** PASS_WITH_NOTES — runtime-код, secrets и package.json не менялись; lockfile фиксирует уже объявленную optional-зависимость Tailwind.

---

## [2026-04-30] CI/CD verify: `prisma: not found`

**Симптом:** deploy verify job падал на шаге `npx prisma generate --schema=apps/web/prisma/schema.prisma` с ошибкой `sh: 1: prisma: not found`.

**Причина:** Prisma CLI объявлен в workspace `@uslugi/web`, а не в root `package.json`. В GitHub Actions root-вызов `npx prisma` не гарантирует доступ к бинарю из workspace.

**Решение:**
- `npm ci` в verify/CI jobs заменён на `npm ci --include=dev --include=optional`, чтобы dev CLI и optional native bindings гарантированно устанавливались в CI.
- В `deploy.yml` и `ci.yml` Prisma generation переведён на `npm exec --workspace=@uslugi/web -- prisma generate --schema=prisma/schema.prisma`.
- E2E-шаг `npx playwright install --with-deps chromium` также переведён на workspace-вызов, потому что Playwright CLI тоже установлен в `@uslugi/web`.

**Security verdict:** PASS_WITH_NOTES — dependencies и secrets не менялись, runtime-код не затронут.

---

## [2026-04-30] Deploy CI/CD: падение Docker Buildx cache export

**Симптом:** production deploy мог падать на этапе `build-and-push` после включения verify gate и Docker Buildx cache `type=gha`.

**Причина:** workflow ограничивал `GITHUB_TOKEN` до `contents: read`, а GitHub Actions cache backend для Buildx использует Actions API. При ошибке cache export сборка падала, хотя сам cache не является обязательным артефактом деплоя.

**Решение:**
- Для job `build-and-push` добавлены минимальные права `contents: read` и `actions: write`.
- Docker Actions обновлены до актуальных major-версий: `docker/login-action@v4`, `docker/setup-buildx-action@v4`, `docker/build-push-action@v7`.
- `cache-to: type=gha` переведён в non-blocking режим через `ignore-error=true`, чтобы сбой cache export не блокировал production rollout.

**Security verdict:** PASS_WITH_NOTES — secrets и runtime-код не менялись; `use_insecure_cipher: true` остаётся отдельным DevOps-решением по совместимости VPS.

---

## [2026-04-28] Стабилизация Фазы 7 (Чат и Real-time)

### 1. Чат не работал на VPS (Dockerfile & Startup)
**Причина:** Dockerfile запускал `server.js` (скомпилированный Next.js), который не содержал логику Socket.io из `server.ts`. Кроме того, `tsx` находился в `devDependencies` и отсутствовал при `npm install --omit=dev`.
**Решение:** 
- `tsx` перенесен в `dependencies`.
- `startup.js` переписан для запуска `tsx server.ts`.
- В `next.config.mjs` добавлена поддержка `ws:` и `wss:` в CSP.

### 2. Ошибка пререндеринга /auth/login (CI/CD Failure)
**Причина:** Использование `useSearchParams()` в `LoginForm` без `Suspense` вызывало ошибку `prerender-error` во время сборки Next.js 16.
**Решение:** Компонент `LoginForm` обёрнут в `<Suspense>` в `src/app/auth/login/page.tsx`.

### 2. Ошибки типизации Socket.io (get-io.ts)
**Причина:** Глобальный объект `_io` не имел корректной типизации, что вызывало ошибки TS при обращении к методам Socket.io в Server Actions.
**Решение:** Внедрено `declare global` с правильными типами `Server` и `DefaultEventsMap`. Все `any` заменены на строгие типы.

### 3. Безопасность комнат чата (Security Breach Risk)
**Причина:** Отсутствовала проверка участника при подключении к комнате через сокеты — любой авторизованный пользователь мог "подслушать" чужую комнату, зная её ID.
**Решение:** В `socket-handlers.ts` добавлена проверка `isParticipant` через Prisma перед выполнением `socket.join(roomId)`.

### 4. Ошибки ссылок "Перейти к заказу" (404 Error)
**Причина:** Ссылки в чате строились по старому формату `/orders/[id]`, в то время как архитектура требует `/orders/[citySlug]/[categorySlug]/[orderSlug]`.
**Решение:** В `MessageBubble.tsx` внедрена логика сборки полного SEO-пути на основе метаданных заказа.

### 5. Мигание аватарок при загрузке (UX Glitch)
**Причина:** `AvatarFallback` показывался мгновенно до загрузки изображения, создавая визуальный шум.
- **Решение:** Добавлен `delay={600}` во все компоненты `AvatarFallback` (Header, List, MessageBubble).

### 6. "Тягучая" анимация сообщений (Performance/UX)
**Причина:** Использование `framer-motion` с тяжелыми трансформациями (`y`, `scale`) на каждом сообщении создавало задержки на мобильных устройствах.
**Решение:** Анимация упрощена до `initial={{ opacity: 0 }} animate={{ opacity: 1 }}` с длительностью `0.15s`.

---

## [2026-04-27] Баги в реализации Фазы 7 (чат)

### 1. AES-GCM: IV 12 байт (NIST Compliance)
**Причина:** Использование 16 байт IV не соответствовало рекомендациям NIST SP 800-38D для AES-GCM.
**Решение:** `apps/web/src/shared/lib/crypto.ts` — заменено на `randomBytes(12)`.

### 2. AES-GCM: Валидация длины ключа
**Причина:** Отсутствие проверки вызывало невнятные ошибки Node.js при неправильном ключе.
**Решение:** Явная проверка `if (buf.length !== 32) throw new Error("ENCRYPTION_KEY must be 64 hex characters")`.

### 3. Тест crypto.test.ts: Восстановление env
**Причина:** Тест мутировал `process.env` без восстановления.
**Решение:** Обёрнуто в `try/finally` + настройка env в `vitest.config.ts`.

### 4. chat.service.ts: Обработка отсутствующих записей
**Причина:** `update` падал, если сообщение или диалог не найдены.
**Решение:** Добавлены пре-чеки `if (!message) throw`.

### 5. CSV-инъекции в экспорте
**Причина:** Переносы строк и кавычки ломали структуру CSV.
**Решение:** Экранирование `.replace(/\r?\n/g, " ").replace(/"/g, '""')`.

---

## [2026-04-26] Баги в форме создания объявления (ListingForm + ensureCityAction)

### 1. `Cannot read properties of undefined (reading 'user')` на `/my-listings`
**Причина:** `listingService.getByUser` не включал `provider.user` в Prisma select.
**Решение:** Добавлен полный блок `provider` с вложенным `user` в выборку.

### 2. `Unique constraint failed` в `ensureCityAction`
**Причина:** Поиск города по `name + region` не находил записи без региона, пытаясь создать дубликат.
**Решение:** Поиск изменен на `OR: [{ fiasId }, { name }]`.

## [2026-04-28] VPS Docker `uslugi_web` / Next standalone

**Симптом:** контейнер `uslugi_web` в `/root/masters_app` проходил миграции и seed, запускал Next.js на `3001`, но падал на старте `Proxy-Bridge` с ошибкой `Cannot find module 'next/dist/compiled/ua-parser-js'`.

**Причина:** production proxy-бандл (`apps/web/server.js`) импортировал `socket-handlers.ts`, а тот тянул `auth.ts`. В `auth.ts` на верхнем уровне используются `next/server` и `next/headers`. Для Next standalone эти entrypoint-файлы и их compiled-зависимости не гарантированно попадают в runtime-образ, поэтому proxy падал до готовности публичного порта `3000`.

**Постоянный фикс:** JWT `encrypt`/`decrypt` вынесены в `apps/web/src/shared/lib/session-token.ts` без импортов `next/*`, `socket-handlers.ts` использует этот чистый модуль, `startup.js` больше не переобъявляет `appDir`, Dockerfile проверяет `startup.js` через `node --check` и вызывает esbuild с явным entrypoint `./apps/web/server.ts`.

**Проверки:** `node --check apps/web/scripts/startup.js`, `tsc --noEmit --project apps/web/tsconfig.json`.

---
---

## [2026-04-29] Security Remediation & Infrastructure Hardening

### 1. Сброс лимитов (Rate Limiting) при перезагрузке
**Причина:** Лимиты хранились в локальном `Map` внутри процесса. При деплое или перезапуске контейнера счетчики обнулялись, что позволяло обходить защиту от спама и брутфорса.
**Решение:** Внедрен распределенный Rate Limiting на базе **Redis** (`src/shared/lib/rate-limit.ts`). Лимиты теперь персистентны и синхронизированы между процессами.

### 2. Уязвимость административных действий (RBAC Bypass)
**Причина:** Некоторые административные функции (удаление пользователей, смена ролей) использовали обычный `safeActionClient`, полагаясь только на клиентские проверки.
**Решение:** Создан `adminActionClient` с обязательной серверной проверкой роли `ADMIN`. Все административные API рефакторизированы под этот клиент.

### 3. Отсутствие аудита IP-адресов
**Причина:** Логи аудита не содержали IP-адрес злоумышленника, что затрудняло расследование инцидентов.
**Решение:** В `logAudit` добавлена автоматическая детекция IP через `headers()` и заголовок `x-forwarded-for`.

### 4. Ошибки UI после обновления next-safe-action v8
**Причина:** В мажорной версии v8 поле `validationError` было переименовано в `validationErrors`, что сломало отображение ошибок валидации в формах админки.
**Решение:** Обновлены компоненты `DeleteUserButton.tsx` и `role-select.tsx` для поддержки нового формата возвращаемых ошибок.

### 5. Forbidden `any` в критических путях
**Причина:** Использование `any` в интеграции с Dadata и на страницах заказов скрывало потенциальные ошибки рантайма.
**Решение:** Полное устранение `any`. Внедрены строгие интерфейсы для гео-предложений и использованы Prisma-типы (`OrderWithDetails`) для данных заказов.
