import { NextRequest } from "next/server";
import { providerService } from "@/services/provider.service";
import { apiSuccess, apiError } from "@/shared/lib/api-helpers";

/**
 * GET /api/v1/providers?cityId=...&categoryId=...&cursor=...
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const result = await providerService.list({
      cityId: searchParams.get("cityId") || undefined,
      categoryId: searchParams.get("categoryId") || undefined,
      cursor: searchParams.get("cursor") || undefined,
      pageSize: searchParams.get("pageSize")
        ? parseInt(searchParams.get("pageSize")!)
        : undefined,
    });
    return apiSuccess(result);
  } catch (error) {
    console.error("[API/PROVIDERS/GET] Error:", error);
    return apiError("Failed to fetch providers", 500);
  }
}
