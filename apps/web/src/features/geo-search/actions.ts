"use server";

import { db } from "@/shared/lib/db";
import { City } from "@prisma/client";
import { detectCityByIp, geolocate } from "@/shared/lib/dadata";

/**
 * Находит ближайший город в базе данных по координатам.
 * Использует PostGIS raw query.
 */
export async function detectClosestCity(lat: number, lng: number): Promise<City | null> {
  try {
    // Поиск ближайшего активного города в радиусе 100км
    const cities = await db.$queryRawUnsafe<City[]>(
      `SELECT id, name, slug, region, "isActive", "createdAt"
       FROM "City"
       WHERE "isActive" = true
       ORDER BY location <-> ST_SetSRID(ST_MakePoint($1, $2), 4326)
       LIMIT 1`,
      lng, // ST_MakePoint(lng, lat)
      lat
    );

    return cities[0] || null;
  } catch (error) {
    console.error("[GEO_ACTION] Failed to detect closest city:", error);
    return null;
  }
}

/**
 * Получает город по его названию (для фолбека от IP-API или DaData)
 */
export async function getCityByName(name: string): Promise<City | null> {
  return db.city.findFirst({
    where: {
      name: { contains: name, mode: "insensitive" },
      isActive: true,
    },
  });
}

/**
 * Возвращает список всех активных городов
 */
export async function getAllCities(): Promise<City[]> {
  return db.city.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
}
export async function detectCityAction(lat?: number, lng?: number): Promise<City | null> {
  try {
    console.log(`[GEO_ACTION] Detecting city for: lat=${lat}, lng=${lng}`);

    // Если есть координаты, используем PostGIS поиск как самый точный
    if (lat !== undefined && lng !== undefined) {
      const closest = await detectClosestCity(lat, lng);
      if (closest) {
        console.log(`[GEO_ACTION] Closest city found via PostGIS: ${closest.name}`);
        return closest;
      }
    }

    // Если координат нет или PostGIS не нашел, пробуем через DaData по IP
    const res = await detectCityByIp();
    const cityName = res?.data?.city;
    const fiasId = res?.data?.city_fias_id;
    const ipLat = res?.data?.geo_lat ? parseFloat(res.data.geo_lat) : undefined;
    const ipLng = res?.data?.geo_lon ? parseFloat(res.data.geo_lon) : undefined;
    
    console.log(`[GEO_ACTION] DaData IP detect result:`, { cityName, fiasId, ipLat, ipLng });

    // 1. Приоритетный поиск по fiasId (самый точный)
    if (fiasId) {
      const city = await db.city.findFirst({
        where: { fiasId, isActive: true }
      });
      if (city) {
        console.log(`[GEO_ACTION] City found in DB by fiasId: ${city.name}`);
        return city;
      }
    }

    // 2. Фолбек по названию
    if (cityName) {
      const city = await db.city.findFirst({
        where: { 
          name: { contains: cityName, mode: "insensitive" }, 
          isActive: true 
        }
      });
      if (city) {
        console.log(`[GEO_ACTION] City found in DB by name: ${city.name}`);
        return city;
      }
    }

    // Фолбек: если по имени не нашли, но есть координаты от IP - ищем ближайший
    if (ipLat !== undefined && ipLng !== undefined) {
      console.log(`[GEO_ACTION] Falling back to nearest city via IP coordinates...`);
      const closest = await detectClosestCity(ipLat, ipLng);
      if (closest) {
        console.log(`[GEO_ACTION] Found nearest city as fallback: ${closest.name}`);
        return closest;
      }
    }

    console.warn(`[GEO_ACTION] No city found in DB for cityName: ${cityName}`);
    return null;
  } catch (error) {
    console.error("[GEO_ACTION] Detect city failed:", error);
    return null;
  }
}
