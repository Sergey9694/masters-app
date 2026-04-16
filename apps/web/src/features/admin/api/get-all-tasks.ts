import { db } from "@/shared/lib/db";
import { TaskStatus } from "@prisma/client";

export async function getAllTasks(params: {
  page?: number;
  status?: TaskStatus;
  search?: string;
}) {
  const page = params.page ?? 1;
  const pageSize = 10;
  const skip = (page - 1) * pageSize;

  const where: Record<string, unknown> = {};

  if (params.status) {
    where.status = params.status;
  }

  if (params.search) {
    where.OR = [
      { title: { contains: params.search, mode: "insensitive" as const } },
      { description: { contains: params.search, mode: "insensitive" as const } },
    ];
  }

  const [tasks, total] = await Promise.all([
    db.taskRequest.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        budget: true,
        address: true,
        createdAt: true,
        customer: {
          select: { firstName: true, avatar: true },
        },
        category: { select: { name: true } },
        assignedMaster: {
          select: {
            id: true,
            user: { select: { firstName: true } },
          },
        },
        _count: { select: { responses: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    db.taskRequest.count({ where }),
  ]);

  return { tasks, total, page, totalPages: Math.ceil(total / pageSize) };
}
