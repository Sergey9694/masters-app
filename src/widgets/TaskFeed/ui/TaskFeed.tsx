import { db } from "@/shared/lib/db";
import { TaskFeedClient } from "./TaskFeedClient";
import type { TaskCardData } from "@/shared/types/domain";
import { getCurrentUser } from "@/shared/lib/get-user";

const PAGE_SIZE = 10;

interface TaskFeedProps {
  categoryId?: string;
  search?: string;
}

export async function TaskFeed({ categoryId, search }: TaskFeedProps) {
  const user = await getCurrentUser();
  const where: Record<string, any> = { status: "OPEN" as const };
  let isDefaultFilter = false;

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

  const [tasks, total] = await Promise.all([
    db.taskRequest.findMany({
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
        customer: { select: { firstName: true, avatar: true } },
      },
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE + 1,
    }),
    db.taskRequest.count({ where }),
  ]);

  const hasMore = tasks.length > PAGE_SIZE;
  const page = (hasMore ? tasks.slice(0, PAGE_SIZE) : tasks) as TaskCardData[];
  const nextCursor = hasMore ? page[page.length - 1].id : null;

  return (
    <TaskFeedClient
      key={`${categoryId ?? 'all'}-${search ?? ''}`}
      initialTasks={page}
      initialCursor={nextCursor}
      categoryId={categoryId}
      search={search}
      totalLabel={`${total} активных`}
      isDefaultFilter={isDefaultFilter}
    />
  );
}
