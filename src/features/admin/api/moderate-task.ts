"use server";

import { getSession } from "@/shared/lib/auth";
import { db } from "@/shared/lib/db";
import { revalidatePath } from "next/cache";

export async function hideTask(taskId: string) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    throw new Error("Forbidden");
  }

  await db.taskRequest.update({
    where: { id: taskId },
    data: { status: "CANCELED" },
  });

  revalidatePath("/admin/tasks");
}

export async function deleteTask(taskId: string) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    throw new Error("Forbidden");
  }

  // Delete responses first (FK constraint)
  await db.taskResponse.deleteMany({ where: { taskId } });
  await db.taskRequest.delete({ where: { id: taskId } });

  revalidatePath("/admin/tasks");
}
