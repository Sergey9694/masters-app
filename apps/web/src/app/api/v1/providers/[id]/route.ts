import { NextRequest } from "next/server";
import { providerService } from "@/services/provider.service";
import { apiSuccess, apiError } from "@/shared/lib/api-helpers";

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/v1/providers/[id]
 */
export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;

  try {
    const provider = await providerService.getById(id);
    if (!provider) return apiError("Provider not found", 404);
    return apiSuccess(provider);
  } catch (error) {
    console.error("[API/PROVIDERS/:id/GET] Error:", error);
    return apiError("Failed to fetch provider", 500);
  }
}
