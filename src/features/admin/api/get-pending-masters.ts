import { db } from "@/shared/lib/db";

export async function getPendingMasters() {
  const profiles = await db.masterProfile.findMany({
    where: { isVerified: false },
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
      responses: { select: { id: true } },
      reviews: { select: { id: true, rating: true } },
      assignedTasks: { select: { id: true, status: true } },
    },
    orderBy: { user: { createdAt: "desc" } },
  });

  return profiles.map((p) => ({
    ...p,
    responsesCount: p.responses.length,
    reviewsCount: p.reviews.length,
    avgReviewRating:
      p.reviews.length > 0
        ? p.reviews.reduce((sum, r) => sum + r.rating, 0) / p.reviews.length
        : 0,
    completedTasks: p.assignedTasks.filter((t) => t.status === "COMPLETED").length,
  }));
}
