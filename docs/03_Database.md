# База данных: PostgreSQL + PostGIS + Prisma 7

## Инфраструктура
Для хранения данных используется PostgreSQL 16+ с расширением **PostGIS 3.4**.
Это позволяет:
1. Хранить точные географические координаты пользователей и заявок в типе `Point`.
2. Выполнять мгновенный поиск в радиусе («Найди мастеров в радиусе 1.2 км от этой точки»).
3. Работать с картами и гео-данными на уровне SQL-запросов.

## Prisma 7 ORM
Проект использует Prisma 7 (Driver Adapter) для взаимодействия с БД.

### Особенности конфигурации:
- **Prisma 7 Transition**: В Prisma 7 `url` БД больше не поддерживается в `schema.prisma`. Конфигурация вынесена в `prisma.config.ts`.
- **Driver Adapter (`pg`)**: Использование нативного драйвера `pg` для повышения производительности в Docker-контейнерах.
- **Unsupported Types**: Геометрия PostGIS подключена через `Unsupported("geometry(Point, 4326)")`.

### Схема данных (Основные сущности):
- **`User`**: telegramId, телефон, роль (`USER`, `MASTER`, `ADMIN`), локация (`location`).
- **`MasterProfile`**: био, верификация (`isVerified`), локальность (`isLocal`), рейтинг. Связь 1:1 с `User`.
- **`TaskRequest`**: заголовок, описание, изображения, статус (`OPEN`, `IN_PROGRESS`, `COMPLETED`, `CANCELED`), точка выполнения заказа (`taskLocation`).
- **`Category`**: Иерархия категорий услуг (Электрика, Сантехника, Уборка).
- **`Review`**: Отзывы заказчиков о мастерах (С авторством `Author` и привязкой к `MasterReviews`).

## SQL-логика для Гео-поиска
Поиск мастеров выполняется через нативный SQL (Prisma Query Raw) с использованием функций PostGIS:
```sql
SELECT id FROM "TaskRequest"
WHERE ST_DWithin(
  task_location, 
  ST_MakePoint(longitude, latitude)::geography, 
  radius_in_meters
);
```

## Текущий статус БД
- [x] Инициализирована схема с PostGIS расширением.
- [x] Реализованы миграции для типов `User`, `MasterProfile`, `Category`, `TaskRequest`.
- [x] Настроен сидинг категорий и тестовых профилей.
- [ ] Оптимизация пространственных индексов (`GIST`) для больших объемов данных.
