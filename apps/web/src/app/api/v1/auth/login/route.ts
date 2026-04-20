import { NextRequest } from "next/server";
import { authService } from "@/services/auth.service";
import { apiSuccess, apiError } from "@/shared/lib/api-helpers";
import { encrypt } from "@/shared/lib/auth";
import { loginSchema } from "@uslugi/validation";
import { db } from "@/shared/lib/db";

const ONE_DAY = 24 * 60 * 60 * 1000;

/**
 * POST /api/v1/auth/login — логин по email/паролю, возвращает JWT-токен (Bearer)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation failed", 400, parsed.error.flatten());
    }

    const validated = await authService.validateCredentials(
      parsed.data.email,
      parsed.data.password,
    );
    if (!validated) return apiError("Неверный email или пароль", 401);

    const user = await db.user.findUnique({
      where: { id: validated.id },
      select: { id: true, role: true, isBanned: true },
    });
    if (!user) return apiError("Пользователь не найден", 404);
    if (user.isBanned) return apiError("Аккаунт заблокирован", 403);

    const expires = new Date(Date.now() + ONE_DAY);
    const token = await encrypt({ userId: user.id, role: user.role, expires });

    return apiSuccess({
      token,
      expires: expires.toISOString(),
      user: validated,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed";
    console.error("[API/AUTH/LOGIN] Error:", error);
    return apiError(message, 400);
  }
}
