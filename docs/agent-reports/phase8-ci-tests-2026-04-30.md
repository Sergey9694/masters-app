# Phase 8 Report — Tests & CI/CD

Дата: 2026-04-30
Режим: `/delegate`, роли orchestrator + QA + DevOps/CI + Security Gate
Verdict security: `PASS_WITH_NOTES`

## Что сделано

- Настроен базовый Vitest-контур: `apps/web/vitest.config.ts`, `test:run`, `test:coverage`, root Turbo tasks.
- Добавлены unit/integration тесты:
  - `apps/web/src/services/__tests__/order.service.test.ts`
  - `apps/web/src/services/__tests__/auth.service.test.ts`
  - `apps/web/src/services/__tests__/proposal.service.test.ts`
  - `apps/web/src/services/__tests__/listing.service.test.ts`
  - `apps/web/src/shared/lib/__tests__/auth.test.ts`
  - `apps/web/src/shared/lib/__tests__/rate-limit.test.ts`
- Настроен Playwright: auto `webServer`, Chromium desktop, mobile viewport 375px.
- Добавлены smoke E2E:
  - `apps/web/e2e/auth.spec.ts`
  - `apps/web/e2e/order-flow.spec.ts`
  - `apps/web/e2e/listing.spec.ts`
- Создан `.github/workflows/ci.yml`: `lint`, `typecheck`, `test`, `e2e`.
- Усилен `.github/workflows/deploy.yml`: verify job перед Docker build/push/deploy, Telegram secrets вынесены в env шага.
- Исправлен найденный тестами auth-блокер: `apps/web/src/proxy.ts` теперь пропускает публичные `/api/v1/auth/login`, `/api/v1/auth/login/telegram`, `/api/v1/auth/register`, но не открывает остальные `/api/v1`.
- Убраны lint-блокеры в runtime-файлах без добавления `any`.

## Проверки

- `npm run lint` — PASS, 36 warnings остаются non-blocking и не относятся к критическим ошибкам фазы.
- `npm run typecheck` — PASS.
- `npm run test:run` — PASS, 10 files / 49 tests.
- `npm run test:e2e --workspace=@uslugi/web` — PASS, 26 tests, Chromium desktop + mobile.
- `npm run build --workspace=@uslugi/web` — PASS после запуска вне sandbox из-за Google Fonts network fetch.

## Остаточные замечания

- Новые dev-dependencies для DOM component tests и pre-commit tooling не добавлялись без согласования владельца: `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`, `prettier`, `lint-staged`, `husky`.
- Deploy workflow оставляет `use_insecure_cipher: true` для VPS SSH/SCP, чтобы не сломать текущий доступ. Это residual security note для отдельного DevOps-решения.
- Build проходит, но Next/Turbopack пишет warnings по NFT trace для upload route и dynamic usage в RootLayout. Они не блокируют сборку, но их стоит вынести в отдельную стабилизационную задачу.
- В sandbox Turbo не может получить git dirty hash из-за `safe.directory`; git-конфиг глобально не менялся.

## Docs First источники

- GitHub Actions CI: https://docs.github.com/actions/automating-builds-and-tests/about-continuous-integration
- Playwright CI: https://playwright.dev/docs/ci
- Vitest coverage: https://vitest.dev/guide/coverage.html
- actions/checkout: https://github.com/actions/checkout
- actions/setup-node: https://github.com/actions/setup-node
- actions/upload-artifact: https://github.com/actions/upload-artifact
