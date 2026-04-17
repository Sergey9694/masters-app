import { db } from "@/shared/lib/db";
import { notificationService } from "./notification.service";

export interface CreateProposalInput {
  orderId: string;
  price?: number;
  message?: string;
}

export const proposalService = {
  /**
   * Submit a bid/proposal for an order
   */
  async create(data: CreateProposalInput, userId: string) {
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { providerProfile: true },
    });

    if (!user?.providerProfile) {
      throw new Error("Сначала зарегистрируйтесь как мастер");
    }

    const order = await db.order.findUnique({
      where: { id: data.orderId },
      select: { id: true, title: true, status: true, clientId: true },
    });

    if (!order) throw new Error("Заявка не найдена");
    if (order.status !== "OPEN") throw new Error("Заявка уже не принимает отклики");
    if (order.clientId === userId) {
      throw new Error("Нельзя откликаться на свою заявку");
    }

    const existing = await db.proposal.findFirst({
      where: { orderId: data.orderId, providerId: user.providerProfile.id },
      select: { id: true },
    });
    if (existing) throw new Error("Вы уже откликнулись на эту заявку");

    const proposal = await db.proposal.create({
      data: {
        orderId: data.orderId,
        providerId: user.providerProfile.id,
        price: data.price ?? null,
        message: data.message,
      },
    });

    // Notify order owner
    await notificationService.send({
      userId: order.clientId,
      type: "NEW_PROPOSAL",
      title: "Новый отклик",
      body: `Мастер ${user.firstName} откликнулся на «${order.title}»`,
      referenceId: order.id,
    });

    return proposal;
  },

  /**
   * Client accepts a proposal
   */
  async accept(proposalId: string, userId: string) {
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
    await notificationService.send({
      userId: proposal.provider.userId,
      type: "PROPOSAL_ACCEPTED",
      title: "Вас выбрали!",
      body: `Вы назначены на заявку «${proposal.order.title}»`,
      referenceId: proposal.orderId,
    });

    // Notify other bidders (optional but good practice)
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
          notificationService.send({
            userId: uid,
            type: "ORDER_CANCELED",
            title: "Заявка закрыта",
            body: `Заказчик выбрал другого исполнителя для «${proposal.order.title}»`,
            referenceId: proposal.orderId,
          })
        )
      );
    }

    return { success: true };
  },

  /**
   * Complete the order
   */
  async complete(orderId: string, userId: string) {
    const order = await db.order.findUnique({
      where: { id: orderId },
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
      where: { id: orderId },
      data: { status: "COMPLETED" },
    });

    if (order.assignedProvider) {
      await notificationService.send({
        userId: order.assignedProvider.userId,
        type: "ORDER_COMPLETED",
        title: "Заявка завершена",
        body: `Заказчик завершил заявку «${order.title}»`,
        referenceId: orderId,
      });
    }

    return { success: true };
  },

  /**
   * Cancel the order
   */
  async cancel(orderId: string, userId: string) {
    const order = await db.order.findUnique({
      where: { id: orderId },
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
      where: { id: orderId },
      data: { status: "CANCELED" },
    });

    if (order.assignedProvider) {
      await notificationService.send({
        userId: order.assignedProvider.userId,
        type: "ORDER_CANCELED",
        title: "Заявка отменена",
        body: `Заказчик отменил заявку «${order.title}»`,
        referenceId: orderId,
      });
    }

    return { success: true };
  },

  /**
   * Provider refuses to perform the work
   */
  async refuse(orderId: string, userId: string) {
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { providerProfile: true },
    });

    if (!user?.providerProfile) throw new Error("Необходима профиль мастера");

    const order = await db.order.findUnique({
      where: { id: orderId },
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
        where: { id: orderId },
        data: {
          status: "OPEN",
          assignedProviderId: null,
        },
      }),
      db.proposal.deleteMany({
        where: { orderId: orderId, providerId: user.providerProfile.id }
      })
    ]);

    await notificationService.send({
      userId: order.clientId,
      type: "ORDER_CANCELED",
      title: "Мастер отказался",
      body: `Мастер ${user.firstName} отказался от выполнения «${order.title}». Заявка снова открыта.`,
      referenceId: orderId,
    });

    // Notify other providers that it's open again
    await notificationService.notifyProviders(
      [order.categoryId],
      userId,
      `[СНОВА ОТКРЫТА] ${order.title}`,
      orderId,
    );

    return { success: true };
  }
};
