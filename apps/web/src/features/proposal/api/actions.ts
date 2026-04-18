"use server";

import { revalidatePath } from "next/cache";
import { checkRateLimit } from "@/shared/lib/rate-limit";
import { taskResponseSchema } from "../model/schema";
import { authActionClient } from "@/shared/lib/safe-action";
import { z } from "zod";
import { proposalService } from "@/services/proposal.service";
import { orderService } from "@/services/order.service";

/**
 * Откликнуться на заявку
 */
export const submitProposalAction = authActionClient
  .schema(taskResponseSchema)
  .action(async ({ parsedInput: { orderId, price, message }, ctx }) => {
    const { userId } = ctx;

    const rl = checkRateLimit({ key: `respond:${userId}`, limit: 15, windowSec: 60 });
    if (!rl.allowed) {
      throw new Error(`Слишком часто. Подождите ${rl.retryAfterSec} сек.`);
    }

    try {
      const result = await proposalService.create({ 
        orderId, 
        price: price ? parseFloat(price) : undefined, 
        message 
      }, userId);

      revalidatePath(`/dashboard/order/${orderId}`);
      revalidatePath("/dashboard/feed");
      
      return { success: true };
    } catch (error: any) {
      console.error("[submitProposalAction] error:", error);
      throw error instanceof Error ? error : new Error("Ошибка при отправке отклика");
    }
  });

/**
 * Принять отклик (Заказчик)
 */
export const acceptProposalAction = authActionClient
  .schema(z.object({ proposalId: z.string() }))
  .action(async ({ parsedInput: { proposalId }, ctx }) => {
    const { userId } = ctx;

    try {
      const result = await orderService.acceptProposal(proposalId, userId);
      revalidatePath(`/dashboard/feed`);
      return result;
    } catch (error: any) {
      console.error("[acceptProposalAction] error:", error);
      throw error instanceof Error ? error : new Error("Ошибка при принятии отклика");
    }
  });

/**
 * Завершить заказ (Заказчик)
 */
export const completeOrderAction = authActionClient
  .schema(z.object({ referenceId: z.string() }))
  .action(async ({ parsedInput: { referenceId }, ctx }) => {
    const { userId } = ctx;

    try {
      const result = await orderService.complete(referenceId, userId);
      revalidatePath(`/dashboard/order/${referenceId}`);
      return result;
    } catch (error: any) {
      console.error("[completeOrderAction] error:", error);
      throw error instanceof Error ? error : new Error("Ошибка при завершении заказа");
    }
  });

/**
 * Отменить заказ (Заказчик)
 */
export const cancelOrderAction = authActionClient
  .schema(z.object({ referenceId: z.string() }))
  .action(async ({ parsedInput: { referenceId }, ctx }) => {
    const { userId } = ctx;

    try {
      const result = await orderService.cancel(referenceId, userId);
      revalidatePath(`/dashboard/order/${referenceId}`);
      revalidatePath("/dashboard/feed");
      return result;
    } catch (error: any) {
      console.error("[cancelOrderAction] error:", error);
      throw error instanceof Error ? error : new Error("Ошибка при отмене заказа");
    }
  });

/**
 * Отказаться от выполнения (Исполнитель)
 */
export const refuseOrderAction = authActionClient
  .schema(z.object({ referenceId: z.string() }))
  .action(async ({ parsedInput: { referenceId }, ctx }) => {
    const { userId } = ctx;

    try {
      const result = await orderService.refuse(referenceId, userId);
      revalidatePath(`/dashboard/order/${referenceId}`);
      revalidatePath("/dashboard/feed");
      return result;
    } catch (error: any) {
      console.error("[refuseOrderAction] error:", error);
      throw error instanceof Error ? error : new Error("Ошибка при отказе от заказа");
    }
  });
