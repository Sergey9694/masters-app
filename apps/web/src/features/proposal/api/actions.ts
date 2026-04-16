"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/shared/lib/db";
import { checkRateLimit } from "@/shared/lib/rate-limit";
import { notify } from "@/shared/lib/telegram/bot-notify";
import { taskResponseSchema } from "../model/schema";
import { authActionClient } from "@/shared/lib/safe-action";
import { z } from "zod";

/**
 * Откликнуться на заявку
 */
export const submitProposalAction = authActionClient
  .schema(taskResponseSchema)
  .action(async ({ parsedInput: { referenceId, price, message }, ctx }) => {
    const { userId } = ctx;

    // Fetch user with provider profile
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { providerProfile: true },
    });

    if (!user?.providerProfile) {
      throw new Error("Сначала зарегистрируйтесь как мастер");
    }

    const rl = checkRateLimit({ key: `respond:${userId}`, limit: 15, windowSec: 60 });
    if (!rl.allowed) {
      throw new Error(`Слишком часто. Подождите ${rl.retryAfterSec} сек.`);
    }

    try {
      const order = await db.order.findUnique({
        where: { id: referenceId },
        select: { id: true, title: true, status: true, clientId: true },
      });

      if (!order) throw new Error("Заявка не найдена");
      if (order.status !== "OPEN") throw new Error("Заявка уже не принимает отклики");
      if (order.clientId === userId) {
        throw new Error("Нельзя откликаться на свою заявку");
      }

      const existing = await db.proposal.findFirst({
        where: { orderId: referenceId, providerId: user.providerProfile.id },
        select: { id: true },
      });
      if (existing) throw new Error("Вы уже откликнулись на эту заявку");

      await db.proposal.create({
        data: {
          orderId: referenceId,
          providerId: user.providerProfile.id,
          price: price ? parseFloat(price) : null,
          message,
        },
      });

      // Notify order owner
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
    } catch (error: any) {
      console.error("[submitProposalAction] error:", error);
      throw error instanceof Error ? error : new Error("Ошибка при отправке отклика");
    }
  });

/**
 * Принять отклик (Заказчик)
 */
export const acceptProposalAction = authActionClient
  .schema(z.object({ proposalId: z.string() }))
  .action(async ({ parsedInput: { proposalId }, ctx }) => {
    const { userId } = ctx;

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

      if (!proposal) throw new Error("Отклик не найден");
      if (proposal.order.clientId !== userId) {
        throw new Error("Вы не являетесь автором заявки");
      }
      if (proposal.order.status !== "OPEN") {
        throw new Error("Заявка уже не в статусе OPEN");
      }

      await db.order.update({
        where: { id: proposal.orderId },
        data: {
          status: "IN_PROGRESS",
          assignedProviderId: proposal.providerId,
        },
      });

      // Notify provider
      await notify({
        userId: proposal.provider.userId,
        type: "PROPOSAL_ACCEPTED",
        title: "Вас выбрали!",
        body: `Вы назначены на заявку «${proposal.order.title}»`,
        referenceId: proposal.orderId,
      });

      // Notify others
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
          otherUserIds.map((uid) =>
            notify({
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
    } catch (error: any) {
      console.error("[acceptProposalAction] error:", error);
      throw error instanceof Error ? error : new Error("Ошибка при принятии отклика");
    }
  });

/**
 * Завершить заказ (Заказчик)
 */
export const completeOrderAction = authActionClient
  .schema(z.object({ referenceId: z.string() }))
  .action(async ({ parsedInput: { referenceId }, ctx }) => {
    const { userId } = ctx;

    try {
      const order = await db.order.findUnique({
        where: { id: referenceId },
        select: {
          id: true,
          title: true,
          clientId: true,
          status: true,
          assignedProvider: { select: { userId: true } },
        },
      });

      if (!order) throw new Error("Заявка не найдена");
      if (order.clientId !== userId) throw new Error("Вы не являетесь автором заявки");
      if (order.status !== "IN_PROGRESS") throw new Error("Заявка не в работе");

      await db.order.update({
        where: { id: referenceId },
        data: { status: "COMPLETED" },
      });

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
    } catch (error: any) {
      console.error("[completeOrderAction] error:", error);
      throw error instanceof Error ? error : new Error("Ошибка при завершении заказа");
    }
  });

/**
 * Отменить заказ (Заказчик)
 */
export const cancelOrderAction = authActionClient
  .schema(z.object({ referenceId: z.string() }))
  .action(async ({ parsedInput: { referenceId }, ctx }) => {
    const { userId } = ctx;

    try {
      const order = await db.order.findUnique({
        where: { id: referenceId },
        select: {
          id: true,
          title: true,
          clientId: true,
          status: true,
          assignedProvider: { select: { userId: true } },
        },
      });

      if (!order) throw new Error("Заявка не найдена");
      if (order.clientId !== userId) throw new Error("Вы не являетесь автором заявки");
      if (order.status === "COMPLETED" || order.status === "CANCELED") {
        throw new Error("Заявка уже закрыта");
      }

      await db.order.update({
        where: { id: referenceId },
        data: { status: "CANCELED" },
      });

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
    } catch (error: any) {
      console.error("[cancelOrderAction] error:", error);
      throw error instanceof Error ? error : new Error("Ошибка при отмене заказа");
    }
  });

/**
 * Отказаться от выполнения (Исполнитель)
 */
export const refuseOrderAction = authActionClient
  .schema(z.object({ referenceId: z.string() }))
  .action(async ({ parsedInput: { referenceId }, ctx }) => {
    const { userId } = ctx;

    const user = await db.user.findUnique({
      where: { id: userId },
      include: { providerProfile: true },
    });

    if (!user?.providerProfile) throw new Error("Необходима профиль мастера");

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

      if (!order) throw new Error("Заявка не найдена");
      if (order.assignedProviderId !== user.providerProfile.id) {
        throw new Error("Вы не назначены на эту заявку");
      }
      if (order.status !== "IN_PROGRESS") {
        throw new Error("Заявка не в работе");
      }

      await db.$transaction([
        db.order.update({
          where: { id: referenceId },
          data: {
            status: "OPEN",
            assignedProviderId: null,
          },
        }),
        db.proposal.deleteMany({
          where: { orderId: referenceId, providerId: user.providerProfile.id }
        })
      ]);

      await notify({
        userId: order.clientId,
        type: "ORDER_CANCELED",
        title: "Мастер отказался",
        body: `Мастер ${user.firstName} отказался от выполнения «${order.title}». Заявка снова открыта.`,
        referenceId,
      });

      const { notifyProvidersInCategories } = await import("@/shared/lib/telegram/bot-notify");
      await notifyProvidersInCategories(
        [order.categoryId],
        userId,
        `[СНОВА ОТКРЫТА] ${order.title}`,
        referenceId,
      );

      revalidatePath(`/dashboard/order/${referenceId}`);
      revalidatePath("/dashboard/feed");
      return { success: true };
    } catch (error: any) {
      console.error("[refuseOrderAction] error:", error);
      throw error instanceof Error ? error : new Error("Ошибка при отказе от заказа");
    }
  });
