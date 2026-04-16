"use server";

import { db } from "@/shared/lib/db";
import { revalidatePath } from "next/cache";
import { adminActionClient } from "@/shared/lib/safe-action";
import { logAudit } from "@/shared/lib/audit";
import { z } from "zod";

/**
 * Переключить видимость заказа (только для ADMIN)
 */
export const toggleOrderVisibility = adminActionClient
  .schema(z.string()) // referenceId
  .action(async ({ parsedInput: referenceId, ctx }) => {
    try {
      const order = await db.order.findUnique({
        where: { id: referenceId },
        select: { status: true }
      });

      if (!order) throw new Error("Order not found");

      // Toggle between OPEN and CANCELED
      const newStatus = order.status === "CANCELED" ? "OPEN" : "CANCELED";

      await db.order.update({
        where: { id: referenceId },
        data: { status: newStatus },
      });

      await logAudit({
        userId: ctx.userId,
        action: "UPDATE",
        entity: "Order",
        entityId: referenceId,
        metadata: { status: newStatus },
      });

      revalidatePath("/admin/orders");
      return { success: true, status: newStatus };
    } catch (error) {
      console.error("[toggleOrderVisibility] error:", error);
      throw new Error("Не удалось изменить видимость заказа");
    }
  });

/**
 * Удалить заказ (только для ADMIN)
 */
export const deleteOrderAction = adminActionClient
  .schema(z.string()) // referenceId
  .action(async ({ parsedInput: referenceId, ctx }) => {
    try {
      // Delete proposals first (FK constraint)
      await db.proposal.deleteMany({ where: { orderId: referenceId } });
      await db.order.delete({ where: { id: referenceId } });

      await logAudit({
        userId: ctx.userId,
        action: "DELETE",
        entity: "Order",
        entityId: referenceId,
      });

      revalidatePath("/admin/orders");
      return { success: true };
    } catch (error) {
      console.error("[deleteOrderAction] error:", error);
      throw new Error("Не удалось удалить заказ");
    }
  });
