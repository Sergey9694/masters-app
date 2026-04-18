import { db } from "@/shared/lib/db";
import { notify } from "@/shared/lib/telegram/bot-notify";
import { logAudit } from "@/shared/lib/audit";

export interface CreateReviewInput {
  orderId: string;
  authorId: string;
  rating: number;
  text?: string;
}

export const reviewService = {
  /**
   * Create a review for a provider based on a completed order
   */
  async create(data: CreateReviewInput) {
    const order = await db.order.findUnique({
      where: { id: data.orderId },
      select: {
        id: true,
        title: true,
        clientId: true,
        status: true,
        assignedProviderId: true,
        assignedProvider: { select: { userId: true } },
        review: { select: { id: true } },
      },
    });

    if (!order) throw new Error("Заявка не найдена");
    if (order.clientId !== data.authorId) {
      throw new Error("Отзыв может оставить только автор заявки");
    }
    if (order.status !== "COMPLETED") {
      throw new Error("Отзыв можно оставить только после завершения");
    }
    if (!order.assignedProviderId) {
      throw new Error("По этой заявке нет выбранного мастера");
    }
    if (order.review) {
      throw new Error("Отзыв уже оставлен");
    }

    const providerId = order.assignedProviderId!;

    // Create review and recalculate provider rating in transaction
    await db.$transaction(async (tx) => {
      await tx.review.create({
        data: {
          orderId: data.orderId,
          providerId,
          authorId: data.authorId,
          rating: data.rating,
          text: data.text || null,
        },
      });

      const agg = await tx.review.aggregate({
        where: { providerId },
        _avg: { rating: true },
      });

      await tx.providerProfile.update({
        where: { id: providerId },
        data: { rating: agg._avg.rating ?? 5 },
      });

      await logAudit({
        userId: data.authorId,
        action: "CREATE",
        entity: "Review",
        entityId: data.orderId,
        metadata: { rating: data.rating },
      });
    });

    // Notify provider about new review
    if (order.assignedProvider) {
      await notify({
        userId: order.assignedProvider.userId,
        type: "NEW_REVIEW",
        title: "Новый отзыв",
        body: `Вам оставили отзыв (${data.rating}★) за «${order.title}»`,
        referenceId: data.orderId,
      });
    }

    return { success: true };
  },

  /**
   * Get reviews for a provider
   */
  async getByProvider(providerId: string) {
    return db.review.findMany({
      where: { providerId },
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }
};
