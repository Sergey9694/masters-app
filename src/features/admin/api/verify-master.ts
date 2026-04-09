"use server";

import { getSession } from "@/shared/lib/auth";
import { db } from "@/shared/lib/db";
import { revalidatePath } from "next/cache";

export async function verifyMaster(masterId: string) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    throw new Error("Forbidden");
  }

  await db.masterProfile.update({
    where: { id: masterId },
    data: { isVerified: true },
  });

  revalidatePath("/admin/master-applications");
}

export async function rejectMaster(masterId: string) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    throw new Error("Forbidden");
  }

  await db.masterProfile.delete({
    where: { id: masterId },
  });

  revalidatePath("/admin/master-applications");
}
