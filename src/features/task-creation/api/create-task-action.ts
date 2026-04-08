"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/shared/lib/db";
import { getCurrentUser } from "@/shared/lib/get-user";
import { checkRateLimit } from "@/shared/lib/rate-limit";
import { notifyMastersInCategories } from "@/shared/lib/telegram/bot-notify";
import { taskSchema, type TaskFormValues } from "../model/task-schema";
import { createSafeAction } from "@/shared/lib/create-safe-action";

/**
 * Server Action: Create a new task request
 * All errors are caught and returned as safe messages (no DB internals leak)
 */
export const createOrderAction = createSafeAction(taskSchema, async (validated: TaskFormValues) => {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Необходима авторизация");
  }

  const rl = checkRateLimit({ key: `createOrder:${user.id}`, limit: 5, windowSec: 60 });
  if (!rl.allowed) {
    throw new Error(`Слишком часто. Подождите ${rl.retryAfterSec} сек.`);
  }

  try {
    const task = await db.taskRequest.create({
      data: {
        customerId: user.id,
        categoryId: validated.categoryId,
        title: validated.title,
        description: validated.description,
        budget: validated.budget ? parseFloat(validated.budget) : null,
        address: validated.address,
        images: validated.images || [],
        status: "OPEN",
      },
    });

    // Notify masters in this category (fire-and-forget)
    notifyMastersInCategories(
      [validated.categoryId],
      user.id,
      validated.title,
      task.id,
    );

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/feed");

    return { redirect: "/dashboard/feed" };
  } catch (error: unknown) {
    console.error("FATAL: Database error in createOrderAction:", error);
    // S2: Never expose DB error details to client
    throw new Error("Не удалось создать заказ. Попробуйте позже.");
  }
});
