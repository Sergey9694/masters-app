import "dotenv/config";
import { PrismaClient, Role } from "@prisma/client";
import { PROJECT_CITIES } from "./cities.config";
import { PROJECT_CATEGORIES } from "./seed-data.mjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seeding process...");

  // 1. Seed Cities
  console.log("🏙️ Seeding cities...");
  const activeSlugs = PROJECT_CITIES.map(c => c.slug);

  for (const city of PROJECT_CITIES) {
    const { lat, lng, ...cityData } = city;
    // upsert по slug не учитывает unique constraint на name —
    // ищем по slug ИЛИ name чтобы не упасть при дублях
    const existing = await prisma.city.findFirst({
      where: { OR: [{ slug: city.slug }, { name: cityData.name }] },
    });
    const createdCity = existing
      ? await prisma.city.update({
          where: { id: existing.id },
          data: { ...cityData, lat, lng, isActive: true },
        })
      : await prisma.city.create({
          data: { ...cityData, lat, lng, isActive: true },
        });

    if (lat && lng) {
      try {
        await prisma.$executeRawUnsafe(
          `UPDATE "City" SET location = ST_SetSRID(ST_MakePoint($1, $2), 4326) WHERE id = $3`,
          lng, lat, createdCity.id
        );
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        console.warn(`⚠️ PostGIS error for ${city.name}: ${msg}`);
      }
    }
  }

  await prisma.city.updateMany({
    where: { slug: { notIn: activeSlugs } },
    data: { isActive: false }
  });

  // 2. Seed Categories
  console.log("🌱 Seeding categories...");
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

  // 3. Link Categories to Cities
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

  // 4. Admin User
  console.log("👤 Creating/Updating admin user...");
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@test.com';
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
  if (!ADMIN_PASSWORD) {
    console.warn("⚠️ ADMIN_PASSWORD не задан — пропускаем создание админа. Задайте переменную окружения.");
  } else {
    const bcrypt = await import("bcryptjs");
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

    await prisma.user.upsert({
      where: { email: ADMIN_EMAIL },
      update: { role: Role.ADMIN, passwordHash },
      create: { 
        email: ADMIN_EMAIL, 
        passwordHash, 
        firstName: 'Admin', 
        role: Role.ADMIN, 
        emailVerified: new Date(),
        authProvider: 'EMAIL'
      }
    });
  }

  console.log("🌿 Seeding finished successfully.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
