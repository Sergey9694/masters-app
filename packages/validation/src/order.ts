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
  images: z.array(z.string()).optional(),
  executionDate: z.coerce.date().optional().nullable(),
});

export const updateOrderSchema = createOrderSchema.partial();

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;
