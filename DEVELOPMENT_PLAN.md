# План разработки UslugiRyadom (Мобильное Web-приложение)

## Текущий статус: Фаза 2 ЗАВЕРШЕНА 🚀

---

## Фаза 1 — Foundation & Core UI (Завершена)
[x] 1.1 — Настройка Next.js & Tailwind CSS
[x] 1.2 — Prisma & PostgreSQL Schema (Base)
[x] 1.3 — Метаданные и брендинг (UslugiRyadom)

---

## Фаза 2 — Auth & Security System (Завершена)

### 2.1 — Миграция на Auth.js (v5)
[x] 2.1.1  Интеграция Auth.js и PrismaAdapter
[x] 2.1.2  Обновление модели данных (User, Account, Session)
[x] 2.1.3  Безопасные сессии и Proxy (JWT + HttpOnly)
[x] 2.1.4  Safe Actions (Security Layer) — Базовая настройка
[x] 2.1.5  Рефакторинг всех экшенов (`proposal`, `moderate-order`, `review`, `auth`) на `safe-action`.

### 2.2 — Унифицированная авторизация (Multi-provider)
[x] 2.2.1  Настройка провайдеров: Telegram, Google, Email (Password).
[x] 2.2.2  Создание премиальной (Glassmorphic) страницы входа `/auth/login`.
[x] 2.2.3  Логика регистрации и флоу восстановления пароля (Audit Logged).
[x] 2.2.4  Mock Provider для удобной разработки и тестирования админки.

### 2.3 — RBAC & Security Hardening
[x] 2.3.1  Audit Logs: Логгирование критических действий в БД.
[x] 2.3.2  Ownership Check: Централизованная утилита `assertOwnership` в DAL.
[x] 2.3.3  Глобальная блокировка: Проверка `isBanned` на уровне `authActionClient`.
[x] 2.3.4  Rate Limiting: Защита чувствительных экшенов от перебора.

---

## Фаза 3 — Geo & Search Optimization (В планах)
3.1 — Интеграция PostGIS для поиска мастеров рядом.
3.2 — Оптимизация ленты (Server-side Pagination).
3.3 — Фильтры по категориям и радиусу.

---

## Технические детали Фазы 2
- **Auth.js:** Используется бета-версия v5 с поддержкой App Router.
- **Safe Actions:** Использование `next-safe-action` v8 для типизации и безопасности.
- **Security:** Все пароли хешируются `bcryptjs`. Сессии защищены `httpOnly` куками.
- **Logs:** Каждое действие администратора или смена статуса заказа оставляет след в таблице `AuditLog`.
