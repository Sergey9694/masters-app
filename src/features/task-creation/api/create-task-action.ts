"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/shared/lib/db";
import { getCurrentUser } from "@/shared/lib/get-user";
import { checkRateLimit } from "@/shared/lib/rate-limit";
import { taskSchema, type TaskFormValues } from "../model/task-schema";

/**
 * Server Action: Create a new task request
 * All errors are caught and returned as safe messages (no DB internals leak)
 */
export async function createOrderAction(data: TaskFormValues) {
  const user = await getCurrentUser();

  if (!user) {
    return { error: "Необходима авторизация" };
  }

  const rl = checkRateLimit({ key: `createOrder:${user.id}`, limit: 5, windowSec: 60 });
  if (!rl.allowed) {
    return { error: `Слишком часто. Подождите ${rl.retryAfterSec} сек.` };
  }

  const result = taskSchema.safeParse(data);
  if (!result.success) {
    const firstError = result.error.issues[0]?.message || "Неверные данные формы";
    return { error: firstError };
  }

  const validated = result.data;

  try {
    await db.taskRequest.create({
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

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/feed");

    return { success: true, redirect: "/dashboard/feed" };
  } catch (error: unknown) {
    console.error("FATAL: Database error in createOrderAction:", error);
    // S2: Never expose DB error details to client
    return { error: "Не удалось создать заказ. Попробуйте позже." };
  }
}
