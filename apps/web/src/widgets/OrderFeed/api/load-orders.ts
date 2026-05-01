"use server";

import type { OrderCardData } from "@/shared/types/domain";
import { getCurrentUser } from "@/shared/lib/get-user";
import type { OrderSort } from "@/services/order.service";

interface LoadOrdersParams {
  categoryId?: string;
  cityId?: string;
  search?: string;
  sort?: OrderSort;
  cursor?: string; // id of last order
  lat?: number;
  lng?: number;
  radiusKm?: number;
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
