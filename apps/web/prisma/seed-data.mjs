/**
 * Единый источник данных для сидинга (Cities & Categories)
 * Используется и в seed.ts (TS), и в seed.mjs (ESM/Production)
 */

export const PROJECT_CITIES = [
  // --- РОСТОВСКАЯ ОБЛАСТЬ ---
  { name: 'Ростов-на-Дону', slug: 'rostov-na-donu', region: 'Ростовская область', lat: 47.2313, lng: 39.7233 },
  { name: 'Таганрог', slug: 'taganrog', region: 'Ростовская область', lat: 47.2333, lng: 38.9167 },
  { name: 'Шахты', slug: 'shakhty', region: 'Ростовская область', lat: 47.7083, lng: 40.2167 },
  { name: 'Волгодонск', slug: 'volgodonsk', region: 'Ростовская область', lat: 47.5167, lng: 42.1500 },
  { name: 'Новочеркасск', slug: 'novocherkassk', region: 'Ростовская область', lat: 47.4167, lng: 40.0933 },
  { name: 'Батайск', slug: 'bataysk', region: 'Ростовская область', lat: 47.1397, lng: 39.7523 },
  { name: 'Новошахтинск', slug: 'novoshakhtinsk', region: 'Ростовская область', lat: 47.7500, lng: 39.9333 },
  { name: 'Каменск-Шахтинский', slug: 'kamensk-shakhtinskiy', region: 'Ростовская область', lat: 48.3167, lng: 40.2667 },
  { name: 'Азов', slug: 'azov', region: 'Ростовская область', lat: 47.1111, lng: 39.4233 },
  { name: 'Гуково', slug: 'gukovo', region: 'Ростовская область', lat: 48.0500, lng: 39.9333 },
  { name: 'Сальск', slug: 'salsk', region: 'Ростовская область', lat: 46.4833, lng: 41.5333 },
  { name: 'Донецк (РФ)', slug: 'doneck-ro', region: 'Ростовская область', lat: 48.3333, lng: 39.9500 },
  { name: 'Аксай', slug: 'aksay', region: 'Ростовская область', lat: 47.2700, lng: 39.8700 },
  { name: 'Белая Калитва', slug: 'belaya-kalitva', region: 'Ростовская область', lat: 48.1667, lng: 40.7833 },
  { name: 'Красный Сулин', slug: 'krasnyy-sulin', region: 'Ростовская область', lat: 47.8833, lng: 40.0667 },
  { name: 'Миллерово', slug: 'millerovo', region: 'Ростовская область', lat: 48.9167, lng: 40.4000 },
  { name: 'Морозовск', slug: 'morozovsk', region: 'Ростовская область', lat: 48.3500, lng: 41.8333 },
  { name: 'Зерноград', slug: 'zernograd', region: 'Ростовская область', lat: 46.8500, lng: 40.3000 },
  { name: 'Семикаракорск', slug: 'semikarakorsk', region: 'Ростовская область', lat: 47.5167, lng: 40.8000 },

  // --- КРАСНОДАРСКИЙ КРАЙ ---
  { name: 'Краснодар', slug: 'krasnodar', region: 'Краснодарский край', lat: 45.0333, lng: 38.9778 },
  { name: 'Сочи', slug: 'sochi', region: 'Краснодарский край', lat: 43.5855, lng: 39.7231 },
  { name: 'Новороссийск', slug: 'novossiysk', region: 'Краснодарский край', lat: 44.7167, lng: 37.7667 },
  { name: 'Армавир', slug: 'armavir', region: 'Краснодарский край', lat: 44.9819, lng: 41.1234 },
  { name: 'Анапа', slug: 'anapa', region: 'Краснодарский край', lat: 44.8947, lng: 37.3161 },
  { name: 'Геленджик', slug: 'gelendzhik', region: 'Краснодарский край', lat: 44.5611, lng: 38.0772 },
  { name: 'Ейск', slug: 'eysk', region: 'Краснодарский край', lat: 46.7129, lng: 38.2741 },
  { name: 'Кропоткин', slug: 'kropotkin', region: 'Краснодарский край', lat: 45.4375, lng: 40.5736 },
  { name: 'Славянск-на-Кубани', slug: 'slavyansk-na-kubani', region: 'Краснодарский край', lat: 45.2592, lng: 38.1250 },
  { name: 'Туапсе', slug: 'tuapse', region: 'Краснодарский край', lat: 44.1029, lng: 39.0728 },

  // --- СТАВРОПОЛЬСКИЙ КРАЙ ---
  { name: 'Ставрополь', slug: 'stavropol', region: 'Ставропольский край', lat: 45.0433, lng: 41.9691 },
  { name: 'Пятигорск', slug: 'pyatigorsk', region: 'Ставропольский край', lat: 44.0486, lng: 43.0594 },
  { name: 'Кисловодск', slug: 'kislovodsk', region: 'Ставропольский край', lat: 43.9133, lng: 42.7208 },
  { name: 'Невинномысск', slug: 'nevinnomyssk', region: 'Ставропольский край', lat: 44.6325, lng: 41.9442 },
  { name: 'Ессентуки', slug: 'essentuki', region: 'Ставропольский край', lat: 44.0389, lng: 42.8642 },
  { name: 'Минеральные Воды', slug: 'mineralnye-vody', region: 'Ставропольский край', lat: 44.2103, lng: 43.1353 },

  // --- КРЫМ И СЕВАСТОПОЛЬ ---
  { name: 'Севастополь', slug: 'sevastopol', region: 'Севастополь', lat: 44.6167, lng: 33.5250 },
  { name: 'Симферополь', slug: 'simferopol', region: 'Республика Крым', lat: 44.9521, lng: 34.1024 },
  { name: 'Керчь', slug: 'kerch', region: 'Республика Крым', lat: 45.3562, lng: 36.4674 },
  { name: 'Евпатория', slug: 'evpatoriya', region: 'Республика Крым', lat: 45.1939, lng: 33.3681 },
  { name: 'Ялта', slug: 'yalta', region: 'Республика Крым', lat: 44.4952, lng: 34.1663 },
  { name: 'Феодосия', slug: 'feodosiya', region: 'Республика Крым', lat: 45.0317, lng: 35.3822 },

  // --- ДРУГИЕ РЕГИОНЫ ЮФО ---
  { name: 'Волгоград', slug: 'volgograd', region: 'Волгоградская область', lat: 48.7194, lng: 44.5018 },
  { name: 'Волжский', slug: 'volzhskiy', region: 'Волгоградская область', lat: 48.7847, lng: 44.7722 },
  { name: 'Астрахань', slug: 'astrakhan', region: 'Астраханская область', lat: 46.3497, lng: 48.0408 },
  { name: 'Майкоп', slug: 'maykop', region: 'Республика Адыгея', lat: 44.6089, lng: 40.1058 },
  { name: 'Элиста', slug: 'elista', region: 'Республика Калмыкия', lat: 46.3078, lng: 44.2702 },

  // --- НОВЫЕ РЕГИОНЫ ---
  { name: 'Донецк (ДНР)', slug: 'doneck-dnr', region: 'Донецкая Народная Республика', lat: 48.0089, lng: 37.8042 },
  { name: 'Мариуполь', slug: 'mariupol', region: 'Донецкая Народная Республика', lat: 47.0951, lng: 37.5413 },
  { name: 'Макеевка', slug: 'makeevka', region: 'Донецкая Народная Республика', lat: 48.0556, lng: 37.9611 },
  { name: 'Горловка', slug: 'gorlovka', region: 'Донецкая Народная Республика', lat: 48.3060, lng: 38.0263 },
  { name: 'Луганск', slug: 'lugansk', region: 'Луганская Народная Республика', lat: 48.5740, lng: 39.3078 },
  { name: 'Алчевск', slug: 'alchevsk', region: 'Луганская Народная Республика', lat: 48.4772, lng: 38.7981 },
  { name: 'Северодонецк', slug: 'severodoneck', region: 'Луганская Народная Республика', lat: 48.9492, lng: 38.4811 },
  { name: 'Мелитополь', slug: 'melitopol', region: 'Запорожская область', lat: 46.8489, lng: 35.3653 },
  { name: 'Бердянск', slug: 'berdyansk', region: 'Запорожская область', lat: 46.7558, lng: 36.7850 },
  { name: 'Геническ', slug: 'genichesk', region: 'Херсонская область', lat: 46.1764, lng: 34.8003 },

  // --- СКФО (КЛЮЧЕВЫЕ) ---
  { name: 'Махачкала', slug: 'makhachkala', region: 'Республика Дагестан', lat: 42.9831, lng: 47.5047 },
  { name: 'Владикавказ', slug: 'vladikavkaz', region: 'Республика Северная Осетия-Алания', lat: 43.0367, lng: 44.6678 },
  { name: 'Грозный', slug: 'groznyy', region: 'Чеченская Республика', lat: 43.3178, lng: 45.6986 },
  { name: 'Нальчик', slug: 'nalchik', region: 'Кабардино-Балкарская Республика', lat: 43.4833, lng: 43.6000 }
];

