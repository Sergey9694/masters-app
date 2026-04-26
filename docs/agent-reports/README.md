# Agent Reports

Здесь хранятся отчёты мультиагентной системы разработки.

## Агенты

| Агент | Роль | Вызов |
|-------|------|-------|
| 🎯 Orchestrator | Координация и сводные отчёты | `@agent-orchestrator` |
| 🏗️ Architect | FSD, структура, зависимости | `@agent-architect` |
| 🔒 Security | Уязвимости, PII, rate-limits | `@agent-security` |
| 📈 SEO | Метаданные, robots, sitemap | `@agent-seo` |
| ⚙️ Code Quality | Типизация, DRY, мёртвый код | `@agent-code-quality` |
| 🧪 QA | E2E тесты, a11y, edge-cases | `@agent-qa` |
| ⚡ Performance | N+1, бандл, кэширование | `@agent-performance` |

## Формат имени файла

```
[agent-name]-[YYYY-MM-DD].md
```

Пример: `security-2026-04-26.md`
