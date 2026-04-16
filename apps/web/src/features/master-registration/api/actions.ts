"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/shared/lib/db";
import { getCurrentUser } from "@/shared/lib/get-user";
import { masterProfileSchema, type MasterProfileFormValues } from "../model/schema";

type Result =
  | { success: true; redirect: string }
  | { error: string };

export async function saveMasterProfileAction(
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
      if (user.masterProfile) {
        await tx.masterCategory.deleteMany({
          where: { masterId: user.masterProfile.id }
        });
      }

      const result = await tx.masterProfile.upsert({
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
          role: "MASTER",
          ...(avatarUrl && { avatar: avatarUrl })
        },
      });

      return result;
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/become-master");
    revalidatePath(`/dashboard/masters/${masterResult.id}`);
    
    return { success: true, redirect: "/dashboard" };
  } catch (error) {
    console.error("[saveMasterProfileAction] error:", error);
    return { error: "Не удалось сохранить профиль. Попробуйте позже." };
  }
}
