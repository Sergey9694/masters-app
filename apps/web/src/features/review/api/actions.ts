"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/shared/lib/db";
import { notify } from "@/shared/lib/telegram/bot-notify";
import { reviewSchema } from "../model/schema";
import { authActionClient } from "@/shared/lib/safe-action";
import { logAudit } from "@/shared/lib/audit";

/**
 * Создать отзыв об исполнителе
 */
export const createReviewAction = authActionClient
  .schema(reviewSchema)
  .action(async ({ parsedInput: { referenceId, rating, text }, ctx }) => {
    const { userId } = ctx;

    try {
      const order = await db.order.findUnique({
        where: { id: referenceId },
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
      if (order.clientId !== userId) {
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

      // Создаём отзыв + пересчитываем рейтинг мастера в транзакции
      await db.$transaction(async (tx) => {
        await tx.review.create({
          data: {
            orderId: referenceId,
            providerId: order.assignedProviderId!,
            authorId: userId,
            rating,
            text: text || null,
          },
        });

        const agg = await tx.review.aggregate({
          where: { providerId: order.assignedProviderId! },
          _avg: { rating: true },
        });

        await tx.providerProfile.update({
          where: { id: order.assignedProviderId! },
          data: { rating: agg._avg.rating ?? 5 },
        });

        await logAudit({
          userId,
          action: "CREATE",
          entity: "Review",
          entityId: referenceId,
          metadata: { rating },
        });
      });

      // Notify provider about new review
      if (order.assignedProvider) {
        await notify({
          userId: order.assignedProvider.userId,
          type: "NEW_REVIEW",
          title: "Новый отзыв",
          body: `Вам оставили отзыв (${rating}★) за «${order.title}»`,
          referenceId,
        });
      }

      revalidatePath(`/dashboard/order/${referenceId}`);
      revalidatePath("/dashboard/feed");
      
      return { success: true };
    } catch (error: any) {
      console.error("[createReviewAction] error:", error);
      throw error instanceof Error ? error : new Error("Не удалось сохранить отзыв");
    }
  });
