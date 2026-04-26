# Agent Reports

Здесь хранятся отчёты мультиагентной системы разработки.

## Общий протокол

**Каждый агент** обязан следовать общему протоколу: `.agent/skills/agent-protocol/SKILL.md`

Ключевые правила:
- 💰 **Экономь токены** — читай только нужные части файлов
- 🗄️ **БД только через миграции** — `prisma migrate dev --name <name>`
- 🏆 **Всегда рекомендуй лучший вариант** — объясняй почему
- 🛑 **Сначала думай, потом пиши код** (Pre-flight checklist)
- 📝 **Обновляй `docs/PROJECT_STATE.md`** после каждой задачи

## Агенты

| Скилл | Роль |
|-------|------|
| 📋 `agent-protocol` | Общие правила — **читать первым** |
| 🎯 `agent-orchestrator` | Координация, декомпозиция задач |
| 🏗️ `agent-architect` | FSD, структура, рефакторинг |
| 🔒 `agent-security` | Уязвимости, PII, rate-limits |
| 📈 `agent-seo` | Метаданные, robots, sitemap |
| ⚙️ `agent-code-quality` | Типизация, DRY, мёртвый код |
| 🧪 `agent-qa` | E2E тесты, a11y, edge-cases |
| ⚡ `agent-performance` | N+1, бандл, кэширование |
| 🐳 `docker-expert` | Docker, CI/CD |
| 🎨 `figma-to-code-mastery` | Figma → код |
| 📐 `karpathy-guidelines` | Принципы написания кода |
| 🎭 `playwright-testing` | E2E стандарты |
| 🐘 `postgresql-optimization` | Оптимизация БД |
| 🚨 `sentry-expert` | Мониторинг ошибок |
| 🧩 `shadcn-ui-mastery` | Shadcn UI компоненты |

## Формат имени файла отчёта

```
[agent-name]-[YYYY-MM-DD].md
```

Пример: `security-2026-04-26.md`
