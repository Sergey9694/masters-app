"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/shared/lib/db";
import { getCurrentUser } from "@/shared/lib/get-user";
import { masterProfileSchema, type MasterProfileFormValues } from "../model/schema";

type Result =
  | { success: true; redirect: string }
  | { error: string };

export async function createMasterProfileAction(
  data: MasterProfileFormValues,
): Promise<Result> {
  const user = await getCurrentUser();
  if (!user) return { error: "Необходима авторизация" };

  if (user.masterProfile) {
    return { error: "У вас уже есть профиль мастера" };
  }

  const parsed = masterProfileSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Неверные данные" };
  }
  const { bio, categoryIds } = parsed.data;

  try {
    // Проверяем, что все переданные категории существуют
    const existingCategories = await db.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true },
    });
    if (existingCategories.length !== categoryIds.length) {
      return { error: "Одна из категорий недоступна" };
    }

    await db.$transaction([
      db.masterProfile.create({
        data: {
          userId: user.id,
          bio,
          categories: {
            create: categoryIds.map((categoryId) => ({ categoryId })),
          },
        },
      }),
      db.user.update({
        where: { id: user.id },
        data: { role: "MASTER" },
      }),
    ]);

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/feed");
    return { success: true, redirect: "/dashboard" };
  } catch (error) {
    console.error("[createMasterProfileAction] error:", error);
    return { error: "Не удалось создать профиль. Попробуйте позже." };
  }
}
