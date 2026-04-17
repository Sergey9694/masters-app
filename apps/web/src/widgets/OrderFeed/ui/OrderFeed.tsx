import { db } from "@/shared/lib/db";
import { OrderFeedClient } from "./OrderFeedClient";
import type { OrderCardData } from "@/shared/types/domain";
import { getCurrentUser } from "@/shared/lib/get-user";
import { DEFAULT_PAGE_SIZE as PAGE_SIZE } from "@/shared/lib/constants";
import { orderService } from "@/services/order.service";

interface OrderFeedProps {
  categoryId?: string;
  search?: string;
}

export async function OrderFeed({ categoryId, search }: OrderFeedProps) {
  const user = await getCurrentUser();
  
  const { orders, nextCursor } = await orderService.list({
    categoryId,
    search,
  }, user?.id);

  // We still need total count for the label
  const total = await db.order.count({ 
    where: { 
      status: "OPEN",
      ...(categoryId && categoryId !== 'all' ? { categoryId } : {})
    } 
  });

  const isDefaultFilter = !categoryId && !!user?.providerProfile;

  return (
    <OrderFeedClient
      key={`${categoryId ?? 'all'}-${search ?? ''}-${total}`}
      initialTasks={orders}
      initialCursor={nextCursor}
      categoryId={categoryId}
      search={search}
      totalLabel={`${total} активных`}
      isDefaultFilter={isDefaultFilter}
    />
  );
}
