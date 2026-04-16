"use server";

import { getSession } from "@/shared/lib/auth";
import { db } from "@/shared/lib/db";
import { revalidatePath } from "next/cache";

export async function toggleTaskVisibility(referenceId: string) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    throw new Error("Forbidden");
  }

  const order = await db.order.findUnique({
    where: { id: orderId },
    select: { status: true }
  });

  if (!order) throw new Error("Order not found");

  // Toggle between OPEN and CANCELED
  const newStatus = order.status === "CANCELED" ? "OPEN" : "CANCELED";

  await db.order.update({
    where: { id: orderId },
    data: { status: newStatus },
  });

  revalidatePath("/admin/orders");
  return { success: true, status: newStatus };
}

export async function deleteTask(referenceId: string) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    throw new Error("Forbidden");
  }

  // Delete proposals first (FK constraint)
  await db.proposal.deleteMany({ where: { orderId } });
  await db.order.delete({ where: { id: orderId } });

  revalidatePath("/admin/orders");
  return { success: true };
}
