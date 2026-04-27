import { NextRequest } from "next/server";
import { getSessionFromRequest } from "@/shared/lib/auth";
import { apiSuccess, apiUnauthorized, apiError } from "@/shared/lib/api-helpers";
import { chatService } from "@/services/chat.service";

/**
 * GET /api/v1/conversations — список диалогов текущего пользователя
 */
export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return apiUnauthorized();

  try {
    const conversations = await chatService.getConversations(session.userId);
    return apiSuccess({ data: conversations });
  } catch (error) {
    console.error("[API/V1/CONVERSATIONS/GET] Error:", error);
    return apiError("Failed to fetch conversations", 500);
  }
}
