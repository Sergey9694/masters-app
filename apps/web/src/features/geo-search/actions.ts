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
/**
 * Общий экшен для определения города (через DaData)
 */
export async function detectCityAction(lat?: number, lng?: number): Promise<City | null> {
  try {
    let cityName: string | undefined;

    if (lat !== undefined && lng !== undefined) {
      // 1. По координатам через DaData
      const res = await geolocate(lat, lng);
      cityName = res?.data?.city;
    } else {
      // 2. По IP через DaData
      const res = await detectCityByIp();
      cityName = res?.data?.city;
    }

    if (cityName) {
      return db.city.findFirst({
        where: { name: { contains: cityName, mode: "insensitive" }, isActive: true }
      });
    }

    return null;
  } catch (error) {
    console.error("[GEO_ACTION] Detect city failed:", error);
    return null;
  }
}
