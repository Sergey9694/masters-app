import { db } from "@/shared/lib/db";

export async function getAllReviews(params: { page?: number }) {
  const page = params.page ?? 1;
  const pageSize = 20;
  const skip = (page - 1) * pageSize;

  const [reviews, total] = await Promise.all([
    db.review.findMany({
      select: {
        id: true,
        rating: true,
        text: true,
        createdAt: true,
        author: { select: { firstName: true, avatar: true } },
        master: {
          select: {
            id: true,
            user: { select: { firstName: true } },
            rating: true,
          },
        },
        task: { select: { title: true, status: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    db.review.count(),
  ]);

  return { reviews, total, page, totalPages: Math.ceil(total / pageSize) };
}
