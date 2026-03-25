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
        images: validated.images || [],
        status: "OPEN",
      },
    });

    // 2. Обновляем ГЕО через Raw Query (т.к. PostGIS Point в Prisma Unsupported)
    if (validated.lat && validated.lng) {
      await db.$executeRawUnsafe(
        `UPDATE "TaskRequest" SET "taskLocation" = ST_SetSRID(ST_MakePoint($1, $2), 4326) WHERE id = $3`,
        validated.lng,
        validated.lat,
        task.id
      );
    }

    console.log("Task created successfully:", task.id);
  } catch (error) {
    console.error("Detailed error in createOrderAction:", error);
    throw new Error("Ошибка при сохранении тендера");
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
