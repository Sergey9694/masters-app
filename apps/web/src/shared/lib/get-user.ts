import { cache } from "react";
import { auth } from "@/auth";
import { db } from "./db";

/**
 * DAL: Get current user from session (select only needed fields).
 * Rule: Never return full user objects with PII to the client.
 *
 * Обёрнут в React cache() — дедуплицирует вызовы в рамках одного render-прохода,
 * чтобы layout-виджеты (Header/Sidebar/BottomNav) делили один запрос к БД.
 */
export const getCurrentUser = cache(async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) return null;

  try {
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        avatar: true,
        role: true,
        phone: true,
        providerProfile: {
          select: {
            id: true,
            bio: true,
            isVerified: true,
            rating: true,
            experienceYears: true,
            minPrice: true,
            portfolio: true,
            categories: {
              select: { categoryId: true }
            }
          },
        },
      },
    });

    return user;
  } catch (error) {
    console.error("[getCurrentUser DB Error]:", error);
    return null;
  }
});

/** Return type for getCurrentUser */
export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;
