import { db } from "@/shared/lib/db";
import { notifyProvidersInCategories } from "@/shared/lib/telegram/bot-notify";
import type { OrderCardData } from "@/shared/types/domain";
import { DEFAULT_PAGE_SIZE } from "@/shared/lib/constants";
import { Prisma } from "@prisma/client";
import { slugify } from "@/shared/lib/slugify";
import { geocodeOrderAddress } from "@/shared/lib/geocoding";
import { normalizeRadiusKm, toGeoPoint, type GeoPoint } from "@/shared/lib/geo-utils";
import { syncOrderLocation } from "@/shared/lib/order-location";

export type OrderWithDetails = Prisma.OrderGetPayload<{
  include: {
    category: { select: { id: true; name: true; slug: true } };
    client: { select: { id: true; firstName: true; lastName: true; avatar: true } };
    city: { select: { id: true; name: true; slug: true } };
    assignedProvider: {
      select: {
        id: true;
        rating: true;
        isVerified: true;
        user: { select: { firstName: true; avatar: true } };
      };
    };
    review: { select: { id: true; rating: true; text: true } };
    proposals: {
      include: {
        provider: {
          select: {
            id: true;
            rating: true;
            isVerified: true;
            user: { select: { firstName: true; lastName: true; avatar: true } };
          };
        };
      };
    };
  };
}> & {
  lat: number | null;
  lng: number | null;
};

export interface CreateOrderInput {
  categoryId: string;
  cityId: string;
  title: string;
  description: string;
  budget?: string | null;
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
  images?: string[];
}

export type OrderSort = "new" | "budget_desc" | "budget_asc";

export interface OrderListParams {
  categoryId?: string;
  cityId?: string;
  search?: string;
  sort?: OrderSort;
  cursor?: string;
  pageSize?: number;
  lat?: number;
  lng?: number;
  radiusKm?: number;
}

export interface OrderMapPoint {
  id: string;
  orderNumber: number;
  slug: string | null;
  title: string;
  budget: number | null;
  lat: number;
  lng: number;
  distanceMeters: number | null;
  href: string;
  city: {
    name: string;
    slug: string;
  };
  category: {
    name: string;
    slug: string;
  };
}

export interface BBox {
  minLat: number;
  minLng: number;
  maxLat: number;
  maxLng: number;
}

export interface OrderMapParams {
  categoryId?: string;
  cityId?: string;
  search?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  bbox?: BBox;
}

interface RawOrderRow {
  id: string;
  orderNumber: number;
  slug: string | null;
  title: string;
  description: string;
  images: string[];
  budget: number | null;
  address: string | null;
  status: string;
  createdAt: Date;
  distanceMeters: number;
  proposalCount: number;
  categoryName: string;
  categorySlug: string;
  clientFirstName: string;
  clientAvatar: string | null;
  cityName: string;
  citySlug: string;
}

interface RawCountRow {
  count: number;
}

interface RawOrderMapRow {
  id: string;
  orderNumber: number;
  slug: string | null;
  title: string;
  budget: number | null;
  lat: number;
  lng: number;
  distanceMeters: number | null;
  categoryName: string;
  categorySlug: string;
  cityName: string;
  citySlug: string;
}

interface RawOrderCoordinates {
  lat: number | null;
  lng: number | null;
}

function orderHref(row: Pick<RawOrderMapRow, "citySlug" | "categorySlug" | "slug" | "id">) {
  return `/orders/${row.citySlug}/${row.categorySlug}/${row.slug || row.id}`;
}

async function resolveOrderPoint(
  address: string | null | undefined, 
  cityId: string,
  lat?: number | null,
  lng?: number | null
) {
  if (lat != null && lng != null) {
    return { lat, lng };
  }

  if (!address?.trim()) {
    return null;
  }

  const city = await db.city.findUnique({
    where: { id: cityId },
    select: { name: true },
  });

  return geocodeOrderAddress(address, city?.name);
}

