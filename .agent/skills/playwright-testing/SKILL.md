---
name: playwright-testing
description: Standards and patterns for E2E and component testing using Playwright. Ensuring application stability through automation.
---

# Playwright Testing Standards

Навык написания надежных автоматизированных тестов.

## Стратегия
1. **User-Centric Testing:** Тестируй поведение, а не реализацию (используй `getByRole`, `getByText`).
2. **Isolation:** Каждый тест должен быть независимым. Используй `beforeEach` для сброса состояния БД.
3. **Wait Strategies:** Никогда не используй `waitForTimeout`. Используй встроенные авто-ожидания Playwright.

## Типы тестов
- **Smoke Tests:** Проверка критических путей (Login, Dashboard).
- **Regression Tests:** Покрытие найденных багов.
- **Visual Testing:** Сравнение скриншотов для сложных UI элементов.
