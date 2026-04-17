import { z } from "zod";

export const providerProfileSchema = z.object({
  bio: z
    .string()
    .min(20, { message: "Расскажите о себе подробнее (минимум 20 символов)" })
    .max(500, { message: "Описание слишком длинное" }),
  categoryIds: z
    .array(z.string().min(1))
    .min(1, { message: "Выберите хотя бы одну категорию" })
    .max(8, { message: "Не больше 8 категорий" }),
  experienceYears: z.union([z.number(), z.string().min(1)])
    .transform((v) => Number(v))
    .pipe(z.number().min(0, "Стаж не может быть отрицательным").max(50, "Ого, солидный стаж! Но давайте ограничимся 50")),
  minPrice: z.union([z.number(), z.string().min(1)])
    .transform((v) => Number(v))
    .pipe(z.number().min(0, "Цена не может быть отрицательной")),
  portfolio: z.array(z.string()),
  avatarUrl: z.string().optional(),
});

export const updateProfileSchema = z.object({
  displayName: z.string().min(2, "Слишком короткое имя").max(50, "Слишком длинное имя"),
  cityId: z.string().min(1, "Выберите город"),
  avatarUrl: z.string().optional(),
});

export type ProviderProfileInput = z.infer<typeof providerProfileSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// Backward compatibility aliases
export type MasterProfileFormValues = ProviderProfileInput;
export type MasterProfileFormInput = z.input<typeof providerProfileSchema>;
