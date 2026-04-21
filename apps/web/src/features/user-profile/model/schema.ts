import { z } from "zod";

export const updateBasicProfileSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, "Имя слишком короткое")
    .max(50, "Имя слишком длинное"),
  lastName: z
    .string()
    .trim()
    .max(50, "Фамилия слишком длинная")
    .optional()
    .or(z.literal("")),
  displayName: z
    .string()
    .trim()
    .max(60, "Отображаемое имя слишком длинное")
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .trim()
    .regex(/^\+?\d[\d\s\-()]{6,20}$/, "Неверный формат телефона")
    .optional()
    .or(z.literal("")),
  cityId: z.string().min(1, "Выберите город"),
});

export type UpdateBasicProfileInput = z.infer<typeof updateBasicProfileSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Введите текущий пароль"),
    newPassword: z
      .string()
      .min(8, "Минимум 8 символов")
      .max(100, "Слишком длинный пароль"),
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Пароли не совпадают",
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
