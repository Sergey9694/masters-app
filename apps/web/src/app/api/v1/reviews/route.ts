import { NextRequest } from "next/server";
import { z } from "zod";
import { reviewService } from "@/services/review.service";
import { apiSuccess, apiUnauthorized, apiError } from "@/shared/lib/api-helpers";
import { getSessionFromRequest } from "@/shared/lib/auth";

const createReviewSchema = z.object({
  orderId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  text: z.string().max(500).optional(),
});

/**
 * POST /api/v1/reviews — оставить отзыв по завершённому заказу
 */
export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return apiUnauthorized();

  try {
    const body = await request.json();
    const parsed = createReviewSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation failed", 400, parsed.error.flatten());
    }

    const result = await reviewService.create({
      orderId: parsed.data.orderId,
      authorId: session.userId,
      rating: parsed.data.rating,
      text: parsed.data.text,
    });
    return apiSuccess(result, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create review";
    console.error("[API/REVIEWS/POST] Error:", error);
    return apiError(message, 400);
  }
}
