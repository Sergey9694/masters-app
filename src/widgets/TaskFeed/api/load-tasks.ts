"use server";

import { db } from "@/shared/lib/db";
import type { TaskCardData } from "@/shared/types/domain";

const PAGE_SIZE = 10;

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

  const where: Record<string, unknown> = { status: "OPEN" as const };
  if (categoryId) where.categoryId = categoryId;
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
      budget: true,
      address: true,
      createdAt: true,
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
