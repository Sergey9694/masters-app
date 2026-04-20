import { NextRequest } from "next/server";
import { apiSuccess, apiUnauthorized, apiError } from "@/shared/lib/api-helpers";
import { encrypt, getSessionFromRequest } from "@/shared/lib/auth";

const ONE_DAY = 24 * 60 * 60 * 1000;

/**
 * POST /api/v1/auth/refresh — продлить сессию (возвращает новый JWT)
 */
export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return apiUnauthorized();

  try {
    const expires = new Date(Date.now() + ONE_DAY);
    const token = await encrypt({
      userId: session.userId,
      role: session.role,
      expires,
    });
    return apiSuccess({ token, expires: expires.toISOString() });
  } catch (error) {
    console.error("[API/AUTH/REFRESH] Error:", error);
    return apiError("Failed to refresh token", 500);
  }
}
