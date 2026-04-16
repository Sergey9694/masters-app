import { db } from "@/shared/lib/db";
import { OrderFeedClient } from "./OrderFeedClient";
import type { OrderCardData } from "@/shared/types/domain";
import { getCurrentUser } from "@/shared/lib/get-user";

import { DEFAULT_PAGE_SIZE as PAGE_SIZE } from "@/shared/lib/constants";

interface OrderFeedProps {
  categoryId?: string;
  search?: string;
}

export async function OrderFeed({ categoryId, search }: OrderFeedProps) {
  const user = await getCurrentUser();
  const where: Record<string, any> = { status: "OPEN" as const };
  let isDefaultFilter = false;

  // 1. Если категория выбрана явно (и это не "все")
  if (categoryId && categoryId !== 'all') {
    where.categoryId = categoryId;
  } 
  // 2. Если категория НЕ выбрана, но пользователь - мастер (ставим умный дефолт)
  else if (!categoryId && user?.providerProfile) {
    const masterCategories = await db.providerCategory.findMany({
      where: { providerId: user.providerProfile.id },
      select: { categoryId: true },
    });

    if (masterCategories.length > 0) {
      where.categoryId = { in: masterCategories.map(mc => mc.categoryId) };
      isDefaultFilter = true;
    }
  }
  // 3. Если categoryId === 'all', фильтр не добавляем (показываем всё)

  if (search && search.trim().length >= 2) {
    where.OR = [
      { title: { contains: search.trim(), mode: "insensitive" } },
      { description: { contains: search.trim(), mode: "insensitive" } },
    ];
  }

  const [orders, total] = await Promise.all([
    db.order.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        images: true,
        budget: true,
        address: true,
        createdAt: true,
        category: { select: { name: true } },
        client: { select: { firstName: true, avatar: true } },
        status: true,
        _count: { select: { proposals: true } },
      },
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE + 1,
    }),
    db.order.count({ where }),
  ]);

  const hasMore = orders.length > PAGE_SIZE;
  const page = (hasMore ? orders.slice(0, PAGE_SIZE) : orders) as OrderCardData[];
  const nextCursor = hasMore ? page[page.length - 1].id : null;

  return (
    <OrderFeedClient
      key={`${categoryId ?? 'all'}-${search ?? ''}-${total}`}
      initialTasks={page}
      initialCursor={nextCursor}
      categoryId={categoryId}
      search={search}
      totalLabel={`${total} активных`}
      isDefaultFilter={isDefaultFilter}
    />
  );
}
