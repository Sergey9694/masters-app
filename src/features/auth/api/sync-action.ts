"use server";

import { db } from "@/shared/lib/db";
import { getCurrentUser } from "@/shared/lib/get-user";
import { revalidatePath } from "next/cache";

/**
 * Periodically sync profile data from Telegram WebApp (photo_url, names)
 * as Telegram URLs are temporary.
 */
export async function syncProfileAction(data: {
  firstName?: string;
  lastName?: string;
  avatar?: string;
}) {
  const user = await getCurrentUser();
  if (!user) return { error: "Unauthorized" };

  try {
    // Only update if something actually changed to avoid DB noise
    const hasChanges = 
      (data.firstName && data.firstName !== user.firstName) ||
      (data.lastName && data.lastName !== user.lastName) ||
      (data.avatar && data.avatar !== user.avatar);

    if (hasChanges) {
      await db.user.update({
        where: { id: user.id },
        data: {
          firstName: data.firstName || user.firstName,
          lastName: data.lastName ?? user.lastName,
          avatar: data.avatar ?? user.avatar,
        },
      });
      revalidatePath("/dashboard");
    }
    
    return { success: true };
  } catch (error) {
    console.error("[syncProfileAction] error:", error);
    return { error: "Failed to sync profile" };
  }
}
