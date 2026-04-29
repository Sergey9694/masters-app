# AGENTS.md — Codex Entry Point for UslugiRyadom

> Codex-specific входной файл для проекта **УслугиРядом**.
> Источник истины для общих правил уже существует в `.agent/skills/`;
> этот файл не дублирует скиллы, а объясняет, как Codex должен ими пользоваться.

---

## Старт каждой сессии

1. Прочитай `docs/PROJECT_STATE.md` — быстрый снимок состояния проекта.
2. Прочитай `CLAUDE.md` и `GEMINI.md` — там зафиксированы общие правила для других агентных сред.
3. Прочитай `.agent/skills/agent-protocol/SKILL.md` — общий протокол обязателен для всех агентов.
4. Для конкретной задачи прочитай нужный скилл из `.agent/skills/<name>/SKILL.md`.

Если правила меняются, обновляй синхронно:
- `AGENTS.md`
- `CLAUDE.md`
- `GEMINI.md`
- `.agent/skills/agent-protocol/SKILL.md`

---

## Как Codex использует существующих агентов

Существующие агенты реализованы как проектные skill-файлы в `.agent/skills/`.
Codex может пользоваться ими напрямую: читать нужный `SKILL.md` и действовать в этой роли.
Копировать эти файлы в отдельную Codex-структуру не нужно: `.agent/skills/` остается единым источником истины.

Если пользователь пишет:
- `как оркестратор` — прочитай `agent-protocol`, затем `agent-orchestrator`.
- `как архитектор` — прочитай `agent-protocol`, затем `agent-architect`.
- `как security-агент` — прочитай `agent-protocol`, затем `agent-security`.
- `как SEO-агент` — прочитай `agent-protocol`, затем `agent-seo`.
- `как code-quality` или `как ревьюер` — прочитай `agent-protocol`, затем `agent-code-quality`.
- `как QA` — прочитай `agent-protocol`, затем `agent-qa` и при E2E-задачах `playwright-testing`.
- `как performance-агент` — прочитай `agent-protocol`, затем `agent-performance`.
- `как docker-эксперт` — прочитай `agent-protocol`, затем `docker-expert`.
- `как postgres-эксперт` — прочитай `agent-protocol`, затем `postgresql-optimization`.
- `как shadcn-эксперт` — прочитай `agent-protocol`, затем `shadcn-ui-mastery`.

В Codex реальные параллельные субагенты запускай только когда текущие системные правила и запрос пользователя это разрешают. Если запуск субагентов недоступен или неуместен, выполняй роли последовательно через чтение соответствующих skill-файлов.

---

## Критические правила проекта

- Общение, отчеты, комментарии и коммиты — на русском языке.
- Кодовые идентификаторы — на английском языке.
- FSD-иерархия: `shared -> features -> widgets -> app`; зависимости идут только вверх по слоям потребления.
- БД менять только через Prisma Migrate; перед изменением `schema.prisma` спросить владельца.
- `any` запрещен; используй `unknown`, Zod и type guards.
- Auth-токены — только httpOnly cookies, не `localStorage`.
- Server Components по умолчанию; `'use client'` только для интерактивности.
- Файлы больше 200 строк — сигнал предложить рефакторинг.
- Новые зависимости, изменения auth/security, `.env`, `docker-compose`, `next.config` и архитектурные решения на много файлов требуют согласования.
- Коммит делать только после явного разрешения владельца.

---

## Проверки

После значимых изменений выполняй релевантные проверки:

- TypeScript: `npx tsc --noEmit`
- Unit/logic: `npm run test` или точечный `npx vitest run <path>`
- E2E/UI: `npm run test:e2e` или точечный `npx playwright test <path>`
- UI: desktop и mobile 375px, loading/empty/error states

Для документационных изменений достаточно проверить diff и `git status`.

---

## Документация после задач

- После значимой задачи обнови `docs/PROJECT_STATE.md`.
- После исправления бага обнови `docs/BUG_FIXES.md`.
- Для крупных аудитов и многоагентных задач добавь отчет в `docs/agent-reports/`.
- Не читай весь `DEVELOPMENT_PLAN.md` без необходимости; ищи только нужную фазу или раздел.
