import "dotenv/config";
import { PrismaClient, Role, ListingStatus, PriceUnit, OrderStatus } from "@prisma/client";

const prisma = new PrismaClient();

const PROJECT_CITIES = [
  { name: 'Ростов-на-Дону', slug: 'rostov-na-donu', region: 'Ростовская область', fiasId: 'c1cfe4b9-f7c2-423c-abfa-6ed1c05a15c5', lat: 47.2313, lng: 39.7233 },
  { name: 'Аксай', slug: 'aksay', region: 'Ростовская область', fiasId: '9bebf626-3ee7-4e1b-9e91-569c9d402152', lat: 47.2700, lng: 39.8700 },
  { name: 'Новочеркасск', slug: 'novocherkassk', region: 'Ростовская область', fiasId: '28bafcb3-92b2-445b-9443-a341be73fdb9', lat: 47.4167, lng: 40.0933 },
  { name: 'Азов', slug: 'azov', region: 'Ростовская область', fiasId: 'a216cad5-7027-40b8-b1a1-d64abefbd5cd', lat: 47.1111, lng: 39.4233 },
  { name: 'Шахты', slug: 'shakhty', region: 'Ростовская область', fiasId: 'dee2e80e-f2e1-4a68-93b0-b7b89b6f3e74', lat: 47.7083, lng: 40.2167 },
  { name: 'Новошахтинск', slug: 'novoshakhtinsk', region: 'Ростовская область', fiasId: 'bce1a4f2-7576-4427-8bd8-8d8b4e35ad11', lat: 47.7500, lng: 39.9333 },
  { name: 'Батайск', slug: 'bataysk', region: 'Ростовская область', fiasId: '772c6c2e-4b68-4f81-8b2b-0f81a7d6560b', lat: 47.1397, lng: 39.7523 }
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
  }
];

async function main() {
  console.log("🌱 Starting seeding process...");

  // 1. Seed Cities
  console.log("🏙️ Seeding cities...");
  const activeSlugs = PROJECT_CITIES.map(c => c.slug);

  for (const city of PROJECT_CITIES) {
    const { lat, lng, ...cityData } = city;
    const createdCity = await prisma.city.upsert({
      where: { slug: city.slug },
      update: { ...cityData, lat, lng, isActive: true },
      create: { ...cityData, lat, lng, isActive: true },
    });

    if (lat && lng) {
      try {
        await prisma.$executeRawUnsafe(
          `UPDATE "City" SET location = ST_SetSRID(ST_MakePoint($1, $2), 4326) WHERE id = $3`,
          lng, lat, createdCity.id
        );
      } catch (e: any) {
        console.warn(`⚠️ PostGIS error for ${city.name}: ${e.message}`);
      }
    }
  }

  await prisma.city.updateMany({
    where: { slug: { notIn: activeSlugs } },
    data: { isActive: false }
  });

  // 2. Seed Categories
  console.log("🌱 Seeding categories...");
  for (const parent of categories) {
    const { children, ...parentData } = parent;
    const parentCategory = await prisma.category.upsert({
      where: { slug: parent.slug },
      update: parentData,
      create: parentData,
    });

    if (children) {
      for (const child of children) {
        await prisma.category.upsert({
          where: { slug: child.slug },
          update: { ...child, parentId: parentCategory.id },
          create: { ...child, parentId: parentCategory.id },
        });
      }
    }
  }

  // 3. Link Categories to Cities
  const mainCity = await prisma.city.findUnique({ where: { slug: 'rostov-na-donu' } });
  if (mainCity) {
    console.log("🔗 Linking categories to Rostov...");
    const allParentCategories = await prisma.category.findMany({ where: { parentId: null } });
    for (const cat of allParentCategories) {
      await prisma.cityCategory.upsert({
        where: { cityId_categoryId: { cityId: mainCity.id, categoryId: cat.id } },
        update: {},
        create: { cityId: mainCity.id, categoryId: cat.id, sortOrder: cat.sortOrder },
      });
    }
  }

  // 4. Test Data (Users, Listings, Orders)
  console.log("👤 Creating test users...");
  const bcrypt = await import("bcryptjs");
  const passwordHash = await bcrypt.hash("password123", 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: {},
    create: { email: 'admin@test.com', passwordHash, firstName: 'Admin', role: Role.ADMIN, emailVerified: new Date() }
  });

  console.log("🌿 Seeding finished.");
  console.log("Admin: admin@test.com / password123");
}

main().catch(console.error).finally(() => prisma.$disconnect());
