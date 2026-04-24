import "dotenv/config";
import { PrismaClient, Role, ListingStatus, PriceUnit, OrderStatus } from "@prisma/client";

const prisma = new PrismaClient();

import { PROJECT_CITIES } from "./cities.config";

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

  // 3. Link Categories to Cities (Universal linking for ALL active cities)
  console.log("🔗 Universal linking of categories to ALL cities...");
  const activeCities = await prisma.city.findMany({ where: { isActive: true } });
  const allParentCategories = await prisma.category.findMany({ where: { parentId: null } });

  for (const city of activeCities) {
    for (const cat of allParentCategories) {
      await prisma.cityCategory.upsert({
        where: { cityId_categoryId: { cityId: city.id, categoryId: cat.id } },
        update: {},
        create: { cityId: city.id, categoryId: cat.id, sortOrder: cat.sortOrder },
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
