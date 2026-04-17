"use server";

import type { OrderCardData } from "@/shared/types/domain";
import { getCurrentUser } from "@/shared/lib/get-user";

interface LoadOrdersParams {
  categoryId?: string;
  search?: string;
  cursor?: string; // id of last order
}

interface LoadOrdersResult {
  orders: OrderCardData[];
  nextCursor: string | null;
}

import { orderService } from "@/services/order.service";

export async function loadOrdersAction(
  params: LoadOrdersParams,
): Promise<LoadOrdersResult> {
  const user = await getCurrentUser();
  
  return orderService.list(params, user?.id);
}
