import { NextRequest } from "next/server";
import { cityService } from "@/services/city.service";
import { apiSuccess, apiError } from "@/shared/lib/api-helpers";

/**
 * GET /api/v1/cities?search=... — список активных городов
 */
export async function GET(request: NextRequest) {
  try {
    const search = request.nextUrl.searchParams.get("search");
    const cities = search
      ? await cityService.search(search)
      : await cityService.list();
    return apiSuccess({ cities });
  } catch (error) {
    console.error("[API/CITIES/GET] Error:", error);
    return apiError("Failed to fetch cities", 500);
  }
}
