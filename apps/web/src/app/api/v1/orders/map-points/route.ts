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

const querySchema = z.object({
  categoryId: optionalString,
  cityId: optionalString,
  search: optionalString,
  lat: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.coerce.number().min(-90).max(90).optional()
  ),
  lng: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.coerce.number().min(-180).max(180).optional()
  ),
  radiusKm: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.coerce.number().min(1).max(100).optional()
  ),
}).refine((data) => (data.lat === undefined) === (data.lng === undefined), {
  message: "lat and lng must be provided together",
});

function getRequesterKey(request: NextRequest, userId: string) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();
  return `${userId}:${forwarded || realIp || "unknown"}`;
}

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  const userId = session?.userId || "guest";

  const parsed = querySchema.safeParse({
    categoryId: request.nextUrl.searchParams.get("categoryId"),
    cityId: request.nextUrl.searchParams.get("cityId"),
    search: request.nextUrl.searchParams.get("search"),
    lat: request.nextUrl.searchParams.get("lat"),
    lng: request.nextUrl.searchParams.get("lng"),
    radiusKm: request.nextUrl.searchParams.get("radiusKm"),
  });

  if (!parsed.success) {
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
    const points = await orderService.listMapPoints(parsed.data);
    return apiSuccess({ points });
  } catch (error) {
    console.error("[API/ORDERS/MAP_POINTS] Error:", error);
    return apiError("Failed to fetch order map points", 500);
  }
}
