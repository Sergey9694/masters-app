---
name: postgresql-optimization
description: Advanced database design, query optimization, and performance tuning for PostgreSQL in enterprise applications.
---

# PostgreSQL Optimizer & Architecture

Глубокие знания по проектированию, оптимизации и тюнингу производительности БД.

## Правила Оптимизации
1. **Index Strategy:** Всегда проверяй `EXPLAIN (ANALYZE, BUFFERS)`. Используй Partial, Expression и Covering индексы для сложных выборок.
2. **Query Tuning:** Избегай подзапросов в `SELECT`, используй CTE или `JOIN`. Следи за "Cartesian Product" и правильно настраивай условия фильтрации.
3. **Schema Design:** Используй правильные типы данных. Для больших текстовых данных — `text`, для денег — `numeric` или `integer` (в центах).
4. **JSONB Optimization:** Используй GIN индексы (`jsonb_path_ops`) для молниеносного поиска по вложенным объектам.
5. **Connection Management:** Настройка пула соединений (PgBouncer) и анализ долгоживущих транзакций.

## Performance Audit
- Поиск "Bloat" в таблицах и индексах.
- Анализ `pg_stat_statements` для нахождения самых тяжелых запросов.
- Тюнинг параметров `shared_buffers`, `work_mem` и `maintenance_work_mem`.
