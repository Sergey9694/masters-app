import { NextRequest } from "next/server";
import { userService } from "@/services/user.service";
import { apiSuccess, apiUnauthorized, apiError } from "@/shared/lib/api-helpers";
import { getSessionFromRequest } from "@/shared/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  
  if (!session) {
    return apiUnauthorized();
  }

  try {
    const user = await userService.getById(session.userId);
    
    if (!user) {
      return apiError("User not found", 404);
    }

    // Удаляем чувствительные данные по Правилу 5
    const safeUser = { ...user } as Omit<typeof user, "passwordHash"> & {
      passwordHash?: unknown;
    };
    delete safeUser.passwordHash;

    return apiSuccess(safeUser);
  } catch (error) {
    console.error("[API/ME] Error:", error);
    return apiError("Internal server error", 500);
  }
}
