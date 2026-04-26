---
name: docker-expert
description: Advanced Docker and containerization patterns for production-ready deployments, including multi-stage builds and security hardening.
---

# Docker & Containerization Expertise

Профессиональная работа с контейнерами и CI/CD.

## Принципы
1. **Multi-stage Builds:** Уменьшай размер образа, отделяя билд от рантайма.
2. **Security:** Запускай процессы от non-root пользователя. Используй `read-only` файловые системы где возможно.
3. **Environment Management:** Строгое разделение Build-time и Run-time переменных.
4. **Healthchecks:** Всегда добавляй `HEALTHCHECK` в Dockerfile для корректной работы оркестрации.

## Оптимизация
- Кэширование слоев (npm install).
- Использование легковесных базовых образов (Alpine/Slim).
- Логирование в `stdout`/`stderr` в формате JSON.

## Правила проекта
- `ENV key="value"` (новый синтаксис, не `ENV key value`)
- Секреты — runtime env vars, НЕ build args
- `X-Forwarded-For`, `X-Forwarded-Proto`, `X-Real-IP` — пробрасывать через Nginx в `proxy.ts`
