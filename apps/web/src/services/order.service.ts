import { db } from "@/shared/lib/db";
import { notifyProvidersInCategories } from "@/shared/lib/telegram/bot-notify";
import type { OrderCardData } from "@/shared/types/domain";
import { DEFAULT_PAGE_SIZE } from "@/shared/lib/constants";

export interface CreateOrderInput {
  categoryId: string;
  cityId: string;
  title: string;
  description: string;
  budget?: string | null;
  address?: string | null;
  images?: string[];
}

export interface OrderListParams {
  categoryId?: string;
  search?: string;
  cursor?: string;
  pageSize?: number;
}

export const orderService = {
  /**
   * Create a new order
   */
  async create(data: CreateOrderInput, userId: string) {
    const order = await db.order.create({
      data: {
        clientId: userId,
        categoryId: data.categoryId,
        cityId: data.cityId,
        title: data.title,
        description: data.description,
        budget: data.budget ? parseFloat(data.budget) : null,
        address: data.address,
        images: data.images || [],
        status: "OPEN",
      },
    });

    // Notify providers (fire-and-forget)
    notifyProvidersInCategories(
      [data.categoryId],
      userId,
      data.title,
      order.id
    );

    return order;
  },

  /**
   * List orders with optional filters and pagination
   */
  async list(params: OrderListParams, userId?: string) {
    const { categoryId, search, cursor, pageSize = DEFAULT_PAGE_SIZE } = params;

    const where: any = { status: "OPEN" as const };
    
    // Logic for category filtering (smart default for providers)
    if (categoryId && categoryId !== 'all') {
      where.categoryId = categoryId;
    } 
    else if (!categoryId && userId) {
      const userWithProvider = await db.user.findUnique({
        where: { id: userId },
        select: { providerProfile: { select: { id: true } } }
      });

      if (userWithProvider?.providerProfile) {
        const providerCategories = await db.providerCategory.findMany({
          where: { providerId: userWithProvider.providerProfile.id },
          select: { categoryId: true },
        });
        if (providerCategories.length > 0) {
          where.categoryId = { in: providerCategories.map(mc => mc.categoryId) };
        }
      }
    }

    if (search && search.trim().length >= 2) {
      where.OR = [
        { title: { contains: search.trim(), mode: "insensitive" } },
        { description: { contains: search.trim(), mode: "insensitive" } },
      ];
    }

    const ordersRaw = await db.order.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        images: true,
        budget: true,
        address: true,
        createdAt: true,
        status: true,
        category: { select: { name: true } },
        client: { select: { firstName: true, avatar: true } },
        city: { select: { name: true } },
        _count: { select: { proposals: true } },
      },
      orderBy: { createdAt: "desc" },
      take: pageSize + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });

    const hasMore = ordersRaw.length > pageSize;
    const pageRaw = hasMore ? ordersRaw.slice(0, pageSize) : ordersRaw;
    
    const orders: OrderCardData[] = pageRaw.map(o => ({
      ...o,
      proposalCount: o._count.proposals,
      city: o.city || { name: 'Неизвестно' }
    }));

    const nextCursor = hasMore ? orders[orders.length - 1].id : null;

    return { orders, nextCursor };
  },

  /**
   * Get single order by ID
   */
  async getById(id: string) {
    return db.order.findUnique({
      where: { id },
      include: {
        category: true,
        client: { select: { id: true, firstName: true, avatar: true } },
        city: true,
        _count: { select: { proposals: true } }
      }
    });
  },

  /**
   * Get orders created by a specific client
   */
  async getByClient(userId: string, pageSize = DEFAULT_PAGE_SIZE, cursor?: string) {
    const orders = await db.order.findMany({
      where: { clientId: userId },
      include: {
        category: true,
        city: true,
        _count: { select: { proposals: true } }
      },
      orderBy: { createdAt: "desc" },
      take: pageSize + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });

    const hasMore = orders.length > pageSize;
    const page = hasMore ? orders.slice(0, pageSize) : orders;
    const nextCursor = hasMore ? page[page.length - 1].id : null;

    return { orders: page, nextCursor };
  },

  /**
   * Client accepts a proposal
   */
  async acceptProposal(proposalId: string, userId: string) {
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
    const { notificationService } = await import("./notification.service");
    await notificationService.send({
      userId: proposal.provider.userId,
      type: "PROPOSAL_ACCEPTED",
      title: "Вас выбрали!",
      body: `Вы назначены на заявку «${proposal.order.title}»`,
      referenceId: proposal.orderId,
    });

    // Notify other bidders
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
      const { notificationService } = await import("./notification.service");
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
      const { notificationService } = await import("./notification.service");
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

    const { notificationService } = await import("./notification.service");
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
