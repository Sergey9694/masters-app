"use server";

import { revalidatePath } from "next/cache";
import { reviewService } from "@/services/review.service";
import { reviewSchema } from "../model/schema";
import { authActionClient } from "@/shared/lib/safe-action";

/**
 * Создать отзыв об исполнителе
 */
export const createReviewAction = authActionClient
  .schema(reviewSchema)
  .action(async ({ parsedInput: { referenceId, rating, text }, ctx }) => {
    const { userId } = ctx;

    try {
      await reviewService.create({
        orderId: referenceId,
        authorId: userId,
        rating,
        text: text || undefined,
      });

      revalidatePath(`/dashboard/order/${referenceId}`);
      revalidatePath("/dashboard/feed");
      
      return { success: true };
    } catch (error: unknown) {
      console.error("[createReviewAction] error:", error);
      throw error instanceof Error ? error : new Error("Не удалось сохранить отзыв");
    }
  });
