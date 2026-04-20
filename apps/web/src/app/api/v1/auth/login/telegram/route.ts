import { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, apiError } from "@/shared/lib/api-helpers";
import {
  encrypt,
  validateTelegramWebAppData,
  validateTelegramWidgetData,
  type TelegramWidgetUser,
} from "@/shared/lib/auth";
import { db } from "@/shared/lib/db";

const ONE_DAY = 24 * 60 * 60 * 1000;

const telegramWebAppSchema = z.object({
  type: z.literal("webapp"),
  initData: z.string().min(1),
});

const telegramWidgetSchema = z.object({
  type: z.literal("widget"),
  id: z.number(),
  first_name: z.string(),
  last_name: z.string().optional(),
  username: z.string().optional(),
  photo_url: z.string().optional(),
  auth_date: z.number(),
  hash: z.string(),
});

const payloadSchema = z.union([telegramWebAppSchema, telegramWidgetSchema]);

/**
 * POST /api/v1/auth/login/telegram — вход через Telegram (WebApp или Login Widget)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = payloadSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation failed", 400, parsed.error.flatten());
    }

    let telegramId: bigint;
    let firstName: string;
    let lastName: string | null = null;
    let avatar: string | null = null;

    if (parsed.data.type === "webapp") {
      const check = validateTelegramWebAppData(parsed.data.initData);
      if (!check.ok) return apiError(`Telegram: ${check.reason}`, 401);

      const params = new URLSearchParams(parsed.data.initData);
      const userRaw = params.get("user");
      if (!userRaw) return apiError("No user data", 400);

      const tgUser = JSON.parse(userRaw);
      telegramId = BigInt(tgUser.id);
      firstName = tgUser.first_name || "User";
      lastName = tgUser.last_name || null;
      avatar = tgUser.photo_url || null;
    } else {
      const { type: _type, ...widgetData } = parsed.data;
      const check = validateTelegramWidgetData(widgetData as TelegramWidgetUser);
      if (!check.ok) return apiError(`Telegram: ${check.reason}`, 401);

      telegramId = BigInt(parsed.data.id);
      firstName = parsed.data.first_name;
      lastName = parsed.data.last_name || null;
      avatar = parsed.data.photo_url || null;
    }

    const user = await db.user.upsert({
      where: { telegramId },
      update: { firstName, lastName, ...(avatar ? { avatar } : {}) },
      create: {
        telegramId,
        firstName,
        lastName,
        ...(avatar ? { avatar } : {}),
        authProvider: "TELEGRAM",
      },
      select: { id: true, role: true, isBanned: true },
    });

    if (user.isBanned) return apiError("Аккаунт заблокирован", 403);

    const expires = new Date(Date.now() + ONE_DAY);
    const token = await encrypt({ userId: user.id, role: user.role, expires });

    return apiSuccess({ token, expires: expires.toISOString() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Telegram login failed";
    console.error("[API/AUTH/LOGIN/TELEGRAM] Error:", error);
    return apiError(message, 400);
  }
}
