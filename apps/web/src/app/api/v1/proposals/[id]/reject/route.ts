import { NextRequest } from "next/server";
import { proposalService } from "@/services/proposal.service";
import { apiSuccess, apiUnauthorized, apiError } from "@/shared/lib/api-helpers";
import { getSessionFromRequest } from "@/shared/lib/auth";

type Params = { params: Promise<{ id: string }> };

/**
 * POST /api/v1/proposals/[id]/reject — исполнитель отзывает свой отклик
 */
export async function POST(request: NextRequest, { params }: Params) {
  const session = await getSessionFromRequest(request);
  if (!session) return apiUnauthorized();

  const { id } = await params;
  try {
    const result = await proposalService.withdraw(id, session.userId);
    return apiSuccess(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to reject proposal";
    console.error("[API/PROPOSALS/:id/REJECT] Error:", error);
    return apiError(message, 400);
  }
}
