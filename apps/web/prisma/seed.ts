import "dotenv/config";
import { PrismaClient, Role, ListingStatus, PriceUnit, OrderStatus } from "@prisma/client";
import { seedCities } from "./seed-cities";

const prisma = new PrismaClient();

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
  // 1. Seed Cities
  await seedCities();

  // 2. Seed Categories
  console.log("🌱 Seeding categories...");
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
  }

  // 3. Link Categories to Cities (Popular categories)
  const moscow = await prisma.city.findUnique({ where: { slug: 'moscow' } });
  const allCategories = await prisma.category.findMany({ where: { parentId: null } });
  
  if (moscow) {
    console.log("🌱 Linking categories to Moscow...");
    for (const cat of allCategories) {
      await prisma.cityCategory.upsert({
        where: { cityId_categoryId: { cityId: moscow.id, categoryId: cat.id } },
        update: {},
        create: { cityId: moscow.id, categoryId: cat.id, sortOrder: cat.sortOrder },
      });
    }
  }

  // 4. Create Dummy Provider
  console.log("🌱 Creating dummy provider...");
  const providerUser = await prisma.user.upsert({
    where: { phone: '79001112233' },
    update: {},
    create: {
      phone: '79001112233',
      firstName: 'Иван',
      lastName: 'Мастеров',
      role: Role.PROVIDER,
      cityId: moscow?.id,
    }
  });

  const providerProfile = await prisma.providerProfile.upsert({
    where: { userId: providerUser.id },
    update: {},
    create: {
      userId: providerUser.id,
      bio: 'Профессиональный сантехник с опытом 10 лет.',
      experienceYears: 10,
      isVerified: true,
      rating: 4.9,
    }
  });

  // 5. Create Service Listing
  const santehnika = await prisma.category.findUnique({ where: { slug: 'santehnika' } });
  if (santehnika && moscow) {
    console.log("🌱 Creating dummy service listing...");
    await prisma.serviceListing.create({
      data: {
        providerId: providerProfile.id,
        categoryId: santehnika.id,
        cityId: moscow.id,
        title: 'Установка смесителей и ремонт труб',
        description: 'Быстро, качественно, с гарантией. Выезд в течение часа.',
        status: ListingStatus.ACTIVE,
        priceFrom: 1500,
        priceUnit: PriceUnit.PER_SERVICE,
        address: 'г. Москва, ул. Арбат, 1',
      }
    });
  }

  // 6. Create Dummy Order
  console.log("🌱 Creating dummy order...");
  const clientUser = await prisma.user.upsert({
    where: { phone: '79112223344' },
    update: {},
    create: {
      phone: '79112223344',
      firstName: 'Алексей',
      lastName: 'Заказчиков',
      role: Role.USER,
      cityId: moscow?.id,
    }
  });

  if (santehnika && moscow) {
    await prisma.order.create({
      data: {
        clientId: clientUser.id,
        categoryId: santehnika.id,
        cityId: moscow.id,
        title: 'Нужно починить кран на кухне',
        description: 'Кран течет уже неделю, нужно заменить прокладку или весь кран.',
        budget: 2000,
        address: 'Москва, ул. Тверская, 10',
        status: OrderStatus.OPEN,
      }
    });
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

