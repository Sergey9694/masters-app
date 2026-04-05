# Статус проекта и Дорожная карта (Roadmap)

## Текущий статус разработки (Фаза 2.1)
Проект выполнен примерно на 35-40%. Заложен прочный архитектурный фундамент и реализованы базовые сценарии.

| Фича | Слой (FSD) | Статус | Комментарий |
| :--- | :--- | :--- | :--- |
| **Auth: Telegram Login** | `features/auth` | ✅ | Валидация initData + JWT в Cookies. |
| **Entities: User Profile** | `entities/user` | ✅ | Модель, API для получения профиля. |
| **Entities: Master Profile**| `entities/user` | ✅ | Глубокая интеграция с User. |
| **Shared UI: Design Sys** | `shared/ui` | ✅ | Базовые компоненты Shadcn + Tailwind 4. |
| **Feature: Task Creation** | `features/task-creation` | ✅ | Server Action + Премиум-форма (Apple Style). |
| **Widget: Category Grid** | `widgets/CategoryGrid` | ✅ | Выбор категории для заказчика. |
| **Widget: Task Feed** | `widgets/TaskFeed` | 🛠 | В процессе: Рендер списка задач (базовый). |
| **Feature: Geo Search** | `features/geo-search` | 🛠 | В процессе: SQL ST_DWithin поиск. |
| **S3 Photo Upload** | `features/task-creation` | ❌ | Запланировано (Фаза 2.2). |
| **TWA SDK Integration** | `app/providers` | 🛠 | Haptic Feedback и MainButton (начальная стадия). |
| **Notifications (TG Bot)**| `shared/api/tg-bot` | ❌ | Запланировано (Фаза 3). |
| **Admin Portal** | `app/admin` | ❌ | Запланировано (Фаза 4). |

---

## План по фазам (Roadmap)

### Фаза 1: Фундамент (ВЫПОЛНЕНО ✅)
- [x] Настройка Docker стека (Postgres + PostGIS + Nginx).
- [x] Инициализация Next.js 16 + FSD.
- [x] Настройка Prisma 7 и Driver Adapter.
- [x] Авторизация через Telegram.

### Фаза 2: Механика заказов (ТЕКУЩАЯ 🛠)
- [x] Форма создания задания (Тендер).
- [x] Схема Zod и Server Action для сохранения в БД.
- [ ] Загрузка изображений (локально или S3).
- [ ] Отрисовка ленты заказов (Feed) для мастеров.
- [ ] Реализация гиперлокального поиска (Geo-logic).

### Фаза 3: Telegram UX & Real-time (Будущее 🚀)
- [ ] Синхронизация цветовой схемы TWA.
- [ ] Интеграция Haptic Feedback и MainButton.
- [ ] Рассылка уведомлений мастерам через Telegram Bot.

### Фаза 4: Админка, SEO и Полировка
- [ ] Панель управления (Admin Portal) для аппрува мастеров.
- [ ] Motion-анимации, переходы между экранами.
- [ ] Оптимизация SEO (Мета-теги, иконки).
- [ ] Настройка CI/CD (GitHub Actions).
