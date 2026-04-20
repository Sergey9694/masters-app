import { db } from "@/shared/lib/db";

export interface SaveProviderProfileInput {
  bio: string;
  categoryIds: string[];
  experienceYears: number;
  minPrice?: number;
  portfolio?: string[];
  avatarUrl?: string;
}

export const providerService = {
  /**
   * Save or update provider profile
   */
  async saveProfile(data: SaveProviderProfileInput, userId: string) {
    const { bio, categoryIds, experienceYears, minPrice, portfolio, avatarUrl } = data;

    const existingCategories = await db.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true },
    });
    
    if (existingCategories.length !== categoryIds.length) {
      throw new Error("Одна из категорий недоступна");
    }

    const provider = await db.$transaction(async (tx) => {
      const userProfile = await tx.providerProfile.findUnique({
        where: { userId }
      });

      // Clear old categories if updating
      if (userProfile) {
        await tx.providerCategory.deleteMany({
          where: { providerId: userProfile.id }
        });
      }

      const result = await tx.providerProfile.upsert({
        where: { userId },
        update: {
          bio,
          experienceYears,
          minPrice,
          portfolio: portfolio || [],
          categories: {
            create: categoryIds.map((categoryId) => ({ categoryId })),
          },
        },
        create: {
          userId,
          bio,
          experienceYears,
          minPrice,
          portfolio: portfolio || [],
          categories: {
            create: categoryIds.map((categoryId) => ({ categoryId })),
          },
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: { 
          role: "PROVIDER",
          ...(avatarUrl && { avatar: avatarUrl })
        },
      });

      return result;
    });

    return provider;
  },

  /**
   * Get provider profile by ID
   */
  async getById(id: string) {
    return db.providerProfile.findUnique({
      where: { id },
      include: {
        user: { select: { firstName: true, lastName: true, avatar: true, createdAt: true } },
        categories: { include: { category: true } },
        reviews: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: { author: { select: { firstName: true, avatar: true } } }
        }
      }
    });
  },

  /**
   * List providers with optional city/category filters
   */
  async list(params: {
    cityId?: string;
    categoryId?: string;
    pageSize?: number;
    cursor?: string;
  }) {
    const pageSize = params.pageSize ?? 20;

    const where: any = {};
    if (params.cityId) {
      where.user = { cityId: params.cityId };
    }
    if (params.categoryId) {
      where.categories = { some: { categoryId: params.categoryId } };
    }

    const providers = await db.providerProfile.findMany({
      where,
      select: {
        id: true,
        bio: true,
        rating: true,
        isVerified: true,
        experienceYears: true,
        minPrice: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            displayName: true,
            avatar: true,
            cityId: true,
          },
        },
        categories: { select: { category: { select: { id: true, name: true } } } },
      },
      orderBy: { rating: "desc" },
      take: pageSize + 1,
      ...(params.cursor ? { skip: 1, cursor: { id: params.cursor } } : {}),
    });

    const hasMore = providers.length > pageSize;
    const page = hasMore ? providers.slice(0, pageSize) : providers;
    const nextCursor = hasMore ? page[page.length - 1].id : null;

    return { providers: page, nextCursor };
  },

  /**
   * Get provider profile by User ID
   */
  async getByUserId(userId: string) {
    return db.providerProfile.findUnique({
      where: { userId },
      include: {
        categories: { select: { categoryId: true } }
      }
    });
  }
};
