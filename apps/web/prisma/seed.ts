import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const cities = [
  { name: 'Москва', slug: 'moscow', region: 'Москва' },
  { name: 'Санкт-Петербург', slug: 'spb', region: 'Санкт-Петербург' },
  { name: 'Новосибирск', slug: 'novosibirsk', region: 'Новосибирская область' },
  { name: 'Екатеринбург', slug: 'ekaterinburg', region: 'Свердловская область' },
  { name: 'Казань', slug: 'kazan', region: 'Республика Татарстан' }
];

const categories = [
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
  },
  {
    name: 'Авто',
    slug: 'avto',
    icon: 'car',
    sortOrder: 50,
    children: [
      { name: 'Ремонт', slug: 'avtoremont', sortOrder: 1 },
      { name: 'Мойка', slug: 'avtomoyka', sortOrder: 2 },
      { name: 'Шиномонтаж', slug: 'shinomontazh', sortOrder: 3 },
      { name: 'Эвакуатор', slug: 'evakuator', sortOrder: 4 }
    ]
  },
  {
    name: 'Перевозки и доставка',
    slug: 'perevozki-dostavka',
    icon: 'truck',
    sortOrder: 60,
    children: [
      { name: 'Грузоперевозки', slug: 'gruzoperevozki', sortOrder: 1 },
      { name: 'Переезды', slug: 'pereezdy', sortOrder: 2 },
      { name: 'Курьер', slug: 'kurer', sortOrder: 3 }
    ]
  },
  {
    name: 'IT и техника',
    slug: 'it-tehnika',
    icon: 'monitor',
    sortOrder: 70,
    children: [
      { name: 'Ремонт компьютеров', slug: 'remont-kompyuterov', sortOrder: 1 },
      { name: 'Настройка ПО', slug: 'nastroyka-po', sortOrder: 2 },
      { name: 'Создание сайтов', slug: 'sozdanie-saytov', sortOrder: 3 },
      { name: 'Видеонаблюдение', slug: 'videonablyudenie', sortOrder: 4 }
    ]
  },
  {
    name: 'Фото и видео',
    slug: 'foto-video',
    icon: 'camera',
    sortOrder: 80,
    children: [
      { name: 'Фотограф', slug: 'fotograf', sortOrder: 1 },
      { name: 'Видеограф', slug: 'videograf', sortOrder: 2 },
      { name: 'Монтаж', slug: 'montazh', sortOrder: 3 }
    ]
  },
  {
    name: 'Юристы и финансы',
    slug: 'yuristy-finansy',
    icon: 'briefcase',
    sortOrder: 90,
    children: [
      { name: 'Консультация юриста', slug: 'konsultaciya-yurista', sortOrder: 1 },
      { name: 'Бухгалтерия', slug: 'buhgalteriya', sortOrder: 2 },
      { name: 'Оценка имущества', slug: 'ocenka-imuschestva', sortOrder: 3 }
    ]
  },
  {
    name: 'Другое',
    slug: 'drugoe',
    icon: 'more-horizontal',
    sortOrder: 100,
    children: [
      { name: 'Няни и сиделки', slug: 'nyani-sidelki', sortOrder: 1 },
      { name: 'Выгул собак', slug: 'vygul-sobak', sortOrder: 2 },
      { name: 'Организация праздников', slug: 'organizaciya-prazdnikov', sortOrder: 3 },
      { name: 'Прочее', slug: 'prochee', sortOrder: 4 }
    ]
  }
];

async function main() {
  console.log("🌱 Start seeding cities...");
  for (const city of cities) {
    await prisma.city.upsert({
      where: { slug: city.slug },
      update: {},
      create: city,
    });
    console.log(`✅ City created: ${city.name}`);
  }

  console.log("🌱 Start seeding categories...");
  for (const parent of categories) {
    const { children, ...parentData } = parent;
    
    const parentCategory = await prisma.category.upsert({
      where: { slug: parent.slug },
      update: parentData,
      create: parentData,
    });

    if (children && children.length > 0) {
      for (const child of children) {
        await prisma.category.upsert({
          where: { slug: child.slug },
          update: { ...child, parentId: parentCategory.id },
          create: { ...child, parentId: parentCategory.id },
        });
      }
    }
    console.log(`✅ Category created: ${parent.name}`);
  }

  console.log("🌿 Seeding finished.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
