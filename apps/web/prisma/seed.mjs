import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Хеш для "password123"
const ADMIN_PASSWORD_HASH = "$2b$10$IYDZNIRKpdyS3CYVH3Sk8eFQfy.ftYL0/IVRqswFrYmfuCV8f4lU.";

const PROJECT_CITIES = [
  { name: 'Ростов-на-Дону', slug: 'rostov-na-donu', region: 'Ростовская область', fiasId: 'c1cfe4b9-f7c2-423c-abfa-6ed1c05a15c5', lat: 47.2313, lng: 39.7233 },
  { name: 'Аксай', slug: 'aksay', region: 'Ростовская область', fiasId: '9bebf626-3ee7-4e1b-9e91-569c9d402152', lat: 47.2700, lng: 39.8700 },
  { name: 'Новочеркасск', slug: 'novocherkassk', region: 'Ростовская область', fiasId: '28bafcb3-92b2-445b-9443-a341be73fdb9', lat: 47.4167, lng: 40.0933 },
  { name: 'Азов', slug: 'azov', region: 'Ростовская область', fiasId: 'a216cad5-7027-40b8-b1a1-d64abefbd5cd', lat: 47.1111, lng: 39.4233 },
  { name: 'Шахты', slug: 'shakhty', region: 'Ростовская область', fiasId: 'dee2e80e-f2e1-4a68-93b0-b7b89b6f3e74', lat: 47.7083, lng: 40.2167 },
  { name: 'Новошахтинск', slug: 'novoshakhtinsk', region: 'Ростовская область', fiasId: 'bce1a4f2-7576-4427-8bd8-8d8b4e35ad11', lat: 47.7500, lng: 39.9333 },
  { name: 'Батайск', slug: 'bataysk', region: 'Ростовская область', fiasId: '772c6c2e-4b68-4f81-8b2b-0f81a7d6560b', lat: 47.1397, lng: 39.7523 }
];

async function main() {
  console.log("[SEED] Запуск процесса сидинга...");

  // 1. Города
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

  // 2. Тестовый админ (гарантируем наличие, правильный пароль и провайдер)
  await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: {
      passwordHash: ADMIN_PASSWORD_HASH,
      role: 'ADMIN',
      authProvider: 'EMAIL',
    },
    create: {
      email: 'admin@test.com',
      passwordHash: ADMIN_PASSWORD_HASH,
      firstName: 'Админ',
      role: 'ADMIN',
      authProvider: 'EMAIL',
      emailVerified: new Date(),
    }
  });

  console.log("[SEED] Сидинг завершен успешно.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
