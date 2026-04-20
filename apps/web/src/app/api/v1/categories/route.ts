import { NextRequest } from "next/server";
import { categoryService } from "@/services/category.service";
import { apiSuccess, apiError } from "@/shared/lib/api-helpers";

/**
 * GET /api/v1/categories?tree=1 — список категорий
 */
export async function GET(request: NextRequest) {
  try {
    const tree = request.nextUrl.searchParams.get("tree") === "1";
    const categories = tree
      ? await categoryService.getTree()
      : await categoryService.listRoot();
    return apiSuccess({ categories });
  } catch (error) {
    console.error("[API/CATEGORIES/GET] Error:", error);
    return apiError("Failed to fetch categories", 500);
  }
}
