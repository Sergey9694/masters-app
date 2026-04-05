import { z } from "zod";

export const masterProfileSchema = z.object({
  bio: z
    .string()
    .min(20, { message: "Расскажите о себе подробнее (минимум 20 символов)" })
    .max(500, { message: "Описание слишком длинное" }),
  categoryIds: z
    .array(z.string().min(1))
    .min(1, { message: "Выберите хотя бы одну категорию" })
    .max(8, { message: "Не больше 8 категорий" }),
});

export type MasterProfileFormValues = z.infer<typeof masterProfileSchema>;
