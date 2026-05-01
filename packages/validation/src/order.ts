import { z } from "zod";

export const createOrderSchema = z.object({
  title: z
    .string()
    .min(5, { message: "Заголовок должен быть не менее 5 символов" })
    .max(100, { message: "Заголовок слишком длинный" }),
  description: z
    .string()
    .min(10, { message: "Опишите проблему подробнее (минимум 10 символов)" })
    .max(1000, { message: "Описание слишком длинное" }),
  categoryId: z.string().min(1, { message: "Пожалуйста, выберите категорию" }),
  cityId: z.string().min(1, { message: "Пожалуйста, выберите город" }),
  budget: z
    .string()
    .optional()
    .refine(
      (v) => !v || (!isNaN(Number(v)) && Number(v) >= 0),
      { message: "Бюджет не может быть отрицательным" }
    ),
  address: z.string().min(5, "Адрес слишком короткий").optional(),
  lat: z.number().optional().nullable(),
  lng: z.number().optional().nullable(),
  images: z.array(z.string()).optional(),
});

export const updateOrderSchema = createOrderSchema.partial();

export const bboxSchema = z.object({
  minLat: z.number(),
  minLng: z.number(),
  maxLat: z.number(),
  maxLng: z.number(),
});

export const orderMapParamsSchema = z.object({
  categoryId: z.string().optional(),
  cityId: z.string().optional(),
  search: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  radiusKm: z.number().optional(),
  bbox: bboxSchema.optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;
export type OrderMapParams = z.infer<typeof orderMapParamsSchema>;
export type BBox = z.infer<typeof bboxSchema>;
