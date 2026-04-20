import { NextRequest } from "next/server";
import { authService } from "@/services/auth.service";
import { apiSuccess, apiError } from "@/shared/lib/api-helpers";
import { registerSchema } from "@uslugi/validation";

/**
 * POST /api/v1/auth/register — регистрация по email (отправляет письмо верификации)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation failed", 400, parsed.error.flatten());
    }

    await authService.register({
      email: parsed.data.email,
      password: parsed.data.password,
      firstName: parsed.data.name,
      authProvider: "EMAIL",
    });

    return apiSuccess(
      { success: true, message: "Проверьте почту для подтверждения" },
      201,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Registration failed";
    console.error("[API/AUTH/REGISTER] Error:", error);
    return apiError(message, 400);
  }
}
