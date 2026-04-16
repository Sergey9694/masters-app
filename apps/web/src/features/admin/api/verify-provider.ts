"use server";

import { getSession } from "@/shared/lib/auth";
import { db } from "@/shared/lib/db";
import { revalidatePath } from "next/cache";

export async function verifyProvider(providerId: string) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    throw new Error("Forbidden");
  }

  await db.providerProfile.update({
    where: { id: providerId },
    data: { isVerified: true },
  });

  revalidatePath("/admin/provider-applications");
}

export async function rejectProvider(providerId: string) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    throw new Error("Forbidden");
  }

  await db.providerProfile.delete({
    where: { id: providerId },
  });

  revalidatePath("/admin/provider-applications");
}
