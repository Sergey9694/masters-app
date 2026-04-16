"use server";

import { getSession } from "@/shared/lib/auth";
import { db } from "@/shared/lib/db";
import { revalidatePath } from "next/cache";

export async function deleteReview(reviewId: string) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    throw new Error("Forbidden");
  }

  const review = await db.review.findUnique({
    where: { id: reviewId },
    select: { providerId: true },
  });

  await db.review.delete({ where: { id: reviewId } });

  // Пересчитать рейтинг мастера
  if (review) {
    const stats = await db.review.aggregate({
      where: { providerId: review.providerId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    const newRating = stats._count.rating > 0 ? Number(stats._avg.rating) : 5.0;
    await db.providerProfile.update({
      where: { id: review.providerId },
      data: { rating: newRating },
    });
  }

  revalidatePath("/admin/reviews");
}
