# CLAUDE.md — UslugiRyadom Project Context

> Проект: **УслугиРядом** — YouDo-конкурент, доска городских услуг
> Стек: Next.js 16+, TypeScript, Turborepo, Prisma, PostgreSQL + PostGIS
> Архитектура: Feature-Sliced Design (FSD), Desktop-first

---

## Как давать задачи

**Простая задача** → пиши напрямую, я сделаю сам.

**Сложная / многошаговая задача** → пиши так:
> "как оркестратор — [задача]"

Тогда я:
1. Читаю `.agent/skills/agent-orchestrator/SKILL.md`
2. Анализирую задачу, разбиваю на подзадачи
3. Показываю план — **жду твоего одобрения**
4. Запускаю нужных субагентов (параллельно если возможно)
5. Собираю результаты, задаю вопросы если нужно
6. Даю сводный отчёт

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
| `.agent/skills/agent-security/SKILL.md` | Безопасность, PII, rate-limits |
| `.agent/skills/agent-seo/SKILL.md` | Метаданные, robots, sitemap |
| `.agent/skills/agent-code-quality/SKILL.md` | Типизация, DRY, мёртвый код |
| `.agent/skills/agent-qa/SKILL.md` | E2E тесты, a11y, edge-cases |
| `.agent/skills/agent-performance/SKILL.md` | N+1, бандл, кэширование |
| `.agent/skills/docker-expert/SKILL.md` | Docker, CI/CD |
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

## Завершённые фазы

- ✅ Фаза 1–5: Фундамент, Auth, Модель данных, REST API, Desktop UI
- 🟡 Фаза 6: ServiceListing (объявления от исполнителей) — ~70%
- ❌ Фазы 7–12: Чат, Тесты, Mobile, Geo, Монетизация

## Критические правила

1. 💰 **Экономия токенов** — читай только нужные части файлов, сжатые ответы, grep вместо чтения всего файла
2. 🗄️ **БД** — все изменения через `prisma migrate dev --name <name>`, никакого прямого SQL
3. 🏆 **Всегда рекомендуй лучший вариант** — при выборе всегда объясняй ПОЧЕМУ один вариант лучше
4. **FSD**: `app → widgets → features → shared` (только вниз)
5. **Auth**: JWT в httpOnly cookies, никакого localStorage
6. **Типы**: `any` — ЗАПРЕЩЁН, только `unknown` + Zod
7. **Server Components** по умолчанию, `'use client'` только для интерактивности
8. **Тестирование**: Каждое изменение ОБЯЗАНО проходить проверку (`tsc`, `vitest`, `playwright`).
9. **Инструкции**: ВСЕГДА читай `CLAUDE.md`, `GEMINI.md` и `agent-protocol/SKILL.md` в начале сессии. При изменении правил обновляй все три файла.

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
- [ ] Нет `any`, `tsc` прошел.
- [ ] Новая логика покрыта тестами.
- [ ] Регрессия не сломана.
- [ ] `PROJECT_STATE.md` обновлен.
