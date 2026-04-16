"use server";

import { db } from "@/shared/lib/db";
import type { TaskCardData } from "@/shared/types/domain";
import { getCurrentUser } from "@/shared/lib/get-user";

import { DEFAULT_PAGE_SIZE as PAGE_SIZE } from "@/shared/lib/constants";

interface LoadTasksParams {
  categoryId?: string;
  search?: string;
  cursor?: string; // id of last task
}

interface LoadTasksResult {
  tasks: TaskCardData[];
  nextCursor: string | null;
}

export async function loadTasksAction(
  params: LoadTasksParams,
): Promise<LoadTasksResult> {
  const { categoryId, search, cursor } = params;
  const user = await getCurrentUser();

  const where: Record<string, any> = { status: "OPEN" as const };
  
  // 1. Если категория выбрана явно (и это не "все")
  if (categoryId && categoryId !== 'all') {
    where.categoryId = categoryId;
  } 
  // 2. Если категория НЕ выбрана, но пользователь - мастер (ставим умный дефолт)
  else if (!categoryId && user?.masterProfile) {
    const masterCategories = await db.masterCategory.findMany({
      where: { masterId: user.masterProfile.id },
      select: { categoryId: true },
    });
    if (masterCategories.length > 0) {
      where.categoryId = { in: masterCategories.map(mc => mc.categoryId) };
    }
  }
  // 3. Если categoryId === 'all', фильтр не добавляем (показываем всё)

  if (search && search.trim().length >= 2) {
    where.OR = [
      { title: { contains: search.trim(), mode: "insensitive" } },
      { description: { contains: search.trim(), mode: "insensitive" } },
    ];
  }

  const tasks = await db.taskRequest.findMany({
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
      customer: { select: { firstName: true, avatar: true } },
    },
    orderBy: { createdAt: "desc" },
    take: PAGE_SIZE + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
  });

  const hasMore = tasks.length > PAGE_SIZE;
  const page = hasMore ? tasks.slice(0, PAGE_SIZE) : tasks;
  const nextCursor = hasMore ? page[page.length - 1].id : null;

  return { tasks: page, nextCursor };
}
