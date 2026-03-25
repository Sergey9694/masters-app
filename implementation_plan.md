# Мастер-план реализации: Гиперлокальный маркетплейс «Районный Мастер»

> [!IMPORTANT]
> **Статус**: Основной документ разработки (Source of Truth).
> **Архитектор**: Senior Full Stack Architect (Antigravity).
> **Стандарт**: Enterprise Grade, Next.js 16+, Feature-Sliced Design.

---

## 1. Концепция и Бизнес-логика

### 1.1 Основная идея
Создание доверенной среды для решения бытовых задач внутри нескольких микрорайонов (радиус 15 минут). Мы побеждаем гигантов (Profi, YouDo) за счет **соседского доверия**, **скорости прибытия** и **отсутствия лишних комиссий**.

### 1.2 Монетизация
- **SaaS для мастеров**: Подписка за доступ к заказам в районе (например, 500-1000 руб/мес).
- **Premium Верификация**: Разовая оплата за ручную проверку документов и статус «Проверенный сосед».
- **Рекламный приоритет**: Поднятие анкеты мастера в топ внутри категории на неделю.

### 1.3 Глобальная цель разработки
Проект должен быть **универсальной заготовкой**. Вся логика (авторизация, стили, гео-поиск) выносится в переиспользуемые модули, чтобы сервис можно было быстро развернуть для любого другого района или даже другой ниши.

---

## 2. Технологический стек (Meta Stack 2026)

| Слой | Технология | Описание |
| :--- | :--- | :--- |
| **Ядро** | **Next.js 16 (App Router)** | Использование React Compiler, Server Components (RSC) и Server Actions. |
| **Интерфейс** | **Telegram Web App (TWA)** | Единая точка входа. Весь функционал доступен прямо внутри мессенджера через SDK. |
| **Архитектура** | **FSD (Feature-Sliced Design)** | Разделение на `shared`, `entities`, `features`, `widgets`, `app`. |
| **База данных** | **PostgreSQL + PostGIS** | Географическое расширение для поиска в радиусе и по координатам. |
| **ORM** | **Prisma** | Типизированная работа с БД с поддержкой нативных PostGIS запросов. |
| **Стили** | **Tailwind CSS 4 + Shadcn UI** | Дизайн-система на CSS-переменных для мгновенного ребрендинга. |
| **Анимации** | **Motion (бывший Framer)** | Layout-анимации, жесты и плавные переходы между экранами. |
| **Безопасность** | **JWT + Cookies (httpOnly)** | Защита сессий, Zero-Trust валидация через Zod. |

---

## 3. Архитектура данных (Prisma + PostGIS)

Мы используем `Unsupported("geometry(Point, 4326)")` для хранения точных координат.

```prisma
// Основные сущности
enum Role { USER; MASTER; ADMIN }
enum TaskStatus { OPEN; IN_PROGRESS; COMPLETED; CANCELED }

model User {
  id            String    @id @default(uuid())
  telegramId    BigInt?   @unique
  phone         String    @unique
  role          Role      @default(USER)
  firstName     String
  lastName      String?
  avatar        String?
  
  // Гео-точка пользователя (дом/работа)
  location      Unsupported("geometry(Point, 4326)")? 

  masterProfile MasterProfile?
  tasksCreated  TaskRequest[]
  reviewsLeft   Review[]      @relation("Author")
  
  createdAt     DateTime      @default(now())
}

model MasterProfile {
  id          String   @id @default(cuid())
  userId      String   @unique
  user        User     @relation(fields: [userId], references: [id])
  bio         String?
  
  categories  MasterCategory[]
  
  isVerified  Boolean  @default(false) // Ручная верификация админом
  isLocal     Boolean  @default(false) // Проверка на проживание в районе
  rating      Float    @default(5.0)
  
  responses   TaskResponse[]
  reviews     Review[] @relation("MasterReviews")
}

model TaskRequest {
  id          String   @id @default(cuid())
  customerId  String
  customer    User     @relation(fields: [customerId], references: [id])
  
  categoryId  String
  category    Category @relation(fields: [categoryId], references: [id])
  
  title       String
  description String
  images      String[]
  status      TaskStatus @default(OPEN)
  
  // Где именно нужна услуга (гео-точка)
  taskLocation Unsupported("geometry(Point, 4326)")?
  
  responses   TaskResponse[]
  createdAt   DateTime @default(now())
}
```

