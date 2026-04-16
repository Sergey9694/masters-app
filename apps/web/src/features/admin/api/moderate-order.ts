"use server";

import { getSession } from "@/shared/lib/auth";
import { db } from "@/shared/lib/db";
import { revalidatePath } from "next/cache";

export async function toggleOrderVisibility(referenceId: string) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    throw new Error("Forbidden");
  }

  const order = await db.order.findUnique({
    where: { id: referenceId },
    select: { status: true }
  });

  if (!order) throw new Error("Order not found");

  // Toggle between OPEN and CANCELED
  const newStatus = order.status === "CANCELED" ? "OPEN" : "CANCELED";

  await db.order.update({
    where: { id: referenceId },
    data: { status: newStatus as any },
  });

  revalidatePath("/admin/orders");
  return { success: true, status: newStatus };
}

export async function deleteOrderAction(referenceId: string) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    throw new Error("Forbidden");
  }

  // Delete proposals first (FK constraint)
  await db.proposal.deleteMany({ where: { orderId: referenceId } });
  await db.order.delete({ where: { id: referenceId } });

  revalidatePath("/admin/orders");
  return { success: true };
}
