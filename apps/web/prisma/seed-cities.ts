import { PrismaClient } from "@prisma/client";
import { PROJECT_CITIES } from "./cities.config";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding cities from cities.config.ts...");

  for (const city of PROJECT_CITIES) {
    const { lat, lng, ...cityData } = city;
    
    // Upsert base city data
    const createdCity = await prisma.city.upsert({
      where: { slug: city.slug },
      update: cityData,
      create: cityData,
    });

    // Update location using raw SQL for PostGIS
    if (lat && lng) {
      await prisma.$executeRawUnsafe(
        `UPDATE "City" SET location = ST_SetSRID(ST_MakePoint($1, $2), 4326) WHERE id = $3`,
        lng, lat, createdCity.id
      );
    }

    console.log(`✅ City synced: ${city.name} (${lat}, ${lng})`);
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
