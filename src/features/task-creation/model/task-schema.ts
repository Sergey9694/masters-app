import { z } from "zod";

export const taskSchema = z.object({
  title: z
    .string()
    .min(5, { message: "Заголовок должен быть не менее 5 символов" })
    .max(100, { message: "Заголовок слишком длинный" }),
  description: z
    .string()
    .min(10, { message: "Опишите проблему подробнее (минимум 10 символов)" })
    .max(1000, { message: "Описание слишком длинное" }),
  categoryId: z.string().min(1, { message: "Пожалуйста, выберите категорию" }),
  budget: z.string().optional(),
  address: z
    .string()
    .min(3, { message: "Укажите адрес или ориентир" }),
});

export type TaskFormValues = z.infer<typeof taskSchema>;
