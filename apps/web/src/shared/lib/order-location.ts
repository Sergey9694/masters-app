import { db } from "@/shared/lib/db";
import type { GeoPoint } from "@/shared/lib/geo-utils";

export async function syncOrderLocation(orderId: string, point: GeoPoint | null) {
  if (!point) {
    await db.$executeRaw`
      UPDATE "Order"
      SET
        "lat" = NULL,
        "lng" = NULL,
        "orderLocation" = NULL
      WHERE "id" = ${orderId}
    `;
    return;
  }

  await db.$executeRaw`
    UPDATE "Order"
    SET
      "lat" = ${point.lat},
      "lng" = ${point.lng},
      "orderLocation" = ST_SetSRID(ST_MakePoint(${point.lng}, ${point.lat}), 4326)
    WHERE "id" = ${orderId}
  `;
}
