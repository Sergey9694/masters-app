# GEMINI.md — UslugiRyadom Project Context

> Проект: **УслугиРядом** — YouDo-конкурент, доска городских услуг
> Стек: Next.js 16+, TypeScript, Turborepo, Prisma, PostgreSQL + PostGIS
> Архитектура: Feature-Sliced Design (FSD), Desktop-first

---

## Как давать задачи

**Простая задача** → пиши напрямую.

**Сложная / многошаговая задача** → пиши так:
> "как оркестратор — [задача]"

Тогда:
1. Прочитай `.agent/skills/agent-orchestrator/SKILL.md`
2. Проанализируй задачу, разбей на подзадачи
3. Покажи план — **дождись одобрения владельца**
4. Выполни подзадачи через специализированные скиллы
5. Дай сводный отчёт, обнови `docs/PROJECT_STATE.md`

**Примеры:**
```
"как оркестратор — доделай фазу 6"
"как оркестратор — проведи полный аудит безопасности"
"как оркестратор — подготовь проект к Фазе 7"
```

---

## Контекст проекта — читать в начале сессии

1. **`docs/PROJECT_STATE.md`** — компактный снапшот: текущая фаза, что сделано, что осталось, ключевые файлы (~2KB, дёшево по токенам). **Читать всегда.**
2. **`DEVELOPMENT_PLAN.md`** — полный детальный план всех фаз (~172KB). Читать только нужный раздел когда нужна детализация по конкретной задаче.

После завершения задачи — обязательно обновить `docs/PROJECT_STATE.md`.

---

## Агентские скиллы

Все скиллы лежат в `.agent/skills/` в корне проекта.
Для загрузки скилла используй `activate_skill` с путём к файлу.

| Скилл | Путь | Когда использовать |
|-------|------|-------------------|
| agent-protocol | `.agent/skills/agent-protocol/SKILL.md` | **ОБЯЗАТЕЛЬНО** — читать первым |
| agent-orchestrator | `.agent/skills/agent-orchestrator/SKILL.md` | Координация задач |
| agent-architect | `.agent/skills/agent-architect/SKILL.md` | FSD, структура |
| agent-security | `.agent/skills/agent-security/SKILL.md` | Безопасность |
| agent-seo | `.agent/skills/agent-seo/SKILL.md` | SEO, метаданные |
| agent-code-quality | `.agent/skills/agent-code-quality/SKILL.md` | Качество кода |
| agent-qa | `.agent/skills/agent-qa/SKILL.md` | Тестирование |
| agent-performance | `.agent/skills/agent-performance/SKILL.md` | Производительность |
| docker-expert | `.agent/skills/docker-expert/SKILL.md` | Docker |
| figma-to-code-mastery | `.agent/skills/figma-to-code-mastery/SKILL.md` | Figma → код |
| karpathy-guidelines | `.agent/skills/karpathy-guidelines/SKILL.md` | Принципы кода |
| playwright-testing | `.agent/skills/playwright-testing/SKILL.md` | E2E тесты |
| postgresql-optimization | `.agent/skills/postgresql-optimization/SKILL.md` | Оптимизация БД |
| sentry-expert | `.agent/skills/sentry-expert/SKILL.md` | Мониторинг |
| shadcn-ui-mastery | `.agent/skills/shadcn-ui-mastery/SKILL.md` | UI компоненты |

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

## Стек (Build vs Buy defaults)

| Задача | Решение |
|--------|---------|
| Styling | Tailwind CSS v4 + `cn()` |
| UI | Shadcn UI (Radix Primitives) |
| Icons | Lucide React |
| Forms | React Hook Form + Zod |
| Animations | Motion (framer-motion) |
| Toasts | Sonner |
| Client State | Zustand (только UI) |
| Server State | Server Actions + Prisma |

## Локальный запуск

```bash
cd C:\Users\drobi\Desktop\projects\antigraviti\masters-app
npm run dev:full
```

БД: `uslugi_db` | Email: mock → `apps/web/email-debug.log`
