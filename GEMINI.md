> Проект: **УслугиРядом** — YouDo-конкурент, доска городских услуг
> Стек: Next.js 16+, TypeScript, Turborepo, Prisma, PostgreSQL + PostGIS
> Архитектура: Feature-Sliced Design (FSD), Desktop-first
> Философия: **Доверие (Trust), Локальность (Local), Экспертность (Expert)**

---

## Как давать задачи

**Простая задача** → пиши напрямую.

**Сложная / многошаговая задача** → пиши так:
> "как оркестратор — [задача]" или используй команду `/delegate [задача]`

Тогда:
1. Прочитай `.agent/workflows/delegate.md` и `.agent/skills/agent-orchestrator/SKILL.md`
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
| agent-security | `.agent/skills/agent-security/SKILL.md` | Главный Security Gatekeeper: безопасность, PII, auth, permissions, API, secrets, DevSecOps |
| agent-seo | `.agent/skills/agent-seo/SKILL.md` | SEO, метаданные |
| agent-code-quality | `.agent/skills/agent-code-quality/SKILL.md` | Качество кода |
| agent-qa | `.agent/skills/agent-qa/SKILL.md` | Тестирование |
| agent-performance | `.agent/skills/agent-performance/SKILL.md` | Производительность |
| agent-mobile-expert | `.agent/skills/agent-mobile-expert/SKILL.md` | Mobile (RN/Expo) |
| agent-monorepo-master | `.agent/skills/agent-monorepo-master/SKILL.md` | Monorepo/Turbo |
| agent-devops-cicd | `.agent/skills/agent-devops-cicd/SKILL.md` | DevOps/CI/CD |
| agent-notary | `.agent/skills/agent-notary/SKILL.md` | Документалист, отчеты |
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

- ✅ Фаза 1–5: Фундамент, Auth, Модель данных, REST API, Desktop UI
- ✅ Фаза 6: ServiceListing (объявления от исполнителей)
- ✅ Фаза 7: Чат и уведомления (Socket.io, Crypto, E2E)
- ❌ Фазы 8–12: Тесты, Mobile, Geo, Монетизация
- 🚀 Фаза 13: Социальный капитал и Trust-система (Neighborly Help)

## Критические правила

- **Коммуникация**: Объясняй решения и пиши комментарии на РУССКОМ.
- **Коммиты**: ТОЛЬКО на РУССКОМ языке. Должны быть максимально развернутыми, информативными и сгруппированными по смыслу внесенных изменений.
- **Чистота репозитория**: ПЕРЕД коммитом ОБЯЗАТЕЛЬНО проверять `git status` на наличие технического мусора (логи, временные файлы тестов, отчеты агентов). В коммит должен попадать только чистый код и необходимая документация.
- **No Spaghetti**: Если файл > 200 строк — предлагай рефакторинг. Разделяй логику на более мелкие, сфокусированные модули.
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
13. 📚 **Docs First**: Перед написанием кода ОБЯЗАТЕЛЬНО сверяйся с актуальной документацией через `context7`, `ref` или `search_web`, особенно при любых сомнениях.

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
