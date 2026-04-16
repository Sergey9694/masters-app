"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/shared/lib/db";
import { getCurrentUser } from "@/shared/lib/get-user";
import { masterProfileSchema, type MasterProfileFormValues } from "../model/schema";

type Result =
  | { success: true; redirect: string }
  | { error: string };

export async function saveProviderProfileAction(
  data: MasterProfileFormValues,
): Promise<Result> {
  const user = await getCurrentUser();
  if (!user) return { error: "Необходима авторизация" };

  const parsed = masterProfileSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Неверные данные" };
  }
  const { bio, categoryIds, experienceYears, minPrice, portfolio, avatarUrl } = parsed.data;

  try {
    const existingCategories = await db.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true },
    });
    if (existingCategories.length !== categoryIds.length) {
      return { error: "Одна из категорий недоступна" };
    }

    const masterResult = await db.$transaction(async (tx) => {
      // Если профиль уже есть, удаляем старые связи с категориями
      if (user.providerProfile) {
        await tx.providerCategory.deleteMany({
          where: { providerId: user.providerProfile.id }
        });
      }

      const result = await tx.providerProfile.upsert({
        where: { userId: user.id },
        update: {
          bio,
          experienceYears,
          minPrice,
          portfolio,
          categories: {
            create: categoryIds.map((categoryId) => ({ categoryId })),
          },
        },
        create: {
          userId: user.id,
          bio,
          experienceYears,
          minPrice,
          portfolio,
          categories: {
            create: categoryIds.map((categoryId) => ({ categoryId })),
          },
        },
      });

      await tx.user.update({
        where: { id: user.id },
        data: { 
          role: "PROVIDER",
          ...(avatarUrl && { avatar: avatarUrl })
        },
      });

      return result;
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/become-provider");
    revalidatePath(`/dashboard/providers/${masterResult.id}`);
    
    return { success: true, redirect: "/dashboard" };
  } catch (error) {
    console.error("[saveProviderProfileAction] error:", error);
    return { error: "Не удалось сохранить профиль. Попробуйте позже." };
  }
}
