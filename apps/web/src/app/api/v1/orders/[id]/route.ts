import { NextRequest } from "next/server";
import { orderService } from "@/services/order.service";
import { apiSuccess, apiUnauthorized, apiError } from "@/shared/lib/api-helpers";
import { getSessionFromRequest } from "@/shared/lib/auth";
import { updateOrderSchema } from "@uslugi/validation";

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/v1/orders/[id]
 */
export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;

  try {
    const order = await orderService.getById(id);
    if (!order) return apiError("Order not found", 404);
    return apiSuccess(order);
  } catch (error) {
    console.error("[API/ORDERS/:id/GET] Error:", error);
    return apiError("Failed to fetch order", 500);
  }
}

/**
 * PATCH /api/v1/orders/[id]
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await getSessionFromRequest(request);
  if (!session) return apiUnauthorized();

  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = updateOrderSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation failed", 400, parsed.error.flatten());
    }

    const updated = await orderService.update(id, parsed.data, session.userId);
    return apiSuccess(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update order";
    console.error("[API/ORDERS/:id/PATCH] Error:", error);
    return apiError(message, 400);
  }
}

/**
 * DELETE /api/v1/orders/[id] — отменить заказ
 */
export async function DELETE(request: NextRequest, { params }: Params) {
  const session = await getSessionFromRequest(request);
  if (!session) return apiUnauthorized();

  const { id } = await params;

  try {
    const result = await orderService.cancel(id, session.userId);
    return apiSuccess(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to cancel order";
    console.error("[API/ORDERS/:id/DELETE] Error:", error);
    return apiError(message, 400);
  }
}
