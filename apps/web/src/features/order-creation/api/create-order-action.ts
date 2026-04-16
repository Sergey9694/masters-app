"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/shared/lib/db";
import { checkRateLimit } from "@/shared/lib/rate-limit";
import { notifyProvidersInCategories } from "@/shared/lib/telegram/bot-notify";
import { orderSchema } from "../model/order-schema";
import { authActionClient } from "@/shared/lib/safe-action";

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
      const order = await db.order.create({
        data: {
          clientId: userId,
          categoryId: validated.categoryId,
          title: validated.title,
          description: validated.description,
          budget: validated.budget ? parseFloat(validated.budget) : null,
          address: validated.address,
          images: validated.images || [],
          status: "OPEN",
        },
      });

      // Notify providers in this category (fire-and-forget)
      notifyProvidersInCategories(
        [validated.categoryId],
        userId,
        validated.title,
        order.id,
      );

      revalidatePath("/dashboard");
      revalidatePath("/dashboard/feed");

      return { success: true, redirect: "/dashboard/feed" };
    } catch (error: unknown) {
      console.error("FATAL: Database error in createOrderAction:", error);
      throw new Error("Не удалось создать заказ. Попробуйте позже.");
    }
  });
