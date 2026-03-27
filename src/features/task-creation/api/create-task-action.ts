"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/shared/lib/db";
import { getCurrentUser } from "@/shared/lib/get-user";
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

  const result = taskSchema.safeParse(data);
  if (!result.success) {
    const firstError = result.error.issues[0]?.message || "Неверные данные формы";
    return { error: firstError };
  }

  const validated = result.data;

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

    // PostGIS geo-point update (if coordinates provided)
    if (validated.lat && validated.lng) {
      await db.$executeRawUnsafe(
        `UPDATE "TaskRequest" SET "taskLocation" = ST_SetSRID(ST_MakePoint($1, $2), 4326) WHERE id = $3`,
        Number(validated.lng),
        Number(validated.lat),
        task.id
      );
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/feed");

    return { success: true, redirect: "/dashboard/feed" };
  } catch (error: unknown) {
    console.error("FATAL: Database error in createOrderAction:", error);
    // S2: Never expose DB error details to client
    return { error: "Не удалось создать заказ. Попробуйте позже." };
  }
}