function pointSql(point: GeoPoint) {
  return Prisma.sql`ST_SetSRID(ST_MakePoint(${point.lng}, ${point.lat}), 4326)`;
}

function parseNearbyCursor(cursor: string | undefined) {
  if (!cursor?.startsWith("geo:")) {
    return 0;
  }

  const offset = Number(cursor.slice(4));
  return Number.isInteger(offset) && offset > 0 ? offset : 0;
}

export const orderService = {
  /**
   * Create a new order
   */
  async create(data: CreateOrderInput, userId: string) {
    const point = await resolveOrderPoint(data.address, data.cityId, data.lat, data.lng);

    const order = await db.order.create({
      data: {
        clientId: userId,
        categoryId: data.categoryId,
        cityId: data.cityId,
        title: data.title,
        description: data.description,
        budget: data.budget ? parseFloat(data.budget) : null,
        address: data.address,
        lat: point?.lat,
        lng: point?.lng,
        images: data.images || [],
        status: "OPEN",
      } as any,
    });

    await syncOrderLocation(order.id, point);

    // Generate SEO slug: title-orderNumber
    const slug = `${slugify(data.title)}-${order.orderNumber}`;
    const updatedOrder = await db.order.update({
      where: { id: order.id },
      data: { slug },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        city: { select: { id: true, name: true, slug: true } },
      }
    });

    // Notify providers (fire-and-forget)
    notifyProvidersInCategories(
      [data.categoryId],
      userId,
      data.title,
      updatedOrder.slug || updatedOrder.id
    );

    return updatedOrder;
  },

  /**
   * List orders with optional filters and pagination
   */
  async list(params: OrderListParams, userId?: string) {
    const { categoryId, cityId, search, sort = "new", cursor, pageSize = DEFAULT_PAGE_SIZE } = params;
    const nearbyPoint = toGeoPoint(params.lat, params.lng);

    if (nearbyPoint) {
      return orderService.listNearby(params, userId, nearbyPoint);
    }

    const where: Prisma.OrderWhereInput = { status: "OPEN" };

    if (cityId) {
      where.cityId = cityId;
    }

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

    // Count uses the final filter set, including search conditions.
    const totalCount = await db.order.count({ where });

    const orderBy: Prisma.OrderOrderByWithRelationInput[] =
      sort === "budget_desc"
        ? [{ budget: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }]
        : sort === "budget_asc"
          ? [{ budget: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }]
          : [{ createdAt: "desc" }];

    const ordersRaw = await db.order.findMany({
      where,
      select: {
        id: true,
        orderNumber: true,
        slug: true,
        title: true,
        description: true,
        images: true,
        budget: true,
        address: true,
        createdAt: true,
        status: true,
        category: { select: { name: true, slug: true } },
        client: { select: { firstName: true, avatar: true } },
        city: { select: { name: true, slug: true } },
        _count: { select: { proposals: true } },
      },
      orderBy,
      take: pageSize + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });

    const hasMore = ordersRaw.length > pageSize;
    const pageRaw = hasMore ? ordersRaw.slice(0, pageSize) : ordersRaw;

    // Один батч-запрос: какие заказы этой страницы уже имеют отклик от текущего исполнителя
    let proposedOrderIds = new Set<string>();
    if (userId) {
      const providerProfile = await db.providerProfile.findUnique({
        where: { userId },
        select: { id: true },
      });
      if (providerProfile) {
        const existing = await db.proposal.findMany({
          where: {
            providerId: providerProfile.id,
            orderId: { in: pageRaw.map(o => o.id) },
          },
          select: { orderId: true },
        });
        proposedOrderIds = new Set(existing.map(p => p.orderId));
      }
    }

    const orders: OrderCardData[] = pageRaw.map(o => ({
      id: o.id,
      orderNumber: o.orderNumber,
      slug: o.slug,
      title: o.title,
      description: o.description,
      images: o.images,
      budget: o.budget,
      address: o.address,
      createdAt: o.createdAt,
      status: o.status,
      category: o.category,
      client: o.client,
      city: o.city || { name: 'Неизвестно' },
      proposalCount: o._count.proposals,
      hasProposal: proposedOrderIds.has(o.id),
    }));

    const nextCursor = hasMore ? orders[orders.length - 1].id : null;

    return { orders, nextCursor, totalCount };
  },

  async listNearby(params: OrderListParams, userId: string | undefined, point: GeoPoint) {
    const { categoryId, cityId, search, pageSize = DEFAULT_PAGE_SIZE } = params;
    const offset = parseNearbyCursor(params.cursor);
    const radiusKm = normalizeRadiusKm(params.radiusKm);
    const radiusMeters = radiusKm * 1000;
    const conditions: Prisma.Sql[] = [
      Prisma.sql`o."status" = 'OPEN'`,
      Prisma.sql`o."lat" IS NOT NULL`,
      Prisma.sql`o."lng" IS NOT NULL`,
      Prisma.sql`ST_DWithin(
        COALESCE(o."orderLocation", ST_SetSRID(ST_MakePoint(o."lng", o."lat"), 4326))::geography,
        ${pointSql(point)}::geography,
        ${radiusMeters}
      )`,
    ];

    if (cityId) {
      conditions.push(Prisma.sql`o."cityId" = ${cityId}`);
    }

    if (categoryId && categoryId !== "all") {
      conditions.push(Prisma.sql`o."categoryId" = ${categoryId}`);
    } else if (!categoryId && userId) {
      const userWithProvider = await db.user.findUnique({
        where: { id: userId },
        select: { providerProfile: { select: { id: true } } },
      });

      if (userWithProvider?.providerProfile) {
        const providerCategories = await db.providerCategory.findMany({
          where: { providerId: userWithProvider.providerProfile.id },
          select: { categoryId: true },
        });
        const categoryIds = providerCategories.map((item) => item.categoryId);
        if (categoryIds.length > 0) {
          conditions.push(Prisma.sql`o."categoryId" IN (${Prisma.join(categoryIds)})`);
        }
      }
    }

    if (search && search.trim().length >= 2) {
      const pattern = `%${search.trim()}%`;
      conditions.push(Prisma.sql`(o."title" ILIKE ${pattern} OR o."description" ILIKE ${pattern})`);
    }

    const whereSql = Prisma.sql`WHERE ${Prisma.join(conditions, " AND ")}`;
    const countRows = await db.$queryRaw<RawCountRow[]>`
      SELECT COUNT(*)::int AS "count"
      FROM "Order" o
      ${whereSql}
    `;
    const totalCount = countRows[0]?.count ?? 0;

    const rows = await db.$queryRaw<RawOrderRow[]>`
      SELECT
        o."id",
        o."orderNumber",
        o."slug",
        o."title",
        o."description",
        o."images",
        o."budget",
        o."address",
        o."status",
        o."createdAt",
        ST_Distance(
          COALESCE(o."orderLocation", ST_SetSRID(ST_MakePoint(o."lng", o."lat"), 4326))::geography,
          ${pointSql(point)}::geography
        )::float AS "distanceMeters",
        (
          SELECT COUNT(*)::int
          FROM "Proposal" p
          WHERE p."orderId" = o."id"
        ) AS "proposalCount",
        cat."name" AS "categoryName",
        cat."slug" AS "categorySlug",
        c."firstName" AS "clientFirstName",
        c."avatar" AS "clientAvatar",
        city."name" AS "cityName",
        city."slug" AS "citySlug"
      FROM "Order" o
      JOIN "Category" cat ON cat."id" = o."categoryId"
      JOIN "User" c ON c."id" = o."clientId"
      JOIN "City" city ON city."id" = o."cityId"
      ${whereSql}
      ORDER BY "distanceMeters" ASC, o."createdAt" DESC
      LIMIT ${pageSize + 1}
      OFFSET ${offset}
    `;

    const hasMore = rows.length > pageSize;
    const pageRows = hasMore ? rows.slice(0, pageSize) : rows;

    let proposedOrderIds = new Set<string>();
    if (userId && pageRows.length > 0) {
      const providerProfile = await db.providerProfile.findUnique({
        where: { userId },
        select: { id: true },
      });

      if (providerProfile) {
        const existing = await db.proposal.findMany({
          where: {
            providerId: providerProfile.id,
            orderId: { in: pageRows.map((row) => row.id) },
          },
          select: { orderId: true },
        });
        proposedOrderIds = new Set(existing.map((proposal) => proposal.orderId));
      }
    }

    const orders: OrderCardData[] = pageRows.map((row) => ({
      id: row.id,
      orderNumber: row.orderNumber,
      slug: row.slug,
      title: row.title,
      description: row.description,
      images: row.images,
      budget: row.budget,
      address: row.address,
      createdAt: row.createdAt,
      status: row.status,
      category: {
        name: row.categoryName,
        slug: row.categorySlug,
      },
      client: {
        firstName: row.clientFirstName,
        avatar: row.clientAvatar,
      },
      city: {
        name: row.cityName,
        slug: row.citySlug,
      },
      proposalCount: row.proposalCount,
      hasProposal: proposedOrderIds.has(row.id),
      distance: row.distanceMeters,
    }));

    return { orders, nextCursor: hasMore ? `geo:${offset + pageSize}` : null, totalCount };
  },

  async listMapPoints(params: OrderMapParams): Promise<OrderMapPoint[]> {
    const point = toGeoPoint(params.lat, params.lng);
    const radiusKm = normalizeRadiusKm(params.radiusKm);
    const radiusMeters = radiusKm * 1000;
    const conditions: Prisma.Sql[] = [
      Prisma.sql`o."status" = 'OPEN'`,
      Prisma.sql`o."lat" IS NOT NULL`,
      Prisma.sql`o."lng" IS NOT NULL`,
    ];

    if (params.cityId && !params.bbox) {
      conditions.push(Prisma.sql`o."cityId" = ${params.cityId}`);
    }

    if (params.categoryId && params.categoryId !== "all") {
      conditions.push(Prisma.sql`o."categoryId" = ${params.categoryId}`);
    }

    if (params.search && params.search.trim().length >= 2) {
      const pattern = `%${params.search.trim()}%`;
      conditions.push(Prisma.sql`(o."title" ILIKE ${pattern} OR o."description" ILIKE ${pattern})`);
    }

    if (params.bbox) {
      const { minLat, minLng, maxLat, maxLng } = params.bbox;
      conditions.push(Prisma.sql`ST_Intersects(
        COALESCE(o."orderLocation", ST_SetSRID(ST_MakePoint(o."lng", o."lat"), 4326)),
        ST_MakeEnvelope(${minLng}, ${minLat}, ${maxLng}, ${maxLat}, 4326)
      )`);
    } else if (point) {
      conditions.push(Prisma.sql`ST_DWithin(
        COALESCE(o."orderLocation", ST_SetSRID(ST_MakePoint(o."lng", o."lat"), 4326))::geography,
        ${pointSql(point)}::geography,
        ${radiusMeters}
      )`);
    }

    const distanceSql = point
      ? Prisma.sql`ST_Distance(
          COALESCE(o."orderLocation", ST_SetSRID(ST_MakePoint(o."lng", o."lat"), 4326))::geography,
          ${pointSql(point)}::geography
        )::float`
      : Prisma.sql`NULL::float`;

    const rows = await db.$queryRaw<RawOrderMapRow[]>`
      SELECT
        o."id",
        o."orderNumber",
        o."slug",
        o."title",
        o."budget",
        o."lat",
        o."lng",
        ${distanceSql} AS "distanceMeters",
        cat."name" AS "categoryName",
        cat."slug" AS "categorySlug",
        city."name" AS "cityName",
        city."slug" AS "citySlug"
      FROM "Order" o
      JOIN "Category" cat ON cat."id" = o."categoryId"
      JOIN "City" city ON city."id" = o."cityId"
      WHERE ${Prisma.join(conditions, " AND ")}
      ORDER BY
        "distanceMeters" ASC NULLS LAST,
        o."createdAt" DESC
      LIMIT 500
    `;

    return rows.map((row) => ({
      id: row.id,
      orderNumber: row.orderNumber,
      slug: row.slug,
      title: row.title,
      budget: row.budget,
      lat: row.lat,
      lng: row.lng,
      distanceMeters: row.distanceMeters,
      href: orderHref(row),
      city: {
        name: row.cityName,
        slug: row.citySlug,
      },
      category: {
        name: row.categoryName,
        slug: row.categorySlug,
      },
    }));
  },

  /**
   * Get single order by ID or Slug
   */
  async getById(idOrSlug: string): Promise<OrderWithDetails | null> {
    const order = await db.order.findFirst({
      where: {
        OR: [
          { id: idOrSlug },
          { slug: idOrSlug }
        ]
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        client: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
        city: { select: { id: true, name: true, slug: true } },
        assignedProvider: {
          select: {
            id: true,
            rating: true,
            isVerified: true,
            user: { select: { firstName: true, avatar: true } },
          },
        },
        review: { select: { id: true, rating: true, text: true } },
        proposals: {
          orderBy: { createdAt: "desc" },
          include: {
            provider: {
              select: {
                id: true,
                rating: true,
                isVerified: true,
                user: { select: { firstName: true, lastName: true, avatar: true } },
              },
            },
          },
        },
      },
    });

    if (!order) {
      return null;
    }

    const [coordinates] = await db.$queryRaw<RawOrderCoordinates[]>`
      SELECT "lat", "lng"
      FROM "Order"
      WHERE "id" = ${order.id}
      LIMIT 1
    `;

    return {
      ...order,
      lat: coordinates?.lat ?? null,
      lng: coordinates?.lng ?? null,
    };
  },

  /**
   * Get orders created by a specific client
   */
  async getByClient(userId: string, pageSize = DEFAULT_PAGE_SIZE, cursor?: string) {
    const orders = await db.order.findMany({
      where: { clientId: userId },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        city: { select: { id: true, name: true, slug: true } },
        _count: { select: { proposals: true } },
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
   * Update order (partial)
   */
  async update(id: string, data: Partial<CreateOrderInput>, userId: string) {
    const order = await db.order.findUnique({
      where: { id },
      select: { clientId: true, status: true, address: true, cityId: true },
    });

    if (!order) throw new Error("Заявка не найдена");
    if (order.clientId !== userId) throw new Error("Вы не являетесь автором заявки");
    if (order.status !== "OPEN") throw new Error("Заявку можно изменить только в статусе OPEN");

    const nextAddress = data.address !== undefined ? data.address : order.address;
    const nextCityId = data.cityId !== undefined ? data.cityId : order.cityId;
    const shouldRefreshPoint = 
      data.address !== undefined || 
      data.cityId !== undefined || 
      data.lat !== undefined || 
      data.lng !== undefined;

    const point = shouldRefreshPoint 
      ? await resolveOrderPoint(nextAddress, nextCityId, data.lat, data.lng) 
      : undefined;

    const updatedOrder = await db.order.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
        ...(data.cityId !== undefined && { cityId: data.cityId }),
        ...(data.budget !== undefined && { budget: data.budget ? parseFloat(data.budget) : null }),
        ...(data.address !== undefined && { address: data.address }),
        ...(point !== undefined && { lat: point?.lat, lng: point?.lng }),
        ...(data.images !== undefined && { images: data.images }),
      } as any,
      include: { 
        category: { select: { slug: true } },
        city: { select: { slug: true } }
      },
    });

    if (point !== undefined) {
      await syncOrderLocation(id, point);
    }

    return updatedOrder;
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
      select: { firstName: true, providerProfile: { select: { id: true } } },
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
