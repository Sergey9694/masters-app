import { z } from "zod";

export const createListingSchema = z.object({
  title: z
    .string()
    .min(5, { message: "Заголовок должен быть не менее 5 символов" })
    .max(100, { message: "Заголовок слишком длинный" }),
  description: z
    .string()
    .min(20, { message: "Опишите услугу подробнее (минимум 20 символов)" })
    .max(2000, { message: "Описание слишком длинное" }),
  categoryId: z.string().min(1, { message: "Выберите категорию" }),
  cityId: z.string().min(1, { message: "Выберите город" }),
  priceFrom: z.number().min(0).optional().nullable(),
  priceTo: z.number().min(0).optional().nullable(),
  priceUnit: z.enum(['PER_HOUR', 'PER_SERVICE', 'PER_METER', 'NEGOTIABLE']).default('PER_SERVICE'),
  images: z.array(z.string()).min(1, "Добавьте хотя бы одно фото"),
  address: z.string().optional(),
});

export const updateListingSchema = createListingSchema.partial();

export type CreateListingInput = z.infer<typeof createListingSchema>;
export type UpdateListingInput = z.infer<typeof updateListingSchema>;
