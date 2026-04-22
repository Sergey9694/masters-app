import { db } from "@/shared/lib/db";
import { Prisma } from "@prisma/client";
import type { NearbyOrderCard } from "@/shared/types/domain";

/**
 * Hyperlocal Order DAL (Data Access Layer) 2026
 * Using PostGIS for spatial queries via Prisma.$queryRaw
 */

interface RawNearbyOrder {
  id: string;
  title: string;
  description: string;
  budget: number | null;
  address: string | null;
  status: string;
  createdAt: Date;
  executionDate: Date | null;
  images: string[];
  categoryName: string;
  categorySlug: string;
  customerName: string;
  customerAvatar: string | null;
  cityName: string;
  proposalCount: number;
  distance: number;
}

/**
 * Find open orders within a given radius (in meters) from a specified point.
 * Uses PostGIS ST_DWithin (indexed search) and ST_Distance.
 */
export async function getOrdersNearby(
  lng: number,
  lat: number,
  radiusMeters: number = 10000,
  limit: number = 20
): Promise<NearbyOrderCard[]> {
  try {
    // W5 fix: Using $queryRaw with Prisma.sql for safe parameterized queries
    const orders = await db.$queryRaw<RawNearbyOrder[]>(
      Prisma.sql`
      SELECT 
        t.id, 
        t.title, 
        t.description, 
        t.budget, 
        t.address, 
        t.status,
        t."createdAt",
        t."executionDate",
        t.images,
        c.name as "categoryName",
        c.slug as "categorySlug",
        u."firstName" as "customerName",
        u.avatar as "customerAvatar",
        city.name as "cityName",
        (SELECT COUNT(*)::int FROM "Proposal" p WHERE p."orderId" = t.id) as "proposalCount",
        ST_Distance(
          t."orderLocation"::geography, 
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
        ) as distance
      FROM "Order" t
      JOIN "Category" c ON t."categoryId" = c.id
      JOIN "User" u ON t."clientId" = u.id
      JOIN "City" city ON t."cityId" = city.id
      WHERE 
        t.status = 'OPEN' 
        AND ST_DWithin(
          t."orderLocation"::geography, 
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography, 
          ${radiusMeters}
        )
      ORDER BY distance ASC
      LIMIT ${limit}
      `
    );

    return orders.map((t: RawNearbyOrder) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      budget: t.budget ? Number(t.budget) : null,
      address: t.address,
      status: t.status,
      distance: Math.round(Number(t.distance)),
      createdAt: new Date(t.createdAt),
      executionDate: t.executionDate ? new Date(t.executionDate) : null,
      images: t.images || [],
      proposalCount: t.proposalCount || 0,
      city: {
        name: t.cityName,
      },
      category: {
        name: t.categoryName,
        slug: t.categorySlug,
      },
      client: {
        firstName: t.customerName,
        avatar: t.customerAvatar,
      },
    }));
  } catch (error) {
    console.error("Critical PostGIS Query Failed:", error);
    return [];
  }
}
