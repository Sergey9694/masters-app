import { PrismaClient } from "@prisma/client";
import { createRequire } from "module";
import { PROJECT_CITIES, PROJECT_CATEGORIES } from "./seed-data.mjs";

const prisma = new PrismaClient();
const require = createRequire(import.meta.url);

// Настройки админа из окружения
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@test.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

async function main() {
  console.log("[SEED] Запуск процесса сидинга...");

  // 1. Города
  console.log("[SEED] 🏙️ Синхронизация городов...");
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
      } catch (e) {
        console.warn(`[SEED] Ошибка PostGIS для ${city.name}: ${e.message}`);
      }
    }
    console.log(`[SEED] Город синхронизирован: ${city.name}`);
  }

  await prisma.city.updateMany({
    where: { slug: { notIn: activeSlugs } },
    data: { isActive: false }
  });

  // 2. Категории
  console.log("[SEED] 🌱 Синхронизация категорий...");
  for (const parent of PROJECT_CATEGORIES) {
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
  console.log("[SEED] Категории синхронизированы.");

  // 3. Привязка категорий к городам (Universal linking)
  console.log("[SEED] 🔗 Привязка категорий ко всем городам...");
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

  // 4. Дефолтный администратор
  console.log("[SEED] 👤 Синхронизация администратора...");
  if (!ADMIN_PASSWORD) {
    console.warn("[SEED] ⚠️ ADMIN_PASSWORD не задан — пропускаем создание админа.");
  } else {
    const bcrypt = require("bcryptjs");
    const passwordHash = bcrypt.hashSync(ADMIN_PASSWORD, 10);

    await prisma.user.upsert({
      where: { email: ADMIN_EMAIL },
      update: {
        role: 'ADMIN',
        authProvider: 'EMAIL',
        passwordHash,
      },
      create: {
        email: ADMIN_EMAIL,
        passwordHash,
        firstName: 'Админ',
        role: 'ADMIN',
        authProvider: 'EMAIL',
        emailVerified: new Date(),
      }
    });
  }

  console.log("[SEED] Сидинг завершен успешно.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
