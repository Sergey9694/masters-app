/**
 * Единый источник истины для городов проекта.
 * 
 * ВАЖНО: 
 * - Координаты и fiasId здесь нужны для быстрого сидинга (offline).
 * - Скрипт geo-sync.ts использует эти названия для обновления данных из DaData.
 */
export const PROJECT_CITIES = [
  { 
    name: 'Ростов-на-Дону', 
    slug: 'rostov-na-donu', 
    region: 'Ростовская область', 
    fiasId: 'c1cfe4b9-f7c2-423c-abfa-6ed1c05a15c5', 
    lat: 47.2313, 
    lng: 39.7233 
  },
  { 
    name: 'Аксай', 
    slug: 'aksay', 
    region: 'Ростовская область', 
    fiasId: '9bebf626-3ee7-4e1b-9e91-569c9d402152', 
    lat: 47.2700, 
    lng: 39.8700 
  },
  { 
    name: 'Новочеркасск', 
    slug: 'novocherkassk', 
    region: 'Ростовская область', 
    fiasId: '28bafcb3-92b2-445b-9443-a341be73fdb9', 
    lat: 47.4167, 
    lng: 40.0933 
  },
  { 
    name: 'Азов', 
    slug: 'azov', 
    region: 'Ростовская область', 
    fiasId: 'a216cad5-7027-40b8-b1a1-d64abefbd5cd', 
    lat: 47.1111, 
    lng: 39.4233 
  },
  { 
    name: 'Шахты', 
    slug: 'shakhty', 
    region: 'Ростовская область', 
    fiasId: 'dee2e80e-f2e1-4a68-93b0-b7b89b6f3e74', 
    lat: 47.7083, 
    lng: 40.2167 
  },
  { 
    name: 'Новошахтинск', 
    slug: 'novoshakhtinsk', 
    region: 'Ростовская область', 
    fiasId: 'bce1a4f2-7576-4427-8bd8-8d8b4e35ad11', 
    lat: 47.7500, 
    lng: 39.9333 
  },
  { 
    name: 'Батайск', 
    slug: 'bataysk', 
    region: 'Ростовская область', 
    fiasId: '772c6c2e-4b68-4f81-8b2b-0f81a7d6560b', 
    lat: 47.1397, 
    lng: 39.7523 
  }
];
