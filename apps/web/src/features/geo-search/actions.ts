"use server";

import { headers } from "next/headers";
import { Prisma } from "@prisma/client";

import { db } from "@/shared/lib/db";
import { detectCityByIp } from "@/shared/lib/dadata";
import { checkRateLimit } from "@/shared/lib/rate-limit";
import { toGeoPoint } from "@/shared/lib/geo-utils";

const citySelect = {
  id: true,
  name: true,
  slug: true,
  fiasId: true,
  region: true,
  lat: true,
  lng: true,
  isActive: true,
} satisfies Prisma.CitySelect;

export type GeoCity = Prisma.CityGetPayload<{ select: typeof citySelect }>;

function targetPointSql(lat: number, lng: number) {
  return Prisma.sql`ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)`;
}

function parseNumber(value: string | undefined) {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export async function detectClosestCity(lat: number, lng: number): Promise<GeoCity | null> {
  const point = toGeoPoint(lat, lng);
  if (!point) {
    return null;
  }

  try {
    const cities = await db.$queryRaw<GeoCity[]>`
      SELECT
        id,
        name,
        slug,
        "fiasId",
        region,
        lat,
        lng,
        "isActive"
      FROM "City"
      WHERE
        "isActive" = true
        AND (
          "location" IS NOT NULL
          OR ("lat" IS NOT NULL AND "lng" IS NOT NULL)
        )
      ORDER BY COALESCE("location", ST_SetSRID(ST_MakePoint("lng", "lat"), 4326)) <-> ${targetPointSql(point.lat, point.lng)}
      LIMIT 1
    `;

    return cities[0] || null;
  } catch (error) {
    console.error("[GEO_ACTION] Failed to detect closest city:", error);
    return null;
  }
}

export async function getCityByName(name: string): Promise<GeoCity | null> {
  return db.city.findFirst({
    where: {
      name: { contains: name, mode: "insensitive" },
      isActive: true,
    },
    select: citySelect,
  });
}

export async function getAllCities(): Promise<GeoCity[]> {
  return db.city.findMany({
    where: { isActive: true },
    select: citySelect,
    orderBy: { name: "asc" },
  });
}

export async function detectCityAction(lat?: number, lng?: number): Promise<GeoCity | null> {
  try {
    const headerList = await headers();
    const ip =
      headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headerList.get("x-real-ip")?.trim() ||
      "unknown";

    const rl = await checkRateLimit({ key: `geo-detect:${ip}`, limit: 20, windowSec: 60 });
    if (!rl.allowed) {
      return null;
    }

    if (lat !== undefined && lng !== undefined) {
      const closest = await detectClosestCity(lat, lng);
      if (closest) {
        return closest;
      }
    }

    const res = await detectCityByIp();
    const cityName = res?.data?.city;
    const fiasId = res?.data?.city_fias_id;
    const ipLat = parseNumber(res?.data?.geo_lat);
    const ipLng = parseNumber(res?.data?.geo_lon);

    if (fiasId) {
      const city = await db.city.findFirst({
        where: { fiasId, isActive: true },
        select: citySelect,
      });
      if (city) {
        return city;
      }
    }

    if (cityName) {
      const city = await db.city.findFirst({
        where: {
          name: { contains: cityName, mode: "insensitive" },
          isActive: true,
        },
        select: citySelect,
      });
      if (city) {
        return city;
      }
    }

    if (ipLat !== undefined && ipLng !== undefined) {
      return detectClosestCity(ipLat, ipLng);
    }

    return null;
  } catch (error) {
    console.error("[GEO_ACTION] Detect city failed:", error);
    return null;
  }
}
