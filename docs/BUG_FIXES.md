# Реестр исправленных багов (Bug Fix Log)

В этом файле фиксируются критические ошибки, их причины и принятые решения для предотвращения рецидивов.

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
