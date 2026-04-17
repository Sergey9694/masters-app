import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const cities = [
  { name: 'Москва', slug: 'moscow', region: 'Москва', lat: 55.7558, lon: 37.6173 },
  { name: 'Санкт-Петербург', slug: 'spb', region: 'Санкт-Петербург', lat: 59.9343, lon: 30.3351 },
  { name: 'Новосибирск', slug: 'novosibirsk', region: 'Новосибирская область', lat: 55.0084, lon: 82.9346 },
  { name: 'Екатеринбург', slug: 'ekaterinburg', region: 'Свердловская область', lat: 56.8389, lon: 60.6122 },
  { name: 'Казань', slug: 'kazan', region: 'Республика Татарстан', lat: 55.7887, lon: 49.1233 }
];

async function main() {
  console.log("🌱 Seeding cities with PostGIS coordinates...");

  for (const city of cities) {
    const { lat, lon, ...cityData } = city;
    
    // Upsert base city data
    const createdCity = await prisma.city.upsert({
      where: { slug: city.slug },
      update: cityData,
      create: cityData,
    });

    // Update location using raw SQL for PostGIS
    await prisma.$executeRawUnsafe(
      `UPDATE "City" SET location = ST_SetSRID(ST_MakePoint($1, $2), 4326) WHERE id = $3`,
      lon, lat, createdCity.id
    );

    console.log(`✅ City created/updated: ${city.name} (${lat}, ${lon})`);
  }

  console.log("🏙️ Cities seeding finished.");
}

if (require.main === module) {
  main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

export { main as seedCities };
