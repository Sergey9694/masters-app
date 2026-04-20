import { NextRequest } from "next/server";
import { proposalService } from "@/services/proposal.service";
import { apiSuccess, apiUnauthorized, apiError } from "@/shared/lib/api-helpers";
import { getSessionFromRequest } from "@/shared/lib/auth";

/**
 * GET /api/v1/proposals/my — мои отклики
 */
export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return apiUnauthorized();

  try {
    const { searchParams } = request.nextUrl;
    const cursor = searchParams.get("cursor") || undefined;
    const pageSize = searchParams.get("pageSize")
      ? parseInt(searchParams.get("pageSize")!)
      : undefined;

    const result = await proposalService.listByProvider(session.userId, pageSize, cursor);
    return apiSuccess(result);
  } catch (error) {
    console.error("[API/PROPOSALS/MY] Error:", error);
    return apiError("Failed to fetch your proposals", 500);
  }
}
