"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/shared/lib/db";
import { checkRateLimit } from "@/shared/lib/rate-limit";
import { notifyProvidersInCategories } from "@/shared/lib/telegram/bot-notify";
import { orderSchema } from "../model/order-schema";
import { authActionClient } from "@/shared/lib/safe-action";

import { orderService } from "@/services/order.service";

/**
 * Server Action: Create a new order request
 * Wrapped with next-safe-action for validation and auth
 */
export const createOrderAction = authActionClient
  .schema(orderSchema)
  .action(async ({ parsedInput: validated, ctx }) => {
    const { userId } = ctx;

    const rl = checkRateLimit({ key: `createOrder:${userId}`, limit: 5, windowSec: 60 });
    if (!rl.allowed) {
      throw new Error(`Слишком часто. Подождите ${rl.retryAfterSec} сек.`);
    }

    try {
      const order = await orderService.create(validated, userId);

      revalidatePath("/orders");
      revalidatePath("/my-orders");

      return { success: true, redirect: `/orders/${order.slug || order.id}`, orderId: order.id };
    } catch (error: unknown) {
      console.error("FATAL: Error in createOrderAction:", error);
      throw new Error(error instanceof Error ? error.message : "Не удалось создать заказ. Попробуйте позже.");
    }
  });
