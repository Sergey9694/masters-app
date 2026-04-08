# Статус проекта и Дорожная карта (Roadmap)

## Текущий статус разработки (Фаза 2.2)
Проект выполнен примерно на 45-50%. Завершены ключевые работы по интерфейсу заказов и интеграции с картами.

| Фича | Слой (FSD) | Статус | Комментарий |
| :--- | :--- | :--- | :--- |
| **Auth: Telegram Login** | `features/auth` | ✅ | Валидация initData + JWT в Cookies. |
| **Entities: User Profile** | `entities/user` | ✅ | Модель, API для получения профиля. |
| **Entities: Master Profile**| `entities/user` | ✅ | Глубокая интеграция с User. |
| **Shared UI: Design Sys** | `shared/ui` | ✅ | Базовые компоненты Shadcn + Tailwind 4. |
| **Feature: Task Creation** | `features/task-creation` | ✅ | Server Action + Премиум-форма (Apple Style). |
| **Widget: Category Grid** | `widgets/CategoryGrid` | ✅ | Премиум сетка с неоновыми бордерами. |
| **Widget: Task Feed** | `widgets/TaskFeed` | ✅ | Полный цикл: список, пагинация, фильтрация. |
| **Feature: Maps Integration**| `shared/lib/maps` | ✅ | Интеграция с Яндекс Картами (клик по адресу). |
| **TWA SDK Integration** | `app/providers` | ✅ | Haptic Feedback, MainButton, BackButton. |
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
