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
};
