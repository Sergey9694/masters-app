import { db } from "@/shared/lib/db";
import { ListingStatus, PriceUnit } from "@prisma/client";

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

export const listingService = {
  /**
   * Search listings with filters
   */
  async search(filters: {
    cityId?: string;
    categoryId?: string;
    status?: ListingStatus;
    limit?: number;
    offset?: number;
  }) {
    return db.serviceListing.findMany({
      where: {
        cityId: filters.cityId,
        categoryId: filters.categoryId,
        status: filters.status || "ACTIVE",
      },
      include: {
        provider: {
          select: {
            id: true,
            bio: true,
            rating: true,
            isVerified: true,
            user: { select: { id: true, firstName: true, displayName: true, avatar: true } },
          },
        },
        category: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: filters.limit || 20,
      skip: filters.offset || 0,
    });
  },

  /**
   * List listings owned by a user (via ProviderProfile)
   */
  async getByUser(userId: string, pageSize = 20, cursor?: string) {
    const provider = await db.providerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!provider) {
      return { listings: [], nextCursor: null };
    }

    const listings = await db.serviceListing.findMany({
      where: { providerId: provider.id },
      include: {
        category: { select: { id: true, name: true } },
        city: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: pageSize + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });

    const hasMore = listings.length > pageSize;
    const page = hasMore ? listings.slice(0, pageSize) : listings;
    const nextCursor = hasMore ? page[page.length - 1].id : null;

    return { listings: page, nextCursor };
  },

  /**
   * Get listing by ID
   */
  async getById(id: string) {
    return db.serviceListing.findUnique({
      where: { id },
      include: {
        provider: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, displayName: true, avatar: true } },
          },
        },
        category: { select: { id: true, name: true } },
        city: { select: { id: true, name: true } },
      },
    });
  },

  /**
   * Create new listing
   */
  async create(data: CreateListingInput) {
    return db.serviceListing.create({
      data: {
        ...data,
        status: "ACTIVE",
      },
    });
  },

  /**
   * Update listing
   */
  async update(id: string, data: Partial<CreateListingInput> & { status?: ListingStatus }) {
    return db.serviceListing.update({
      where: { id },
      data,
    });
  },

  /**
   * Delete listing (soft delete via ARCHIVED status preferred)
   */
  async delete(id: string) {
    return db.serviceListing.update({
      where: { id },
      data: { status: "ARCHIVED" },
    });
  }
};