export const PROJECT_CATEGORIES = [
  {
    name: 'Ремонт и строительство',
    slug: 'remont-stroitelstvo',
    icon: 'hammer',
    sortOrder: 10,
    children: [
      { name: 'Сантехника', slug: 'santehnika', sortOrder: 1 },
      { name: 'Электрика', slug: 'elektrika', sortOrder: 2 },
      { name: 'Отделочные работы', slug: 'otdelochnye-raboty', sortOrder: 3 },
      { name: 'Мебель на заказ', slug: 'mebel-na-zakaz', sortOrder: 4 },
      { name: 'Кондиционеры', slug: 'kondicionery', sortOrder: 5 }
    ]
  },
  {
    name: 'Уборка',
    slug: 'uborka',
    icon: 'sparkles',
    sortOrder: 20,
    children: [
      { name: 'Квартиры', slug: 'uborka-kvartir', sortOrder: 1 },
      { name: 'Офисы', slug: 'uborka-ofisov', sortOrder: 2 },
      { name: 'После ремонта', slug: 'uborka-posle-remonta', sortOrder: 3 },
      { name: 'Химчистка мебели', slug: 'himchistka-mebeli', sortOrder: 4 }
    ]
  },
  {
    name: 'Красота и здоровье',
    slug: 'krasota-zdorove',
    icon: 'heart',
    sortOrder: 30,
    children: [
      { name: 'Парикмахер', slug: 'parikmaher', sortOrder: 1 },
      { name: 'Маникюр/педикюр', slug: 'manikyur-pedikyur', sortOrder: 2 },
      { name: 'Массаж', slug: 'massazh', sortOrder: 3 },
      { name: 'Косметолог', slug: 'kosmetolog', sortOrder: 4 }
    ]
  },
  {
    name: 'Репетиторы и обучение',
    slug: 'repetitory-obuchenie',
    icon: 'book-open',
    sortOrder: 40,
    children: [
      { name: 'Математика', slug: 'matematika', sortOrder: 1 },
      { name: 'Английский', slug: 'anglijskij', sortOrder: 2 },
      { name: 'Программирование', slug: 'programmirovanie', sortOrder: 3 },
      { name: 'Музыка', slug: 'muzyka', sortOrder: 4 }
    ]
  }
];
