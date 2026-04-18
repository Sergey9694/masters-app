"use server";

import { revalidatePath } from "next/cache";
import { notificationService } from "@/services/notification.service";
import { getCurrentUser } from "@/shared/lib/get-user";

export async function markReadAction(id: string): Promise<{ success: true } | { error: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Необходима авторизация" };

  await notificationService.markAsRead(id, user.id);

  revalidatePath("/dashboard/notifications");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function markAllReadAction(): Promise<{ success: true } | { error: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Необходима авторизация" };

  await notificationService.markAllAsRead(user.id);

  revalidatePath("/dashboard/notifications");
  revalidatePath("/dashboard");
  return { success: true };
}
