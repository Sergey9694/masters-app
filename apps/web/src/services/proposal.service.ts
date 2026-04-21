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
      select: { firstName: true, providerProfile: { select: { id: true } } },
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
   * List proposals for a specific order (visible to order client)
   */
  async listByOrder(orderId: string, userId: string) {
    const order = await db.order.findUnique({
      where: { id: orderId },
      select: { clientId: true },
    });

    if (!order) throw new Error("Заявка не найдена");
    if (order.clientId !== userId) throw new Error("Доступ запрещён");

    return db.proposal.findMany({
      where: { orderId },
      include: {
        provider: {
          select: {
            id: true,
            rating: true,
            isVerified: true,
            user: {
              select: { id: true, firstName: true, lastName: true, avatar: true, displayName: true },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });
  },

  /**
   * List proposals submitted by a provider (current user)
   */
  async listByProvider(userId: string, pageSize = 20, cursor?: string) {
    const provider = await db.providerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!provider) return { proposals: [], nextCursor: null };

    const proposals = await db.proposal.findMany({
      where: { providerId: provider.id },
      include: {
        order: {
          select: {
            id: true,
            title: true,
            status: true,
            budget: true,
            category: { select: { name: true } },
            city: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: pageSize + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });

    const hasMore = proposals.length > pageSize;
    const page = hasMore ? proposals.slice(0, pageSize) : proposals;
    const nextCursor = hasMore ? page[page.length - 1].id : null;

    return { proposals: page, nextCursor };
  },

  /**
   * Provider withdraws their own proposal
   */
  async withdraw(proposalId: string, userId: string) {
    const proposal = await db.proposal.findUnique({
      where: { id: proposalId },
      select: {
        id: true,
        orderId: true,
        providerId: true,
        order: { select: { status: true } },
        provider: { select: { userId: true } },
      },
    });

    if (!proposal) throw new Error("Отклик не найден");
    if (proposal.provider.userId !== userId) throw new Error("Доступ запрещён");
    if (proposal.order.status !== "OPEN") {
      throw new Error("Заявка уже не принимает отклики");
    }

    await db.proposal.delete({ where: { id: proposalId } });
    return { success: true };
  },
};
