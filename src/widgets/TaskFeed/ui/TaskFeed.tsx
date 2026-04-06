import { db } from "@/shared/lib/db";
import { TaskFeedClient } from "./TaskFeedClient";
import type { TaskCardData } from "@/shared/types/domain";

const PAGE_SIZE = 10;

interface TaskFeedProps {
  categoryId?: string;
  search?: string;
}

export async function TaskFeed({ categoryId, search }: TaskFeedProps) {
  const where: Record<string, unknown> = { status: "OPEN" as const };
  if (categoryId) where.categoryId = categoryId;
  if (search && search.trim().length >= 2) {
    where.OR = [
      { title: { contains: search.trim(), mode: "insensitive" } },
      { description: { contains: search.trim(), mode: "insensitive" } },
    ];
  }

  const [tasks, total] = await Promise.all([
    db.taskRequest.findMany({
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
    }),
    db.taskRequest.count({ where }),
  ]);

  const hasMore = tasks.length > PAGE_SIZE;
  const page: TaskCardData[] = hasMore ? tasks.slice(0, PAGE_SIZE) : tasks;
  const nextCursor = hasMore ? page[page.length - 1].id : null;

  return (
    <TaskFeedClient
      initialTasks={page}
      initialCursor={nextCursor}
      categoryId={categoryId}
      search={search}
      totalLabel={`${total} активных`}
    />
  );
}
