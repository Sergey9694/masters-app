import { NextRequest } from "next/server";
import { orderService } from "@/services/order.service";
import { apiSuccess, apiUnauthorized, apiError } from "@/shared/lib/api-helpers";
import { getSessionFromRequest } from "@/shared/lib/auth";

type Params = { params: Promise<{ id: string }> };

/**
 * POST /api/v1/orders/[id]/complete — завершить заказ
 */
export async function POST(request: NextRequest, { params }: Params) {
  const session = await getSessionFromRequest(request);
  if (!session) return apiUnauthorized();

  const { id } = await params;

  try {
    const result = await orderService.complete(id, session.userId);
    return apiSuccess(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to complete order";
    console.error("[API/ORDERS/:id/COMPLETE] Error:", error);
    return apiError(message, 400);
  }
}
