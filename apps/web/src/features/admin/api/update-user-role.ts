"use server";

import { getSession } from "@/shared/lib/auth";
import { db } from "@/shared/lib/db";
import { Role } from "@/shared/types/auth";
import { revalidatePath } from "next/cache";

export async function updateUserRole(userId: string, role: Role) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    throw new Error("Forbidden");
  }

  await db.user.update({
    where: { id: userId },
    data: { role },
  });

  revalidatePath("/admin/users");
}
