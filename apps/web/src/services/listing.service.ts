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
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                displayName: true,
                avatar: true,
              },
            },
          },
        },
        category: true,
      },
      orderBy: { createdAt: "desc" },
      take: filters.limit || 20,
      skip: filters.offset || 0,
    });
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
            user: true,
          },
        },
        category: true,
        city: true,
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
