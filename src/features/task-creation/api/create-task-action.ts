"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/shared/lib/db";
import { getCurrentUser } from "@/shared/lib/get-user";
import { taskSchema, type TaskFormValues } from "../model/task-schema";

export async function createOrderAction(data: TaskFormValues) {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Необходима авторизация");
  }

  const result = taskSchema.safeParse(data);
  if (!result.success) {
    console.error("Zod Validation Errors:", result.error.format());
    throw new Error("Неверные данные формы");
  }

  const validated = result.data;

  try {
    const task = await (db.taskRequest as any).create({
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
    
    // Return success instead of redirecting so client can show toast
    return { success: true, redirect: "/dashboard/feed" };
  } catch (error: any) {
    console.error("FATAL: Database error in createOrderAction:", error.message);
    throw new Error(`Ошибка БД: ${error.message}`);
  }
}
