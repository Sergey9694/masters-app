import { NextRequest } from "next/server";
import { proposalService } from "@/services/proposal.service";
import { apiSuccess, apiUnauthorized, apiError } from "@/shared/lib/api-helpers";
import { getSessionFromRequest } from "@/shared/lib/auth";
import { createProposalSchema } from "@uslugi/validation";

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/v1/orders/[id]/proposals — предложения к заказу (только для клиента)
 */
export async function GET(request: NextRequest, { params }: Params) {
  const session = await getSessionFromRequest(request);
  if (!session) return apiUnauthorized();

  const { id } = await params;

  try {
    const proposals = await proposalService.listByOrder(id, session.userId);
    return apiSuccess({ proposals });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch proposals";
    console.error("[API/ORDERS/:id/PROPOSALS/GET] Error:", error);
    return apiError(message, 400);
  }
}

/**
 * POST /api/v1/orders/[id]/proposals — отправить предложение
 */
export async function POST(request: NextRequest, { params }: Params) {
  const session = await getSessionFromRequest(request);
  if (!session) return apiUnauthorized();

  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = createProposalSchema.safeParse({ ...body, orderId: id });
    if (!parsed.success) {
      return apiError("Validation failed", 400, parsed.error.flatten());
    }

    const proposal = await proposalService.create(
      {
        orderId: parsed.data.orderId,
        price: parsed.data.price ? Number(parsed.data.price) : undefined,
        message: parsed.data.message,
      },
      session.userId,
    );

    return apiSuccess(proposal, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create proposal";
    console.error("[API/ORDERS/:id/PROPOSALS/POST] Error:", error);
    return apiError(message, 400);
  }
}
