import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/shared/lib/auth";
import { apiSuccess, apiUnauthorized, apiError } from "@/shared/lib/api-helpers";
import { chatService } from "@/services/chat.service";
import { checkRateLimit } from "@/shared/lib/rate-limit";

/**
 * GET /api/v1/conversations/[id]/messages — постраничные сообщения диалога
 *
 * Query params:
 *   cursor — ID сообщения, с которого начинать (не включая его)
 *   limit  — количество сообщений (макс. 100, по умолчанию 50)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(request);
  if (!session) return apiUnauthorized();

  const { id } = await params;
  const { searchParams } = request.nextUrl;
  const cursor = searchParams.get("cursor") ?? undefined;
  const limit = Math.min(Number(searchParams.get("limit") ?? "50"), 100);

  try {
    const messages = await chatService.getMessages(id, session.userId, cursor, limit);
    return apiSuccess({ data: messages });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error";
    // chatService бросает "Нет доступа к диалогу" при отсутствии участника
    const status = msg.includes("доступа") ? 403 : 400;
    return apiError(msg, status);
  }
}

/**
 * POST /api/v1/conversations/[id]/messages — отправить сообщение
 *
 * Body: { text: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(request);
  if (!session) return apiUnauthorized();

  const { id } = await params;

  // B6: Rate limit (30 messages per 60s)
  const rl = checkRateLimit({ 
    key: `chat:api:${session.userId}`, 
    limit: 30, 
    windowSec: 60 
  });
  if (!rl.allowed) {
    return apiError(`Too many messages. Retry in ${rl.retryAfterSec}s`, 429);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON", 400);
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("text" in body) ||
    typeof (body as { text: unknown }).text !== "string"
  ) {
    return apiError("text is required and must be a string", 400);
  }

  const text = (body as { text: string }).text.trim();
  if (!text) return apiError("text cannot be empty", 400);

  try {
    const message = await chatService.sendMessage(id, session.userId, text);
    return NextResponse.json({ data: message }, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error";
    const status = msg.includes("доступа") ? 403 : 400;
    return apiError(msg, status);
  }
}
