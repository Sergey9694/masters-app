import { orderService, type OrderSort } from "@/services/order.service";
import { getCurrentUser } from "@/shared/lib/get-user";

import { OrderFeedClient } from "./OrderFeedClient";

interface OrderFeedProps {
  categoryId?: string;
  cityId?: string;
  search?: string;
  sort?: OrderSort;
}

export async function OrderFeed({ categoryId, cityId, search, sort }: OrderFeedProps) {
  const user = await getCurrentUser();

  const { orders, nextCursor, totalCount } = await orderService.list(
    { categoryId, cityId, search, sort },
    user?.id
  );

  const isDefaultFilter = !categoryId && !cityId && !!user?.providerProfile;

  return (
    <OrderFeedClient
      key={`${categoryId ?? "all"}-${cityId ?? ""}-${search ?? ""}-${sort ?? "new"}-${totalCount}`}
      initialTasks={orders}
      initialCursor={nextCursor}
      categoryId={categoryId}
      cityId={cityId}
      search={search}
      sort={sort}
      totalLabel={`${totalCount} ${pluralize(totalCount, ["заказ", "заказа", "заказов"])}`}
      isDefaultFilter={isDefaultFilter}
    />
  );
}

function pluralize(n: number, forms: [string, string, string]): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1];
  return forms[2];
}