---

## 4. Пользовательские сценарии (Hybrid UX)

### Сценарий А: «Биржа» (Тендер)
1. **Заказчик**: Выбирает категорию (например, «Электрик») -> Описывает проблему -> Фоткает искрящую розетку.
2. **Система**: С помощью PostGIS находит всех Мастеров в этой категории в радиусе 10-15 минут.
3. **Telegram Bot**: Рассылает мастерам уведомление с кнопкой «Посмотреть заказ».
4. **Мастер**: Видит детали и пишет отклик: «Буду через 20 мин, цена 1500р».
5. **Заказчик**: Выбирает лучшего по отзывам и цене.

### Сценарий Б: «Каталог» (Прямой наем)
1. **Заказчик**: Заходит в раздел «Сантехники».
2. **Приложение**: Показывает список, где в топе — **Проверенные и Местные** специалисты.
3. **Заказчик**: Изучает видео-визитку и отзывы, нажимает кнопку «Предложить задачу».

---

## 5. Протоколы безопасности и качества

1. **Zero-Trust Validation**: Все входные данные (`params`, `searchParams`, `body`) проходят через парсинг **Zod**.
2. **Безопасность сессий**:
    - Валидация `initData` от Telegram на стороне сервера.
    - Хранение токенов **ТОЛЬКО** в `httpOnly`, `Secure`, `SameSite=Lax` cookies. `localStorage` запрещен.
3. **DAL (Data Access Layer)**: Вся логика доступа к БД вынесена в защищенные функции, которые проверяют права пользователя (`Role`) перед выполнением запроса.
4. **Proxy Layer**: Файл [src/proxy.ts](file:///c:/Users/drobi/Desktop/projects/antigraviti/fin-you-app/src/proxy.ts) управляет доступом к защищенным маршрутам (`/admin`, `/dashboard`).

---

## 6. План разработки по фазам (Roadmap)

### Фаза 1: Фундамент (Неделя 1) — ВЫПОЛНЕНО ✅
- [x] Инициализация проекта: `npx create-next-app` + FSD Folders.
- [x] Настройка Docker: Postgres + PostGIS + Nginx Proxy.
- [x] Prisma: Миграции базы данных и настройка пространственных типов (Prisma 7 + Driver Adapter).
- [x] Auth: Реализация Telegram Login (валидация подписи) + JWT Session.

### Фаза 2: Механика Заказов (Неделя 2) — В ПРОЦЕССЕ 🌓
- [x] Shared UI: Настройка Tailwind 4 и Shadcn компонентов.
- [ ] Features: Создание задачи (upload фото в S3/Local + Zod).
- [x] Entities: Профили мастеров и логика категорий (Seeding + Grid Widget).
- [ ] Geo-Logic: Написание SQL-функций для поиска в радиусе (ST_DWithin).

### Фаза 3: Telegram & Реальное время (Неделя 3)
- [ ] TWA SDK: Синхронизация цветов, Haptic Feedback, MainButton.
- [ ] Notifications: Интеграция с Telegram Bot API для рассылки заказов.
- [ ] Master UI: Лента заказов и форма отклика.

### Фаза 4: Админка и Полировка (Неделя 4)
- [ ] Admin Portal: Интерфейс для ручного аппрува мастеров (`isVerified`).
- [ ] UX: Анимации на Motion, скелетоны (Skeleton UI) при загрузке.
- [ ] CI/CD: Настройка GitHub Actions для автоматического деплоя на сервер.

---

## 7. Стратегия CI/CD и Docker
- **Docker**: Многоэтапная сборка (Multi-stage build) на базе Alpine для минимизации размера образа.
- **CI/CD**:
    - Ветка `develop`: Авто-деплой на Stage.
    - Ветка `main`: Деплой на Prod после прохождения тестов (Vitest/Playwright).
- **Secrets**: Все ключи (TG_BOT_TOKEN, DB_URL) хранятся в защищенных переменных окружения, никогда не попадая в Git.

---

## 8. Глобальные стили и переиспользуемость
- Все цвета и шрифты задаются через **CSS Variables** в `src/app/globals.css`.
- Дизайн-токены соответствуют Shadcn v4, что позволяет сменить тему всего приложения за 30 секунд.
- Общие компоненты (Авторизация, Загрузка файлов) пишутся как абстрактные модули, готовые к копированию в другие проекты.
