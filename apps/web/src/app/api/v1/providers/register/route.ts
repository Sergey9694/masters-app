import { NextRequest } from "next/server";
import { providerService } from "@/services/provider.service";
import { apiSuccess, apiUnauthorized, apiError } from "@/shared/lib/api-helpers";
import { getSessionFromRequest } from "@/shared/lib/auth";
import { providerProfileSchema } from "@uslugi/validation";

/**
 * POST /api/v1/providers/register — стать исполнителем / обновить профиль
 */
export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return apiUnauthorized();

  try {
    const body = await request.json();
    const parsed = providerProfileSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation failed", 400, parsed.error.flatten());
    }

    const profile = await providerService.saveProfile(parsed.data, session.userId);
    return apiSuccess(profile, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save provider profile";
    console.error("[API/PROVIDERS/REGISTER] Error:", error);
    return apiError(message, 400);
  }
}
