"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/shared/lib/db";
import { getCurrentUser } from "@/shared/lib/get-user";
import { checkRateLimit } from "@/shared/lib/rate-limit";
import { taskResponseSchema, type TaskResponseFormValues } from "../model/schema";

type Result = { success: true } | { error: string };

export async function respondToTaskAction(
  data: TaskResponseFormValues,
): Promise<Result> {
  const user = await getCurrentUser();
  if (!user) return { error: "Необходима авторизация" };
  if (!user.masterProfile) return { error: "Сначала зарегистрируйтесь как мастер" };

  const rl = checkRateLimit({ key: `respond:${user.id}`, limit: 15, windowSec: 60 });
  if (!rl.allowed) {
    return { error: `Слишком часто. Подождите ${rl.retryAfterSec} сек.` };
  }

  const parsed = taskResponseSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Неверные данные" };
  }
  const { taskId, price, message } = parsed.data;

  try {
    const task = await db.taskRequest.findUnique({
      where: { id: taskId },
      select: { id: true, status: true, customerId: true },
    });
    if (!task) return { error: "Заявка не найдена" };
    if (task.status !== "OPEN") return { error: "Заявка уже не принимает отклики" };
    if (task.customerId === user.id) {
      return { error: "Нельзя откликаться на свою заявку" };
    }

    const existing = await db.taskResponse.findFirst({
      where: { taskId, masterId: user.masterProfile.id },
      select: { id: true },
    });
    if (existing) return { error: "Вы уже откликнулись на эту заявку" };

    await db.taskResponse.create({
      data: {
        taskId,
        masterId: user.masterProfile.id,
        price: price ? parseFloat(price) : null,
        message,
      },
    });

    revalidatePath(`/dashboard/task/${taskId}`);
    revalidatePath("/dashboard/feed");
    return { success: true };
  } catch (error) {
    console.error("[respondToTaskAction] error:", error);
    return { error: "Не удалось отправить отклик. Попробуйте позже." };
  }
}

export async function acceptResponseAction(
  responseId: string,
): Promise<Result> {
  const user = await getCurrentUser();
  if (!user) return { error: "Необходима авторизация" };

  try {
    const response = await db.taskResponse.findUnique({
      where: { id: responseId },
      select: {
        id: true,
        taskId: true,
        masterId: true,
        task: { select: { customerId: true, status: true } },
      },
    });
    if (!response) return { error: "Отклик не найден" };
    if (response.task.customerId !== user.id) {
      return { error: "Вы не являетесь автором заявки" };
    }
    if (response.task.status !== "OPEN") {
      return { error: "Заявка уже не в статусе OPEN" };
    }

    await db.taskRequest.update({
      where: { id: response.taskId },
      data: {
        status: "IN_PROGRESS",
        assignedMasterId: response.masterId,
      },
    });

    revalidatePath(`/dashboard/task/${response.taskId}`);
    revalidatePath("/dashboard/feed");
    return { success: true };
  } catch (error) {
    console.error("[acceptResponseAction] error:", error);
    return { error: "Не удалось принять отклик" };
  }
}

export async function completeTaskAction(taskId: string): Promise<Result> {
  const user = await getCurrentUser();
  if (!user) return { error: "Необходима авторизация" };

  try {
    const task = await db.taskRequest.findUnique({
      where: { id: taskId },
      select: { id: true, customerId: true, status: true },
    });
    if (!task) return { error: "Заявка не найдена" };
    if (task.customerId !== user.id) {
      return { error: "Вы не являетесь автором заявки" };
    }
    if (task.status !== "IN_PROGRESS") {
      return { error: "Заявка не в работе" };
    }

    await db.taskRequest.update({
      where: { id: taskId },
      data: { status: "COMPLETED" },
    });

    revalidatePath(`/dashboard/task/${taskId}`);
    return { success: true };
  } catch (error) {
    console.error("[completeTaskAction] error:", error);
    return { error: "Не удалось завершить заявку" };
  }
}

export async function cancelTaskAction(taskId: string): Promise<Result> {
  const user = await getCurrentUser();
  if (!user) return { error: "Необходима авторизация" };

  try {
    const task = await db.taskRequest.findUnique({
      where: { id: taskId },
      select: { id: true, customerId: true, status: true },
    });
    if (!task) return { error: "Заявка не найдена" };
    if (task.customerId !== user.id) {
      return { error: "Вы не являетесь автором заявки" };
    }
    if (task.status === "COMPLETED" || task.status === "CANCELED") {
      return { error: "Заявка уже закрыта" };
    }

    await db.taskRequest.update({
      where: { id: taskId },
      data: { status: "CANCELED" },
    });

    revalidatePath(`/dashboard/task/${taskId}`);
    revalidatePath("/dashboard/feed");
    return { success: true };
  } catch (error) {
    console.error("[cancelTaskAction] error:", error);
    return { error: "Не удалось отменить заявку" };
  }
}
