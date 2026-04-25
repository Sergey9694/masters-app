import { db } from "@/shared/lib/db";
import { DEFAULT_PAGE_SIZE } from "@/shared/lib/constants";
import { slugify } from "@/shared/lib/slugify";
import { type ListingStatus, type PriceUnit } from "@prisma/client";

export interface CreateListingInput {
  providerId: string;
  categoryId: string;
  cityId: string;
  title: string;
  description: string;
  priceFrom?: number;
  priceTo?: number;
  priceUnit?: PriceUnit;
  images?: string[];
  address?: string;
}

export interface ListingSearchParams {
  cityId?: string;
  categoryId?: string;
  status?: ListingStatus;
  cursor?: string;
  pageSize?: number;
}

export const listingService = {
  async search(params: ListingSearchParams) {
    const { cityId, categoryId, status, cursor, pageSize = DEFAULT_PAGE_SIZE } = params;

    const items = await db.serviceListing.findMany({
      where: {
        ...(cityId ? { cityId } : {}),
        ...(categoryId && categoryId !== "all" ? { categoryId } : {}),
        status: status ?? "ACTIVE",
      },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        images: true,
        priceFrom: true,
        priceTo: true,
        priceUnit: true,
        address: true,
        views: true,
        createdAt: true,
        status: true,
        provider: {
          select: {
            id: true,
            rating: true,
            isVerified: true,
            user: { select: { firstName: true, displayName: true, avatar: true } },
          },
        },
        category: { select: { id: true, name: true, slug: true } },
        city: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
      take: pageSize + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });

    const hasMore = items.length > pageSize;
    const page = hasMore ? items.slice(0, pageSize) : items;
    const nextCursor = hasMore ? page[page.length - 1].id : null;

    return { listings: page, nextCursor };
  },

  async getByUser(userId: string, pageSize = DEFAULT_PAGE_SIZE, cursor?: string) {
    const provider = await db.providerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!provider) return { listings: [], nextCursor: null };

    const items = await db.serviceListing.findMany({
      where: { providerId: provider.id },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        images: true,
        priceFrom: true,
        priceTo: true,
        priceUnit: true,
        address: true,
        views: true,
        status: true,
        createdAt: true,
        category: { select: { id: true, name: true, slug: true } },
        city: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
      take: pageSize + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });

    const hasMore = items.length > pageSize;
    const page = hasMore ? items.slice(0, pageSize) : items;
    const nextCursor = hasMore ? page[page.length - 1].id : null;

    return { listings: page, nextCursor };
  },

  async getById(idOrSlug: string) {
    return db.serviceListing.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
      include: {
        provider: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, displayName: true, avatar: true } },
          },
        },
        category: { select: { id: true, name: true, slug: true } },
        city: { select: { id: true, name: true, slug: true } },
      },
    });
  },

  async create(data: CreateListingInput) {
    const listing = await db.serviceListing.create({
      data: {
        ...data,
        status: "ACTIVE",
      },
    });

    const slug = `${slugify(data.title)}-${listing.id.slice(0, 8)}`;

    return db.serviceListing.update({
      where: { id: listing.id },
      data: { slug },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        city: { select: { id: true, name: true, slug: true } },
      },
    });
  },

  async update(id: string, data: Partial<CreateListingInput> & { status?: ListingStatus }) {
    return db.serviceListing.update({
      where: { id },
      data,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        city: { select: { id: true, name: true, slug: true } },
      },
    });
  },

  async toggleStatus(id: string, currentStatus: ListingStatus) {
    const next: ListingStatus = currentStatus === "ACTIVE" ? "PAUSED" : "ACTIVE";
    return db.serviceListing.update({
      where: { id },
      data: { status: next },
    });
  },

  async delete(id: string) {
    return db.serviceListing.update({
      where: { id },
      data: { status: "ARCHIVED" },
    });
  },
};
