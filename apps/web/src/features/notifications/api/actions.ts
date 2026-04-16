"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/shared/lib/db";
import { getCurrentUser } from "@/shared/lib/get-user";

export async function markReadAction(id: string): Promise<{ success: true } | { error: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Необходима авторизация" };

  await db.notification.update({
    where: { id, userId: user.id },
    data: { read: true },
  });

  revalidatePath("/dashboard/notifications");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function markAllReadAction(): Promise<{ success: true } | { error: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Необходима авторизация" };

  await db.notification.updateMany({
    where: { userId: user.id, read: false },
    data: { read: true },
  });

  revalidatePath("/dashboard/notifications");
  revalidatePath("/dashboard");
  return { success: true };
}
