"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/shared/lib/db";
import { getCurrentUser } from "@/shared/lib/get-user";
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
  const { taskId, rating, text } = parsed.data;

  try {
    const task = await db.taskRequest.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        customerId: true,
        status: true,
        assignedMasterId: true,
        review: { select: { id: true } },
      },
    });
    if (!task) return { error: "Заявка не найдена" };
    if (task.customerId !== user.id) {
      return { error: "Отзыв может оставить только автор заявки" };
    }
    if (task.status !== "COMPLETED") {
      return { error: "Отзыв можно оставить только после завершения" };
    }
    if (!task.assignedMasterId) {
      return { error: "По этой заявке нет выбранного мастера" };
    }
    if (task.review) {
      return { error: "Отзыв уже оставлен" };
    }

    // Создаём отзыв + пересчитываем рейтинг мастера в транзакции
    await db.$transaction(async (tx) => {
      await tx.review.create({
        data: {
          taskId,
          masterId: task.assignedMasterId!,
          authorId: user.id,
          rating,
          text: text || null,
        },
      });

      const agg = await tx.review.aggregate({
        where: { masterId: task.assignedMasterId! },
        _avg: { rating: true },
      });
      await tx.masterProfile.update({
        where: { id: task.assignedMasterId! },
        data: { rating: agg._avg.rating ?? 5 },
      });
    });

    revalidatePath(`/dashboard/task/${taskId}`);
    return { success: true };
  } catch (error) {
    console.error("[createReviewAction] error:", error);
    return { error: "Не удалось сохранить отзыв" };
  }
}
