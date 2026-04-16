"use server";

import { getSession } from "@/shared/lib/auth";
import { db } from "@/shared/lib/db";
import { revalidatePath } from "next/cache";

export async function toggleTaskVisibility(taskId: string) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    throw new Error("Forbidden");
  }

  const task = await db.taskRequest.findUnique({
    where: { id: taskId },
    select: { status: true }
  });

  if (!task) throw new Error("Task not found");

  // Toggle between OPEN and CANCELED
  const newStatus = task.status === "CANCELED" ? "OPEN" : "CANCELED";

  await db.taskRequest.update({
    where: { id: taskId },
    data: { status: newStatus },
  });

  revalidatePath("/admin/tasks");
  return { success: true, status: newStatus };
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
  return { success: true };
}
