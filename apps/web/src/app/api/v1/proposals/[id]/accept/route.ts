import { NextRequest } from "next/server";
import { orderService } from "@/services/order.service";
import { apiSuccess, apiUnauthorized, apiError } from "@/shared/lib/api-helpers";
import { getSessionFromRequest } from "@/shared/lib/auth";

type Params = { params: Promise<{ id: string }> };

/**
 * POST /api/v1/proposals/[id]/accept — клиент принимает предложение
 */
export async function POST(request: NextRequest, { params }: Params) {
  const session = await getSessionFromRequest(request);
  if (!session) return apiUnauthorized();

  const { id } = await params;
  try {
    const result = await orderService.acceptProposal(id, session.userId);
    return apiSuccess(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to accept proposal";
    console.error("[API/PROPOSALS/:id/ACCEPT] Error:", error);
    return apiError(message, 400);
  }
}
