import { db } from "@/shared/lib/db";
import { Role } from "@/shared/types/auth";
import { getSession } from "@/shared/lib/auth";

export async function getUsers(params: {
  page?: number;
  search?: string;
  role?: Role;
}) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    throw new Error("Forbidden: Admin access required");
  }
  const page = params.page ?? 1;
  const pageSize = 10;
  const skip = (page - 1) * pageSize;

  const where: Record<string, unknown> = {};

  if (params.search) {
    where.OR = [
      { firstName: { contains: params.search, mode: "insensitive" as const } },
      { telegramId: Number.isFinite(Number(params.search)) ? { equals: BigInt(params.search) } : undefined },
    ].filter(Boolean);
  }

  if (params.role) {
    where.role = params.role;
  }

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      select: {
        id: true,
        telegramId: true,
        firstName: true,
        lastName: true,
        avatar: true,
        role: true,
        phone: true,
        createdAt: true,
        providerProfile: {
          select: {
            id: true,
            isVerified: true,
            rating: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    db.user.count({ where }),
  ]);

  return {
    users,
    total,
    page,
    totalPages: Math.ceil(total / pageSize),
  };
}
