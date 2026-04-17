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
  }
};
