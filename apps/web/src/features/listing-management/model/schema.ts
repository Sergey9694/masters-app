import { z } from "zod";

export const createListingSchema = z.object({
  title: z.string().min(5, "Минимум 5 символов").max(120, "Максимум 120 символов"),
  description: z.string().min(20, "Минимум 20 символов").max(2000, "Максимум 2000 символов"),
  categoryId: z.string().min(1, "Выберите категорию"),
  cityId: z.string().min(1, "Выберите город"),
  priceFrom: z.number().min(0).optional(),
  priceTo: z.number().min(0).optional(),
  priceUnit: z.enum(["PER_HOUR", "PER_SERVICE", "PER_METER", "NEGOTIABLE"]).optional(),
  address: z.string().max(200).optional(),
  images: z.array(z.string().url()).max(8).optional(),
});

export const updateListingSchema = createListingSchema.partial().extend({
  id: z.string().min(1),
});

export const toggleListingSchema = z.object({
  id: z.string().min(1),
  currentStatus: z.enum(["ACTIVE", "PAUSED"]),
});

export const deleteListingSchema = z.object({
  id: z.string().min(1),
});

export type CreateListingInput = z.infer<typeof createListingSchema>;
export type UpdateListingInput = z.infer<typeof updateListingSchema>;
