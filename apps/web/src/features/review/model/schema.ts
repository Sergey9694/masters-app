import { z } from "zod";

export const reviewSchema = z.object({
  taskId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  text: z.string().max(500, "Отзыв слишком длинный").optional(),
});

export type ReviewFormValues = z.infer<typeof reviewSchema>;
