# CLAUDE.md — UslugiRyadom Project Context

> Проект: **УслугиРядом** — YouDo-конкурент, доска городских услуг
> Стек: Next.js 16+, TypeScript, Turborepo, Prisma, PostgreSQL + PostGIS
> Архитектура: Feature-Sliced Design (FSD), Desktop-first

---

## Как давать задачи

**Простая задача** → пиши напрямую, я сделаю сам.

**Сложная / многошаговая задача** → пиши так:
> "как оркестратор — [задача]" или используй команду `/delegate [задача]`

Тогда я:
1. Читаю `.agent/workflows/delegate.md`, `.agent/skills/agent-protocol/SKILL.md` и `.agent/skills/agent-orchestrator/SKILL.md`
2. Анализирую задачу, разбиваю на подзадачи
3. Показываю план — **жду твоего одобрения**
4. Выполняю роли через нужные скиллы; реальных субагентов запускаю только если это разрешено текущими правилами и запросом
5. Провожу Code Quality, QA и финальный Security Audit там, где это применимо
6. Даю сводный отчёт и обновляю документацию по правилам проекта

**Примеры:**
```
"как оркестратор — доделай фазу 6"
"как оркестратор — проведи полный аудит безопасности и качества кода"
"как оркестратор — подготовь проект к Фазе 7 (чат)"
```

---

## Контекст проекта — читать в начале сессии

1. **`docs/PROJECT_STATE.md`** — компактный снапшот: текущая фаза, что сделано, что осталось, ключевые файлы (~2KB, дёшево по токенам). **Читать всегда.**
2. **`DEVELOPMENT_PLAN.md`** — полный детальный план всех фаз (~172KB). Читать только нужный раздел когда нужна детализация по конкретной задаче.
3. **`docs/BUG_FIXES.md`** — реестр всех исправленных багов с причинами и решениями. **Читать перед работой над багом** (возможно, похожее уже решалось). **Обновлять после каждого фикса.**

После завершения задачи — обязательно обновить `docs/PROJECT_STATE.md`.

---

## Агентские скиллы

Все скиллы лежат в `.agent/skills/`. Читай нужный скилл через `Read` перед выполнением задачи.

| Скилл | Когда использовать |
|-------|-------------------|
| `.agent/skills/agent-protocol/SKILL.md` | **ОБЯЗАТЕЛЬНО** — общий протокол для всех агентов |
| `.agent/skills/agent-orchestrator/SKILL.md` | Координация задач, декомпозиция |
| `.agent/skills/agent-architect/SKILL.md` | FSD, структура, рефакторинг |
| `.agent/skills/agent-security/SKILL.md` | Главный Security Gatekeeper: безопасность, PII, auth, permissions, API, secrets, DevSecOps |
| `.agent/skills/agent-seo/SKILL.md` | Метаданные, robots, sitemap |
| `.agent/skills/agent-code-quality/SKILL.md` | Типизация, DRY, мёртвый код |
| `.agent/skills/agent-qa/SKILL.md` | E2E тесты, a11y, edge-cases |
| `.agent/skills/agent-performance/SKILL.md` | N+1, бандл, кэширование |
| `.agent/skills/agent-mobile-expert/SKILL.md` | Mobile разработка (React Native/Expo) |
| `.agent/skills/agent-monorepo-master/SKILL.md` | Управление Turborepo и Shared пакетами |
| `.agent/skills/agent-devops-cicd/SKILL.md` | DevOps, CI/CD, Infrastructure |
| `.agent/skills/agent-notary/SKILL.md` | Документирование, отчеты, PROJECT_STATE.md |
| `.agent/skills/docker-expert/SKILL.md` | Docker, контейнеризация |
| `.agent/skills/figma-to-code-mastery/SKILL.md` | Figma → код |
| `.agent/skills/karpathy-guidelines/SKILL.md` | Принципы написания кода |
| `.agent/skills/playwright-testing/SKILL.md` | E2E тесты |
| `.agent/skills/postgresql-optimization/SKILL.md` | Оптимизация БД |
| `.agent/skills/sentry-expert/SKILL.md` | Мониторинг ошибок |
| `.agent/skills/shadcn-ui-mastery/SKILL.md` | Shadcn UI компоненты |

---

## Структура проекта

