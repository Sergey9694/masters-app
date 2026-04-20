import { NextRequest } from "next/server";
import { notificationService } from "@/services/notification.service";
import { apiSuccess, apiUnauthorized, apiError } from "@/shared/lib/api-helpers";
import { getSessionFromRequest } from "@/shared/lib/auth";

/**
 * GET /api/v1/notifications — мои уведомления
 */
export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return apiUnauthorized();

  try {
    const { searchParams } = request.nextUrl;
    const cursor = searchParams.get("cursor") || undefined;
    const pageSize = searchParams.get("pageSize")
      ? parseInt(searchParams.get("pageSize")!)
      : undefined;

    const result = await notificationService.list(session.userId, pageSize, cursor);
    return apiSuccess(result);
  } catch (error) {
    console.error("[API/NOTIFICATIONS/GET] Error:", error);
    return apiError("Failed to fetch notifications", 500);
  }
}
