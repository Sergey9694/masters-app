import { z } from "zod";

export const createProposalSchema = z.object({
  orderId: z.string().min(1),
  price: z
    .string()
    .optional()
    .refine((v) => !v || !Number.isNaN(Number(v)), { message: "Цена должна быть числом" }),
  message: z
    .string()
    .min(10, { message: "Опишите предложение (минимум 10 символов)" })
    .max(500, { message: "Сообщение слишком длинное" }),
});

export type CreateProposalInput = z.infer<typeof createProposalSchema>;
