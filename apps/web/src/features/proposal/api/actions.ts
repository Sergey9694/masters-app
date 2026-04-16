"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/shared/lib/db";
import { getCurrentUser } from "@/shared/lib/get-user";
import { checkRateLimit } from "@/shared/lib/rate-limit";
import { notify } from "@/shared/lib/telegram/bot-notify";
import { taskResponseSchema, type TaskResponseFormValues } from "../model/schema";

type Result = { success: true } | { error: string };

export async function submitProposalAction(
  data: TaskResponseFormValues,
): Promise<Result> {
  const user = await getCurrentUser();
  if (!user) return { error: "Необходима авторизация" };
  if (!user.providerProfile) return { error: "Сначала зарегистрируйтесь как мастер" };

  const rl = checkRateLimit({ key: `respond:${user.id}`, limit: 15, windowSec: 60 });
  if (!rl.allowed) {
    return { error: `Слишком часто. Подождите ${rl.retryAfterSec} сек.` };
  }

  const parsed = taskResponseSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Неверные данные" };
  }
  const { referenceId, price, message } = parsed.data;

  try {
    const order = await db.order.findUnique({
      where: { id: referenceId },
      select: { id: true, title: true, status: true, clientId: true },
    });
    if (!order) return { error: "Заявка не найдена" };
    if (order.status !== "OPEN") return { error: "Заявка уже не принимает отклики" };
    if (order.clientId === user.id) {
      return { error: "Нельзя откликаться на свою заявку" };
    }

    const existing = await db.proposal.findFirst({
      where: { orderId: referenceId, providerId: user.providerProfile.id },
      select: { id: true },
    });
    if (existing) return { error: "Вы уже откликнулись на эту заявку" };

    await db.proposal.create({
      data: {
        orderId: referenceId,
        providerId: user.providerProfile.id,
        price: price ? parseFloat(price) : null,
        message,
      },
    });

    // Notify order owner about new response
    await notify({
      userId: order.clientId,
      type: "NEW_PROPOSAL",
      title: "Новый отклик",
      body: `Мастер ${user.firstName} откликнулся на «${order.title}»`,
      referenceId,
    });

    revalidatePath(`/dashboard/order/${referenceId}`);
    revalidatePath("/dashboard/feed");
    return { success: true };
  } catch (error) {
    console.error("[submitProposalAction] error:", error);
    return { error: "Не удалось отправить отклик. Попробуйте позже." };
  }
}

export async function acceptProposalAction(
  proposalId: string,
): Promise<Result> {
  const user = await getCurrentUser();
  if (!user) return { error: "Необходима авторизация" };

  try {
    const proposal = await db.proposal.findUnique({
      where: { id: proposalId },
      select: {
        id: true,
        orderId: true,
        providerId: true,
        provider: { select: { userId: true } },
        order: { select: { title: true, clientId: true, status: true } },
      },
    });
    if (!proposal) return { error: "Отклик не найден" };
    if (proposal.order.clientId !== user.id) {
      return { error: "Вы не являетесь автором заявки" };
    }
    if (proposal.order.status !== "OPEN") {
      return { error: "Заявка уже не в статусе OPEN" };
    }

    await db.order.update({
      where: { id: proposal.orderId },
      data: {
        status: "IN_PROGRESS",
        assignedProviderId: proposal.providerId,
      },
    });

    // Notify provider that they were chosen
    await notify({
      userId: proposal.provider.userId,
      type: "PROPOSAL_ACCEPTED",
      title: "Вас выбрали!",
      body: `Вы назначены на заявку «${proposal.order.title}»`,
      referenceId: proposal.orderId,
    });

    // Notify other providers who were NOT chosen
    const otherProposals = await db.proposal.findMany({
      where: {
        orderId: proposal.orderId,
        id: { not: proposalId },
      },
      select: {
        provider: { select: { userId: true } },
      },
    });

    if (otherProposals.length > 0) {
      const otherUserIds = otherProposals.map((r) => r.provider.userId);
      await Promise.allSettled(
        otherUserIds.map(async (uid) =>
          await notify({
            userId: uid,
            type: "ORDER_CANCELED", 
            title: "Заявка закрыта",
            body: `Заказчик выбрал другого исполнителя для «${proposal.order.title}»`,
            referenceId: proposal.orderId,
          }),
        ),
      );
    }

    revalidatePath(`/dashboard/order/${proposal.orderId}`);
    revalidatePath("/dashboard/feed");
    return { success: true };
  } catch (error) {
    console.error("[acceptProposalAction] error:", error);
    return { error: "Не удалось принять отклик" };
  }
}