```
uslugi_ryadom/
├── apps/web/               — Next.js 16 приложение
│   ├── src/
│   │   ├── app/            — App Router (page.tsx, layout.tsx)
│   │   ├── features/       — Изолированные бизнес-модули
│   │   ├── widgets/        — Композиционные UI-блоки
│   │   ├── shared/         — Переиспользуемые примитивы
│   │   ├── services/       — Data Access Layer (11 сервисов)
│   │   └── proxy.ts        — Защита роутов (вместо middleware)
│   └── prisma/
│       ├── schema.prisma   — Модель данных
│       └── migrations/     — Все миграции БД
├── packages/
│   ├── shared-types/
│   ├── validation/
│   └── api-client/
├── .agent/skills/          — Скиллы мультиагентной системы
└── docs/
    └── agent-reports/      — Отчёты агентов
```

## Статус проекта

- ✅ Фаза 1–5: Фундамент, Auth, Модель данных, REST API, Desktop UI
- ✅ Фаза 6: ServiceListing (объявления от исполнителей)
- ✅ Фаза 7: Чат и уведомления (Socket.io, Crypto, E2E)
- ❌ Фазы 8–12: Тесты, Mobile, Geo, Монетизация

## Критические правила

1. 💰 **Экономия токенов**: Читай только нужные части файлов, сжатые ответы, grep вместо чтения всего файла.
2. 🔒 **Security Gate**: Перед планированием и написанием runtime-кода прочитай `agent-security`, если затронуты auth/PII/API/Server Actions/uploads/cookies/CSP/secrets/Docker/CI/CD/dependencies/Prisma/rate-limits/API throttling/Idempotency-Key. CRITICAL/HIGH риск блокирует работу.
3. 🔐 **Frontend is untrusted**: На фронтенде только UI/UX, публичные данные и временное состояние. Secrets, permissions, ownership, бизнес-правила безопасности, rate limits и доступ к БД — только на backend.
4. 🗄️ **БД** — все изменения через `prisma migrate dev --name <name>`, никакого прямого SQL
5. 🏆 **Всегда рекомендуй лучший вариант** — при выборе всегда объясняй ПОЧЕМУ один вариант лучше
6. 🏗️ **FSD**: `app → widgets → features → shared` (только вниз)
7. 🔐 **Auth**: JWT в httpOnly cookies, никакого localStorage
8. 🛡️ **Типы**: `any` — ЗАПРЕЩЁН, только `unknown` + Zod
9. ⚛️ **Server Components** по умолчанию, `'use client'` только для интерактивности
10. 🧪 **Тестирование**: Каждое изменение ОБЯЗАНО проходить проверку (`tsc`, `vitest`, `playwright`).
11. 📝 **Коммиты**: ТОЛЬКО на РУССКОМ языке. Максимально развернутые, логически сгруппированные и БЕЗ технического мусора.
12. 📖 **Инструкции**: ВСЕГДА читай `CLAUDE.md`, `GEMINI.md`, `AGENTS.md` и `agent-protocol/SKILL.md` в начале сессии. При изменении правил обновляй все входные файлы и общий протокол.
13. 🇷🇺 **Язык**: Все сообщения и документация — ТОЛЬКО на РУССКОМ языке.
14. 🧹 **Гигиена**: ПЕРЕД коммитом проверять `git status` на наличие лишних файлов (логи, временные отчеты).
15. 📚 **Docs First**: Перед написанием кода ОБЯЗАТЕЛЬНО сверяйся с актуальной документацией через `context7`, `ref` или `search_web`.

## Локальный запуск

```bash
cd C:\Users\drobi\Desktop\projects\antigraviti\masters-app
npm run dev:full  # чистит порты 3000/4040, поднимает Postgres, Next.js
```

БД: `uslugi_db` | Email: mock → `apps/web/email-debug.log`

---

## 🧪 Тестирование и Качество (Mandatory)

Агент ОБЯЗАН провести проверку по следующим уровням:

1. **L1: Static (TypeScript)**: `npx tsc --noEmit`. 0 ошибок в затронутых файлах.
2. **L2: Unit/Logic (Vitest)**: `npm run test` или `npx vitest run [path]`. Для сервисов и actions.
3. **L3: E2E (Playwright)**: `npm run test:e2e` или `npx playwright test [path]`. Для UI и сценариев.
4. **L4: Manual**: Проверка Desktop/Mobile (375px), Loading и Empty states.

### 🏁 Definition of Done (Критерии готовности)
- [ ] Код соответствует FSD-архитектуре.
- [ ] Security Gate выполнен для runtime-кода; нет незакрытых CRITICAL/HIGH рисков.
- [ ] Доверенная логика и секреты не вынесены на фронтенд.
- [ ] Нет `any`, `tsc` прошел.
- [ ] Новая логика покрыта тестами.
- [ ] Регрессия не сломана.
- [ ] `PROJECT_STATE.md` обновлен.
