"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/shared/lib/db";
import { getCurrentUser } from "@/shared/lib/get-user";
import { notify } from "@/shared/lib/telegram/bot-notify";
import { reviewSchema, type ReviewFormValues } from "../model/schema";

type Result = { success: true } | { error: string };

export async function createReviewAction(
  data: ReviewFormValues,
): Promise<Result> {
  const user = await getCurrentUser();
  if (!user) return { error: "Необходима авторизация" };

  const parsed = reviewSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Неверные данные" };
  }
  const { orderId, rating, text } = parsed.data;

  try {
    const order = await db.order.findUnique({
      where: { id: orderId },
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
    if (!order) return { error: "Заявка не найдена" };
    if (order.clientId !== user.id) {
      return { error: "Отзыв может оставить только автор заявки" };
    }
    if (order.status !== "COMPLETED") {
      return { error: "Отзыв можно оставить только после завершения" };
    }
    if (!order.assignedProviderId) {
      return { error: "По этой заявке нет выбранного мастера" };
    }
    if (order.review) {
      return { error: "Отзыв уже оставлен" };
    }

    // Создаём отзыв + пересчитываем рейтинг мастера в транзакции
    await db.$transaction(async (tx) => {
      await tx.review.create({
        data: {
          orderId,
          providerId: order.assignedProviderId!,
          authorId: user.id,
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
    });

    // Notify provider about new review
    if (order.assignedProvider) {
      await notify({
        userId: order.assignedProvider.userId,
        type: "NEW_REVIEW",
        title: "Новый отзыв",
        body: `Вам оставили отзыв (${rating}★) за «${order.title}»`,
        orderId,
      });
    }

    revalidatePath(`/dashboard/order/${orderId}`);
    return { success: true };
  } catch (error) {
    console.error("[createReviewAction] error:", error);
    return { error: "Не удалось сохранить отзыв" };
  }
}
