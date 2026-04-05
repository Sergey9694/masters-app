# Архитектура и Технологический стек

## Базовый стек (2026 Meta Stack)
- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/) с использованием React Compiler и Server Actions.
- **Интерфейс**: [Telegram Web App (TWA) SDK](https://github.com/twa-dev/sdk) – интеграция с мобильной средой Telegram.
- **Стили**: [Tailwind CSS 4](https://tailwindcss.com/) + [Shadcn UI](https://ui.shadcn.com/) (дизайн на CSS-переменных).
- **Анимации**: [Motion (ранее Framer Motion)](https://motion.dev/) – layout-анимации, жесты и скелетоны.
- **Типизация**: TypeScript (Strict Mode).
- **Валидация**: [Zod](https://zod.dev/) – Zero-Trust валидация всех данных.

## Архитектура: Feature-Sliced Design (FSD)
Проект организован по современному стандарту FSD для Next.js Enterprise приложений:

- **`src/app/`**: Роутинг, провайдеры, глобальные стили (`globals.css`). Минимум логики, только композиция.
- **`src/widgets/`**: Крупные блоки интерфейса (например, `TaskFeed`, `CategoryGrid`). Самодостаточные секции страниц.
- **`src/features/`**: Пользовательские сценарии (например, `auth`, `task-creation`, `geo-search`). Реализуют бизнес-логику и мутации (Server Actions).
- **`src/entities/`**: Бизнес-сущности (`user`, `task`). Хранят модель данных, API доступа к БД и базовые UI-компоненты сущности (карточки, аватары).
- **`src/shared/`**: Переиспользуемые примитивы.
  - `ui/`: Базовые компоненты Shadcn (Button, Input, Card).
  - `lib/`: Утилиты (auth, prisma, utils).
  - `api/`: Конфиги API.

## Безопасность (Security Protocols)
1. **Zero Trust Validation**: Все данные из `params`, `searchParams` и `body` парсятся через Zod-схемы на сервере.
2. **Session Persistence**: JWT хранятся исключительно в `httpOnly`, `Secure`, `SameSite=Lax` cookies. `localStorage` запрещен во избежание XSS.
3. **Authentication**: Валидация подписи `initData` от Telegram на стороне сервера (HMAC-SHA256).
4. **Proxy Layer**: Централизованное управление доступом в `src/proxy.ts` (замена middleware).
5. **Database Protection**: Использование селективного `select` в Prisma, чтобы не передавать на клиент чувствительные поля (хеши, PII).
6. **Docker Health Check**: Специальный маршрут `/api/health` для мониторинга состояния контейнеров.
