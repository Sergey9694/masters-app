import { z } from "zod";

export const taskResponseSchema = z.object({
  taskId: z.string().min(1),
  price: z
    .string()
    .optional()
    .refine((v) => !v || !Number.isNaN(Number(v)), { message: "Цена должна быть числом" }),
  message: z
    .string()
    .min(10, { message: "Опишите предложение (минимум 10 символов)" })
    .max(500, { message: "Сообщение слишком длинное" }),
});

export type TaskResponseFormValues = z.infer<typeof taskResponseSchema>;
