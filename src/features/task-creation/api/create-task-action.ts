"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/shared/lib/db";
import { getCurrentUser } from "@/shared/lib/get-user";
import { taskSchema, type TaskFormValues } from "../model/task-schema";

export async function createOrderAction(data: TaskFormValues) {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Необходима авторизация");
  }

  // Server-side validation
  const validated = taskSchema.parse(data);

  try {
    const task = await db.taskRequest.create({
      data: {
        customerId: user.id,
        categoryId: validated.categoryId,
        title: validated.title,
        description: validated.description,
        budget: validated.budget ? parseFloat(validated.budget) : null,
        address: validated.address,
        status: "OPEN",
      },
    });

    console.log("Task created successfully:", task.id);
  } catch (error) {
    console.error("Failed to create task:", error);
    throw new Error("Не удалось сохранить задачу в базе данных");
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
