"use server";

import { db } from "@/shared/lib/db";
import type { OrderCardData } from "@/shared/types/domain";
import { getCurrentUser } from "@/shared/lib/get-user";

import { DEFAULT_PAGE_SIZE as PAGE_SIZE } from "@/shared/lib/constants";

interface LoadOrdersParams {
  categoryId?: string;
  search?: string;
  cursor?: string; // id of last order
}

interface LoadOrdersResult {
  orders: OrderCardData[];
  nextCursor: string | null;
}

export async function loadOrdersAction(
  params: LoadOrdersParams,
): Promise<LoadOrdersResult> {
  const { categoryId, search, cursor } = params;
  const user = await getCurrentUser();

  const where: any = { status: "OPEN" as const };
  
  // 1. Если категория выбрана явно (и это не "все")
  if (categoryId && categoryId !== 'all') {
    where.categoryId = categoryId;
  } 
  // 2. Если категория НЕ выбрана, но пользователь - провайдер (ставим умный дефолт)
  else if (!categoryId && user?.providerProfile) {
    const providerCategories = await db.providerCategory.findMany({
      where: { providerId: user.providerProfile.id },
      select: { categoryId: true },
    });
    if (providerCategories.length > 0) {
      where.categoryId = { in: providerCategories.map(mc => mc.categoryId) };
    }
  }
  // 3. Если categoryId === 'all', фильтр не добавляем (показываем всё)

  if (search && search.trim().length >= 2) {
    where.OR = [
      { title: { contains: search.trim(), mode: "insensitive" } },
      { description: { contains: search.trim(), mode: "insensitive" } },
    ];
  }

  const ordersRaw = await db.order.findMany({
    where,
    select: {
      id: true,
      title: true,
      description: true,
      images: true,
      budget: true,
      address: true,
      createdAt: true,
      status: true,
      category: { select: { name: true } },
      client: { select: { firstName: true, avatar: true } },
    },
    orderBy: { createdAt: "desc" },
    take: PAGE_SIZE + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
  });

  const hasMore = ordersRaw.length > PAGE_SIZE;
  const page = hasMore ? ordersRaw.slice(0, PAGE_SIZE) : ordersRaw;
  const nextCursor = hasMore ? page[page.length - 1].id : null;

  return { orders: page as OrderCardData[], nextCursor };
}