export async function completeOrderAction(referenceId: string): Promise<Result> {
  const user = await getCurrentUser();
  if (!user) return { error: "Необходима авторизация" };

  try {
    const order = await db.order.findUnique({
      where: { id: referenceId },
      select: {
        id: true,
        title: true,
        clientId: true,
        status: true,
        assignedProviderId: true,
        assignedProvider: { select: { userId: true } },
      },
    });
    if (!order) return { error: "Заявка не найдена" };
    if (order.clientId !== user.id) {
      return { error: "Вы не являетесь автором заявки" };
    }
    if (order.status !== "IN_PROGRESS") {
      return { error: "Заявка не в работе" };
    }

    await db.order.update({
      where: { id: referenceId },
      data: { status: "COMPLETED" },
    });

    // Notify assigned provider
    if (order.assignedProvider) {
      await notify({
        userId: order.assignedProvider.userId,
        type: "ORDER_COMPLETED",
        title: "Заявка завершена",
        body: `Заказчик завершил заявку «${order.title}»`,
        referenceId,
      });
    }

    revalidatePath(`/dashboard/order/${referenceId}`);
    return { success: true };
  } catch (error) {
    console.error("[completeOrderAction] error:", error);
    return { error: "Не удалось завершить заявку" };
  }
}

export async function cancelOrderAction(referenceId: string): Promise<Result> {
  const user = await getCurrentUser();
  if (!user) return { error: "Необходима авторизация" };

  try {
    const order = await db.order.findUnique({
      where: { id: referenceId },
      select: {
        id: true,
        title: true,
        clientId: true,
        status: true,
        assignedProviderId: true,
        assignedProvider: { select: { userId: true } },
      },
    });
    if (!order) return { error: "Заявка не найдена" };
    if (order.clientId !== user.id) {
      return { error: "Вы не являетесь автором заявки" };
    }
    if (order.status === "COMPLETED" || order.status === "CANCELED") {
      return { error: "Заявка уже закрыта" };
    }

    await db.order.update({
      where: { id: referenceId },
      data: { status: "CANCELED" },
    });

    // Notify assigned provider about cancellation
    if (order.assignedProvider) {
      await notify({
        userId: order.assignedProvider.userId,
        type: "ORDER_CANCELED",
        title: "Заявка отменена",
        body: `Заказчик отменил заявку «${order.title}»`,
        referenceId,
      });
    }

    revalidatePath(`/dashboard/order/${referenceId}`);
    revalidatePath("/dashboard/feed");
    return { success: true };
  } catch (error) {
    console.error("[cancelOrderAction] error:", error);
    return { error: "Не удалось отменить заявку" };
  }
}

export async function refuseOrderAction(referenceId: string): Promise<Result> {
  const user = await getCurrentUser();
  if (!user || !user.providerProfile) return { error: "Необходима авторизация мастера" };

  try {
    const order = await db.order.findUnique({
      where: { id: referenceId },
      select: {
        id: true,
        title: true,
        clientId: true,
        status: true,
        assignedProviderId: true,
        categoryId: true,
      },
    });

    if (!order) return { error: "Заявка не найдена" };
    if (order.assignedProviderId !== user.providerProfile.id) {
      return { error: "Вы не назначены на эту заявку" };
    }
    if (order.status !== "IN_PROGRESS") {
      return { error: "Заявка не в работе" };
    }

    // Use transaction to ensure data integrity
    await db.$transaction([
      db.order.update({
        where: { id: referenceId },
        data: {
          status: "OPEN",
          assignedProviderId: null,
        },
      }),
      // Remove this provider's proposal so someone else can be chosen 
      db.proposal.deleteMany({
        where: { orderId: referenceId, providerId: user.providerProfile.id }
      })
    ]);

    // Notify client that provider refused
    await notify({
      userId: order.clientId,
      type: "ORDER_CANCELED",
      title: "Мастер отказался",
      body: `Мастер ${user.firstName} отказался от выполнения «${order.title}». Заявка снова открыта.`,
      referenceId,
    });

    // Notify other providers in category that job is available again
    const { notifyProvidersInCategories } = await import("@/shared/lib/telegram/bot-notify");
    await notifyProvidersInCategories(
      [order.categoryId],
      user.id, // Exclude the one who just refused
      `[СНОВА ОТКРЫТА] ${order.title}`,
      referenceId,
    );

    revalidatePath(`/dashboard/order/${referenceId}`);
    revalidatePath("/dashboard/feed");
    return { success: true };
  } catch (error) {
    console.error("[refuseOrderAction] error:", error);
    return { error: "Не удалось отказаться от заявки" };
  }
}
