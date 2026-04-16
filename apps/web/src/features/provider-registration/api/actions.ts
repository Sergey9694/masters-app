"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/shared/lib/db";
import { getCurrentUser } from "@/shared/lib/get-user";
import { masterProfileSchema, type MasterProfileFormValues } from "../model/schema";

import { authActionClient } from "@/shared/lib/safe-action";

export const saveProviderProfileAction = authActionClient
  .schema(masterProfileSchema)
  .action(async ({ parsedInput: data, ctx: { userId } }) => {
    const { bio, categoryIds, experienceYears, minPrice, portfolio, avatarUrl } = data;

    try {
      const existingCategories = await db.category.findMany({
        where: { id: { in: categoryIds } },
        select: { id: true },
      });
      
      if (existingCategories.length !== categoryIds.length) {
        throw new Error("Одна из категорий недоступна");
      }

      const masterResult = await db.$transaction(async (tx) => {
        const userProfile = await tx.providerProfile.findUnique({
          where: { userId }
        });

        // Если профиль уже есть, удаляем старые связи с категориями
        if (userProfile) {
          await tx.providerCategory.deleteMany({
            where: { providerId: userProfile.id }
          });
        }

        const result = await tx.providerProfile.upsert({
          where: { userId },
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
            userId,
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
          where: { id: userId },
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
      throw error instanceof Error ? error : new Error("Не удалось сохранить профиль");
    }
  });
