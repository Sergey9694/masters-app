import { NextRequest } from "next/server";
import { orderService, OrderListParams } from "@/services/order.service";
import { apiSuccess, apiUnauthorized, apiError } from "@/shared/lib/api-helpers";
import { getSessionFromRequest } from "@/shared/lib/auth";
import { createOrderSchema } from "@uslugi/validation";

/**
 * GET /api/v1/orders?categoryId=...&search=...&cursor=...
 */
export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  
  // В публичной ленте сессия опциональна, но для персональной ленты нужна
  const userId = session?.userId;

  try {
    const { searchParams } = request.nextUrl;
    const params: OrderListParams = {
      categoryId: searchParams.get("categoryId") || undefined,
      search: searchParams.get("search") || undefined,
      cursor: searchParams.get("cursor") || undefined,
      pageSize: searchParams.get("pageSize") ? parseInt(searchParams.get("pageSize")!) : undefined,
    };

    const result = await orderService.list(params, userId);
    return apiSuccess(result);
  } catch (error) {
    console.error("[API/ORDERS/GET] Error:", error);
    return apiError("Failed to fetch orders", 500);
  }
}

/**
 * POST /api/v1/orders
 */
export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return apiUnauthorized();
  }

  try {
    const body = await request.json();
    const parsed = createOrderSchema.safeParse(body);
    
    if (!parsed.success) {
      return apiError("Validation failed", 400, parsed.error.flatten());
    }

    const order = await orderService.create(parsed.data, session.userId);
    return apiSuccess(order, 201);
  } catch (error) {
    console.error("[API/ORDERS/POST] Error:", error);
    return apiError("Failed to create order", 500);
  }
}
