import { db } from "@/shared/lib/db";

/**
 * Hyperlocal Task DAL (Data Access Layer) 2026
 * Using PostGIS for spatial queries that Prisma can't do natively.
 */

export interface NearbyTask {
  id: string;
  title: string;
  description: string;
  budget: number | null;
  address: string | null;
  distance: number; // In meters
  createdAt: Date;
  category: {
    name: string;
  };
  customer: {
    firstName: string;
    avatar: string | null;
  };
}

/**
 * Находит открытые задачи в заданном радиусе (в метрах) от указанной точки.
 * Использует PostGIS ST_DWithin (индексированный поиск) и ST_Distance.
 */
export async function getTasksNearby(
  lng: number,
  lat: number,
  radiusMeters: number = 10000, // По умолчанию 10км
  limit: number = 20
): Promise<NearbyTask[]> {
  try {
    // ВНИМАНИЕ: $queryRawUnsafe используется здесь из-за сложности PostGIS типов в Prisma.
    // Параметры передаются в правильном порядке: lng ($1), lat ($2).
    const tasks = await db.$queryRawUnsafe<any[]>(
      `
      SELECT 
        t.id, 
        t.title, 
        t.description, 
        t.budget, 
        t.address, 
        t."createdAt",
        c.name as "categoryName",
        u."firstName" as "customerName",
        u.avatar as "customerAvatar",
        ST_Distance(
          t."taskLocation"::geography, 
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
        ) as distance
      FROM "TaskRequest" t
      JOIN "Category" c ON t."categoryId" = c.id
      JOIN "User" u ON t."customerId" = u.id
      WHERE 
        t.status = 'OPEN' 
        AND ST_DWithin(
          t."taskLocation"::geography, 
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, 
          $3
        )
      ORDER BY distance ASC
      LIMIT $4
      `,
      lng, // $1
      lat, // $2
      radiusMeters, // $3
      limit // $4
    );

    return tasks.map((t: any) => ({
      id: t.id as string,
      title: t.title as string,
      description: t.description as string,
      budget: t.budget ? Number(t.budget) : null,
      address: t.address as string | null,
      distance: Math.round(Number(t.distance)),
      createdAt: new Date(t["createdAt"]),
      category: {
        name: t.categoryName as string,
      },
      customer: {
        firstName: t.customerName as string,
        avatar: t.customerAvatar as string | null,
      },
    }));
  } catch (error) {
    console.error("Critical PostGIS Query Failed:", error);
    return [];
  }
}
