import { db } from "@/shared/lib/db";
import { OrderStatus } from "@prisma/client";

export async function getAllTasks(params: {
  page?: number;
  status?: OrderStatus;
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

  const [orders, total] = await Promise.all([
    db.order.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        budget: true,
        address: true,
        createdAt: true,
        client: {
          select: { firstName: true, avatar: true },
        },
        category: { select: { name: true } },
        assignedProvider: {
          select: {
            id: true,
            user: { select: { firstName: true } },
          },
        },
        _count: { select: { proposals: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    db.order.count({ where }),
  ]);

  return { orders, total, page, totalPages: Math.ceil(total / pageSize) };
}
