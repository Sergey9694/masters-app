import { PrismaClient } from "@prisma/client";
import "dotenv/config";
import { PROJECT_CITIES } from "../prisma/cities.config";

const prisma = new PrismaClient();
const DADATA_TOKEN = process.env.DADATA_API_KEY;

/**
 * Универсальный скрипт для синхронизации городов с DaData.
 * Использует список городов из prisma/cities.config.ts
 */

async function fetchFromDaData(cityName: string) {
  if (!DADATA_TOKEN) {
    throw new Error("DADATA_API_KEY is not set in .env");
  }

  const res = await fetch("https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Authorization": `Token ${DADATA_TOKEN}`
    },
    body: JSON.stringify({ 
      query: cityName, 
      count: 1, 
      from_bound: { value: "city" }, 
      to_bound: { value: "city" } 
    })
  });

  const json = await res.json();
  const suggestion = json.suggestions?.[0];

  if (!suggestion) {
    console.warn(`[WARN] City not found in DaData: ${cityName}`);
    return null;
  }

  return {
    name: suggestion.data.city || suggestion.value,
    fiasId: suggestion.data.city_fias_id,
    lat: parseFloat(suggestion.data.geo_lat),
    lng: parseFloat(suggestion.data.geo_lon),
    region: suggestion.data.region_with_type
  };
}

async function sync() {
  console.log("🚀 Starting Geo-Sync using PROJECT_CITIES config...");

  for (const item of PROJECT_CITIES) {
    try {
      console.log(`Processing ${item.name}...`);
      const geo = await fetchFromDaData(item.name);
      if (!geo) continue;

      let city = await prisma.city.findFirst({
        where: {
          OR: [
            { fiasId: geo.fiasId },
            { name: geo.name }
          ]
        }
      });

      const updateData = {
        fiasId: geo.fiasId,
        region: geo.region,
        isActive: true,
        slug: item.slug
      };

      if (city) {
        city = await prisma.city.update({
          where: { id: city.id },
          data: updateData
        });
        console.log(`[UPDATED] ${geo.name}`);
      } else {
        city = await prisma.city.create({
          data: {
            name: geo.name,
            ...updateData
          }
        });
        console.log(`[CREATED] ${geo.name}`);
      }

      if (!isNaN(geo.lat) && !isNaN(geo.lng)) {
        await prisma.$executeRawUnsafe(
          `UPDATE "City" SET location = ST_SetSRID(ST_MakePoint($1, $2), 4326) WHERE id = $3`,
          geo.lng,
          geo.lat,
          city.id
        );
      }

    } catch (error) {
      console.error(`[ERROR] Failed to sync ${item.name}:`, error);
    }
  }

  console.log("✅ Geo-Sync finished!");
}

sync()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
