import { db } from "@/shared/lib/db";

export const cityService = {
  /**
   * List all active cities
   */
  async list() {
    return db.city.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" }
    });
  },

  /**
   * Get city by ID
   */
  async getById(id: string) {
    return db.city.findUnique({
      where: { id }
    });
  },

  /**
   * Find cities by name (search)
   */
  async search(query: string) {
    return db.city.findMany({
      where: {
        name: { contains: query, mode: "insensitive" },
        isActive: true
      },
      take: 10
    });
  }
};
