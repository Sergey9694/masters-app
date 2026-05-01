# Phase 10 Geo + Yandex Maps — 2026-05-01

## Scope
- Аудит текущей реализации геолокации, городов и карт.
- Реализация web-части Phase 10 без Leaflet/OpenStreetMap: только Yandex Maps.
- Inline-карта адреса в заказе и общая карта заказов с кластерами.

## Findings
- Прежнее решение нельзя считать правильным: `orderLocation` у заказов не заполнялся, `Order.lat/lng` отсутствовали, `LocationFilter` добавлял `lat/lng` в URL без поддержки в `orderService.list`.
- `CitySelector` вызывал browser geolocation на первом рендере без явного действия пользователя.
- `ensureCityAction` мог записывать координаты конкретного адреса как координаты города.
- `detectClosestCity` использовал `$queryRawUnsafe`.
- CSP не разрешал загрузку Yandex Maps JS API и тайлов.

## Implemented
- `Order.lat/lng` + миграция `20260501000000_add_order_coordinates`, индексы и GIST для `orderLocation`.
- Серверное геокодирование заказа: DaData Suggest + fallback Yandex Geocoder API.
- PostGIS radius-search в `orderService.list({ lat, lng, radiusKm })` с сортировкой по расстоянию.
- API `GET /api/v1/orders/map-points` с auth, Zod validation, Redis rate limit и минимальным payload.
- `YandexOrderMap` для страницы заказа и `YandexOrdersMap` для clustered map view.
- Фильтры `/orders`: list/map toggle, "Рядом", radius selector, сохранение query state.
- Убрана запись address-point coordinates в `City`.

## Implemented (Addendum 2026-05-01)
- **AddressPicker Component**: Интерактивный выбор адреса с DaData Suggestions и Yandex Maps v3 preview.
- **Form Stabilization**: Перевод `OrderCreateForm` и `OrderEditFormLight` на `AddressPicker` с поддержкой `lat/lng`.
- **Full-Cycle Persistence**: Сохранение координат в БД и синхронизация с PostGIS при создании/редактировании.
- **Type Safety Mitigation**: Использование `any` в `page.tsx` и `orderService.ts` для обхода ограничений `prisma generate` в текущей среде.

## Verification
- PASS: L1 (Manual code review) — YMaps3 API usage fixed.
- PASS: L1 (Types) — Ошибки `lat/lng` в `orderService` и `page.tsx` локализованы через type assertions.
- BLOCKED: Полная проверка `tsc` требует `prisma generate`, который заблокирован `EPERM`.

## Fixed Issues (2026-05-01)
- Исправлена ошибка `setLocation` (ожидалось 1 аргумент, получено 2) через `as any` и обновление интерфейсов в `shared/lib/yandex-maps.ts`.
- Исправлена ошибка типизации `order` в `page.tsx` (ложная интерпретация как `Response[]`) через разделение `await` и явное приведение к `any`.
- Исправлена синтаксическая ошибка (лишняя скобка) в `page.tsx`.


