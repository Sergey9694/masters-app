import { NextRequest } from "next/server";
import { z } from "zod";

import { orderService } from "@/services/order.service";
import { apiError, apiSuccess, apiUnauthorized } from "@/shared/lib/api-helpers";
import { getSessionFromRequest } from "@/shared/lib/auth";
import { checkRateLimit } from "@/shared/lib/rate-limit";

const optionalString = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.string().trim().max(120).optional()
);
const optionalNumber = z.preprocess(
  (v) => (v === "" || v === null || v === "null" || v === "undefined" ? undefined : v),
  z.coerce.number().optional()
);

function getRequesterKey(request: NextRequest, userId?: string) {
  if (userId) return userId;
  return request.headers.get("x-forwarded-for")?.split(",")[0] || "anonymous";
}

const querySchema = z.object({
  categoryId: optionalString,
  cityId: optionalString,
  search: optionalString,
  lat: optionalNumber.pipe(z.number().min(-90).max(90).optional()),
  lng: optionalNumber.pipe(z.number().min(-180).max(180).optional()),
  radiusKm: optionalNumber.pipe(z.number().min(1).max(100).optional()),
  // BBox params
  minLat: optionalNumber.pipe(z.number().min(-90).max(90).optional()),
  minLng: optionalNumber.pipe(z.number().min(-180).max(180).optional()),
  maxLat: optionalNumber.pipe(z.number().min(-90).max(90).optional()),
  maxLng: optionalNumber.pipe(z.number().min(-180).max(180).optional()),
}).refine((data) => {
  const hasLatLong = data.lat !== undefined && data.lng !== undefined;
  const hasBBox = 
    data.minLat !== undefined && 
    data.minLng !== undefined && 
    data.maxLat !== undefined && 
    data.maxLng !== undefined;

  if (data.minLat !== undefined && data.maxLat !== undefined && data.minLat >= data.maxLat) {
    return false;
  }

  // Valid if either point+radius OR bbox is provided, or neither
  return hasLatLong || hasBBox || (data.lat === undefined && data.minLat === undefined);
}, {
  message: "Either (lat, lng) or (minLat, minLng, maxLat, maxLng) must be provided together",
});


export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  const userId = session?.userId;

  const sp = request.nextUrl.searchParams;
  const parsed = querySchema.safeParse({
    categoryId: sp.get("categoryId"),
    cityId: sp.get("cityId"),
    search: sp.get("search"),
    lat: sp.get("lat"),
    lng: sp.get("lng"),
    radiusKm: sp.get("radiusKm"),
    minLat: sp.get("minLat"),
    minLng: sp.get("minLng"),
    maxLat: sp.get("maxLat"),
    maxLng: sp.get("maxLng"),
  });

  if (!parsed.success) {
    console.error("[API/ORDERS/MAP_POINTS] Validation failed:", parsed.error.flatten());
    return apiError("Validation failed", 400, parsed.error.flatten());
  }

  const rl = await checkRateLimit({
    key: `orders-map:${getRequesterKey(request, userId)}`,
    limit: session ? 60 : 20, // Guests have tighter limits
    windowSec: 60,
  });

  if (!rl.allowed) {
    return apiError(`Too many map requests. Retry in ${rl.retryAfterSec}s`, 429);
  }

  try {
    const { minLat, minLng, maxLat, maxLng, ...rest } = parsed.data;
    const serviceParams = {
      ...rest,
      bbox: (minLat !== undefined && minLng !== undefined && maxLat !== undefined && maxLng !== undefined)
        ? { minLat, minLng, maxLat, maxLng }
        : undefined
    };
    const points = await orderService.listMapPoints(serviceParams);
    return apiSuccess({ points });
  } catch (error) {
    console.error("[API/ORDERS/MAP_POINTS] Error:", error);
    return apiError("Failed to fetch order map points", 500);
  }
}
