import { NextRequest } from "next/server";
import { notificationService } from "@/services/notification.service";
import { apiSuccess, apiUnauthorized, apiError } from "@/shared/lib/api-helpers";
import { getSessionFromRequest } from "@/shared/lib/auth";

type Params = { params: Promise<{ id: string }> };

/**
 * POST /api/v1/notifications/[id]/read — отметить уведомление как прочитанное
 */
export async function POST(request: NextRequest, { params }: Params) {
  const session = await getSessionFromRequest(request);
  if (!session) return apiUnauthorized();

  const { id } = await params;
  try {
    await notificationService.markAsRead(id, session.userId);
    return apiSuccess({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to mark as read";
    console.error("[API/NOTIFICATIONS/:id/READ] Error:", error);
    return apiError(message, 400);
  }
}
