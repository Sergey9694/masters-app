# Security Checklists

Используй только релевантные разделы. Для каждого пункта фиксируй статус: pass, fixed, blocked, accepted risk или not applicable.

## Auth, Sessions, Cookies

- [ ] Токены только в httpOnly cookies; не `localStorage`/`sessionStorage`.
- [ ] Cookies имеют `httpOnly`, `secure` в production, `sameSite` по сценарию, корректный `path`.
- [ ] JWT проверяется на сервере; client claims не считаются доверенными.
- [ ] Logout/rotation/revocation не ломаются.
- [ ] Ошибки auth не раскрывают, существует ли email/аккаунт.
- [ ] Auth diagnostic logs не содержат токены, email без маскирования, PII сверх необходимости.

## Authorization and Ownership

- [ ] Every read/update/delete проверяет владельца или роль.
- [ ] Admin routes требуют role/admin middleware.
- [ ] Нельзя менять `userId`, `role`, `status`, `isBanned` через клиентский payload.
- [ ] IDOR проверен для UUID, slug, numeric id, conversation id, order id.
- [ ] Socket rooms (`conv:*`, `user:*`) доступны только участникам/админам.

## Input Validation

- [ ] Все Server Actions используют Zod schema.
- [ ] Route Handlers валидируют body, params, searchParams.
- [ ] Валидация включает синтаксис и бизнес-смысл: длины, диапазоны, enum, ownership.
- [ ] `JSON.parse` только с try/catch и дальнейшей Zod validation.
- [ ] Для свободного текста есть лимиты длины и нормализация.
- [ ] Для HTML/Markdown либо запрет, либо sanitizer с allowlist.

## Data and Prisma

- [ ] Prisma-запросы к User и PII-моделям используют `select`.
- [ ] Нет возврата `passwordHash`, токенов, `telegramId`, ban/admin internals в клиент/API.
- [ ] Нет raw SQL без отдельного согласования и безопасной параметризации.
- [ ] Нет N+1, который можно использовать как DoS amplifier.
- [ ] Экспорты не раскрывают plaintext сверх бизнес-необходимости.
- [ ] Миграции только через Prisma Migrate и после согласования владельца.

## Public API, Server Actions, Webhooks

- [ ] Public endpoint имеет rate limit и понятный error shape.
- [ ] Public endpoint имеет API throttling/backpressure для дорогих операций, а не только общий rate limit.
- [ ] Non-idempotent mutation принимает и проверяет `Idempotency-Key`, если повтор может создать дубль или повторный side effect.
- [ ] `Idempotency-Key` scoped по user/session, endpoint, operation, payload hash и TTL.
- [ ] Повтор с тем же key и тем же payload возвращает прежний результат; тот же key с другим payload возвращает `409 Conflict`.
- [ ] Просроченный или повторно использованный idempotency key не создаёт bypass rate limit.
- [ ] Frontend-дедупликация кликов не считается idempotency или abuse protection.
- [ ] Methods ограничены (`GET/POST/...`), неожиданные методы возвращают 405.
- [ ] Webhooks проверяют signature/timestamp/replay protection.
- [ ] Server Actions не доверяют hidden inputs и session-derived fields.
- [ ] API не раскрывает stack traces, raw Prisma errors, секреты конфигурации.

## XSS, CSRF, CSP, Headers

- [ ] Нет `dangerouslySetInnerHTML` без sanitizer и явной причины.
- [ ] Пользовательский контент рендерится как текст или проходит sanitizer.
- [ ] CSP не использует `unsafe-eval` в production; для inline scripts/styles нужен nonce/sha, если возможно.
- [ ] Есть `X-Content-Type-Options: nosniff`, frame protection, HSTS на HTTPS.
- [ ] Mutations защищены auth + sameSite/CSRF-моделью, где применимо.
- [ ] Redirects используют allowlist внутренних путей.

## Uploads and Files

- [ ] Проверяются размер, MIME, расширение и реальный тип файла.
- [ ] Имя файла генерируется сервером; пользовательский путь не используется.
- [ ] Нет path traversal (`../`, encoded traversal).
- [ ] Uploads не исполняются как код и отдаются с безопасным content-type.
- [ ] Для изображений желательно переписать/нормализовать файл перед хранением.

## Rate Limits and Abuse

- [ ] Login/register/reset-password имеют строгий rate limit.
- [ ] Public search/suggest/upload/chat/report endpoints имеют rate limit.
- [ ] Throttling настроен по endpoint + user/session/IP + resource, где это применимо.
- [ ] Для chat send, notification emit, report creation, upload finalize, order/request creation и платежей есть idempotency или другая серверная защита от дублей.
- [ ] Throttling для дорогих операций может замедлять, ставить backpressure или возвращать `429` с безопасным `Retry-After`.
- [ ] Rate-limit key не даёт легко обходить лимит.
- [ ] Ошибки лимита не раскрывают лишнюю информацию.
- [ ] Abuse-сценарии для chat/notifications/reports учтены.

## Secrets, Env, Infra, CI/CD

- [ ] `.env` не коммитится; secrets не в build args и не в `NEXT_PUBLIC_*`.
- [ ] `process.env` читается только на сервере через lazy getters/validated config.
- [ ] Docker images не содержат секреты в слоях.
- [ ] Redis/Postgres не публикуются наружу без необходимости.
- [ ] nginx/WebSocket proxy не открывает лишние origins.
- [ ] CI/CD не печатает secrets в logs.

## Dependencies and Supply Chain

- [ ] Перед новой зависимостью есть Build vs Buy и согласование владельца.
- [ ] Проверены maintenance, downloads/stars, issues, license, bundle size.
- [ ] Для security-critical dependency проверены known advisories.
- [ ] `npm audit --omit=dev` или релевантная проверка выполнена при изменении зависимостей.
- [ ] Не добавлены postinstall/build scripts без причины.

## Logging, Monitoring, Incident Readiness

- [ ] Логи содержат security events: auth failure, rate limit, admin action, suspicious upload.
- [ ] Логи не содержат password, tokens, full cookies, secret env, plaintext sensitive chat/export.
- [ ] Sentry/telemetry redaction настроены для PII.
- [ ] Admin actions имеют audit trail.
- [ ] Для CRITICAL/HIGH есть понятный rollback/mitigation plan.

## Quick Audit Commands

```bash
rg -n "passwordHash|telegramId|isBanned|AUTH_SECRET|ENCRYPTION_KEY|JWT|token|cookie" apps packages server.ts
rg -n "localStorage|sessionStorage|dangerouslySetInnerHTML|innerHTML|eval\\(|new Function" apps/web/src
rg -n "JSON\\.parse|request\\.json\\(|searchParams|params" apps/web/src
rg -n "findUnique\\(|findFirst\\(|findMany\\(|include:" apps/web/src packages
rg -n "\\$queryRaw|\\$executeRaw|raw" apps/web/src packages
rg -n "NEXT_PUBLIC_|process\\.env" apps/web/src packages server.ts next.config.* docker-compose.yml
rg -n "cors|Access-Control-Allow-Origin|redirect\\(|permanentRedirect\\(" apps/web/src
npm audit --omit=dev
```
