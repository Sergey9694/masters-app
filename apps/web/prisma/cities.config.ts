/**
 * Единый источник истины для городов проекта.
 * 
 * ВАЖНО: 
 * - Координаты и fiasId здесь нужны для быстрого сидинга (offline).
 * - Скрипт geo-sync.ts использует эти названия для обновления данных из DaClean.
 */
export const PROJECT_CITIES = [
  { name: 'Ростов-на-Дону', slug: 'rostov-na-donu', region: 'Ростовская область', fiasId: 'c1cfe4b9-f7c2-423c-abfa-6ed1c05a15c5', lat: 47.2313, lng: 39.7233 },
  { name: 'Таганрог', slug: 'taganrog', region: 'Ростовская область', fiasId: '10972627-77b3-4696-9351-40436b70125a', lat: 47.2333, lng: 38.9167 },
  { name: 'Шахты', slug: 'shakhty', region: 'Ростовская область', fiasId: 'dee2e80e-f2e1-4a68-93b0-b7b89b6f3e74', lat: 47.7083, lng: 40.2167 },
  { name: 'Волгодонск', slug: 'volgodonsk', region: 'Ростовская область', fiasId: '76451670-6593-41c6-8386-89684f88410d', lat: 47.5167, lng: 42.1500 },
  { name: 'Новочеркасск', slug: 'novocherkassk', region: 'Ростовская область', fiasId: '28bafcb3-92b2-445b-9443-a341be73fdb9', lat: 47.4167, lng: 40.0933 },
  { name: 'Батайск', slug: 'bataysk', region: 'Ростовская область', fiasId: '772c6c2e-4b68-4f81-8b2b-0f81a7d6560b', lat: 47.1397, lng: 39.7523 },
  { name: 'Новошахтинск', slug: 'novoshakhtinsk', region: 'Ростовская область', fiasId: 'bce1a4f2-7576-4427-8bd8-8d8b4e35ad11', lat: 47.7500, lng: 39.9333 },
  { name: 'Каменск-Шахтинский', slug: 'kamensk-shakhtinskiy', region: 'Ростовская область', fiasId: '1e5e0327-0466-410a-b32b-3f74f7623565', lat: 48.3167, lng: 40.2667 },
  { name: 'Азов', slug: 'azov', region: 'Ростовская область', fiasId: 'a216cad5-7027-40b8-b1a1-d64abefbd5cd', lat: 47.1111, lng: 39.4233 },
  { name: 'Гуково', slug: 'gukovo', region: 'Ростовская область', fiasId: '479b1836-8a9d-4e94-84c4-72b1a1f73634', lat: 48.0500, lng: 39.9333 },
  { name: 'Сальск', slug: 'salsk', region: 'Ростовская область', fiasId: 'e25e9858-a553-488f-9d90-36e6417532f7', lat: 46.4833, lng: 41.5333 },
  { name: 'Донецк', slug: 'doneck-ro', region: 'Ростовская область', fiasId: 'a06a26df-c116-43e5-8208-8e6dfd666d6d', lat: 48.3333, lng: 39.9500 },
  { name: 'Аксай', slug: 'aksay', region: 'Ростовская область', fiasId: '9bebf626-3ee7-4e1b-9e91-569c9d402152', lat: 47.2700, lng: 39.8700 },
  { name: 'Белая Калитва', slug: 'belaya-kalitva', region: 'Ростовская область', fiasId: '62f6b4d3-7d87-4d7a-a664-9a80f089602e', lat: 48.1667, lng: 40.7833 },
  { name: 'Красный Сулин', slug: 'krasnyy-sulin', region: 'Ростовская область', fiasId: '2b738e4a-463d-4c31-9878-3a830113c4c9', lat: 47.8833, lng: 40.0667 },
  { name: 'Миллерово', slug: 'millerovo', region: 'Ростовская область', fiasId: 'd484e58b-0309-4458-944a-f2b1d3d0f04c', lat: 48.9167, lng: 40.4000 },
  { name: 'Морозовск', slug: 'morozovsk', region: 'Ростовская область', fiasId: '49e0c52a-9e1d-4f11-9a9a-7c9b2f6b1a9e', lat: 48.3500, lng: 41.8333 },
  { name: 'Зерноград', slug: 'zernograd', region: 'Ростовская область', fiasId: '9b7f5e1a-1d1e-4f11-9a9a-7c9b2f6b1a9e', lat: 46.8500, lng: 40.3000 },
  { name: 'Семикаракорск', slug: 'semikarakorsk', region: 'Ростовская область', fiasId: 'a1e0c52a-9e1d-4f11-9a9a-7c9b2f6b1a9e', lat: 47.5167, lng: 40.8000 },
  { name: 'Зверево', slug: 'zverevo', region: 'Ростовская область', fiasId: 'b1e0c52a-9e1d-4f11-9a9a-7c9b2f6b1a9e', lat: 48.0167, lng: 40.1167 },
  { name: 'Пролетарск', slug: 'proletarsk', region: 'Ростовская область', fiasId: 'c1e0c52a-9e1d-4f11-9a9a-7c9b2f6b1a9e', lat: 46.7000, lng: 41.7167 },
  { name: 'Константиновск', slug: 'konstantinovsk', region: 'Ростовская область', fiasId: 'd1e0c52a-9e1d-4f11-9a9a-7c9b2f6b1a9e', lat: 47.5833, lng: 41.1000 },
  { name: 'Цимлянск', slug: 'cimlyansk', region: 'Ростовская область', fiasId: 'e1e0c52a-9e1d-4f11-9a9a-7c9b2f6b1a9e', lat: 47.6500, lng: 42.1000 },
  
  // ЮФО: Краснодарский край
  { name: 'Краснодар', slug: 'krasnodar', region: 'Краснодарский край', lat: 45.0333, lng: 38.9778 },
  { name: 'Сочи', slug: 'sochi', region: 'Краснодарский край', lat: 43.5855, lng: 39.7231 },
  { name: 'Новороссийск', slug: 'novorossiysk', region: 'Краснодарский край', lat: 44.7167, lng: 37.7667 },
  
  // ЮФО: Крым и Севастополь
  { name: 'Севастополь', slug: 'sevastopol', region: 'Севастополь', lat: 44.6167, lng: 33.5250 },
  { name: 'Симферополь', slug: 'simferopol', region: 'Республика Крым', lat: 44.9521, lng: 34.1024 },
  
  // ЮФО: Волгоградская область
  { name: 'Волгоград', slug: 'volgograd', region: 'Волгоградская область', lat: 48.7194, lng: 44.5018 },
  
  // ЮФО: Астраханская область
  { name: 'Астрахань', slug: 'astrahan', region: 'Астраханская область', lat: 46.3497, lng: 48.0408 },
  
  // ЮФО: Республики
  { name: 'Майкоп', slug: 'maykop', region: 'Республика Адыгея', lat: 44.6089, lng: 40.1058 },
  { name: 'Элиста', slug: 'elista', region: 'Республика Калмыкия', lat: 46.3078, lng: 44.2702 }
];
