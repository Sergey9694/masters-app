import { db } from "@/shared/lib/db";

export async function getPendingMasters(params: { page?: number } = {}) {
  const page = params.page ?? 1;
  const pageSize = 10;
  const skip = (page - 1) * pageSize;

  const where = { isVerified: false };

  const [profiles, total] = await Promise.all([
    db.providerProfile.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            telegramId: true,
            createdAt: true,
          },
        },
        categories: {
          include: { category: true },
        },
        proposals: { select: { id: true } },
        reviews: { select: { id: true, rating: true } },
        assignedTasks: { select: { id: true, status: true } },
      },
      orderBy: { user: { createdAt: "desc" } },
      skip,
      take: pageSize,
    }),
    db.providerProfile.count({ where }),
  ]);

  const mapped = profiles.map((p) => ({
    ...p,
    responsesCount: p.proposals.length,
    reviewsCount: p.reviews.length,
    rating:
      p.reviews.length > 0
        ? p.reviews.reduce((sum, r) => sum + r.rating, 0) / p.reviews.length
        : 0,
    completedTasks: p.assignedTasks.filter((t) => t.status === "COMPLETED").length,
  }));

  return {
    providers: mapped,
    total,
    page,
    totalPages: Math.ceil(total / pageSize),
  };
}
