import { db } from "@/shared/lib/db";

export const categoryService = {
  /**
   * List all root categories
   */
  async listRoot() {
    return db.category.findMany({
      where: { parentId: null },
      orderBy: { sortOrder: "asc" }
    });
  },

  /**
   * Get category with its children
   */
  async getById(id: string) {
    return db.category.findUnique({
      where: { id },
      include: { children: { orderBy: { sortOrder: "asc" } } }
    });
  },

  /**
   * Get category by slug
   */
  async getBySlug(slug: string) {
    return db.category.findUnique({
      where: { slug },
      include: { children: { orderBy: { sortOrder: "asc" } } }
    });
  },

  /**
   * List all categories in a flat tree
   */
  async getTree() {
    return db.category.findMany({
      orderBy: [
        { parentId: "desc" }, // Use desc to put nulls (root) in a certain way or just sort by parent
        { sortOrder: "asc" }
      ]
    });
  }
};
