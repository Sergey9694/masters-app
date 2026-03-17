"use server";

import { db } from "@/shared/lib/db";
import { createSession, validateTelegramWebAppData } from "@/shared/lib/auth";
import { redirect } from "next/navigation";
import { z } from "zod";

const loginSchema = z.object({
  initData: z.string(),
});

export async function loginWithTelegram(initData: string) {
  // 1. Валидация входных данных через Zod
  const validated = loginSchema.safeParse({ initData });
  if (!validated.success) return { error: "Invalid input" };

  // 2. Валидация подписи Telegram
  if (!validateTelegramWebAppData(initData)) {
    return { error: "Invalid Telegram signature" };
  }

  // 3. Извлечение данных пользователя
  const params = new URLSearchParams(initData);
  const userJson = params.get("user");
  if (!userJson) return { error: "User data missing" };

  const tgUser = JSON.parse(userJson);
  const telegramId = BigInt(tgUser.id);

  try {
    // 4. Находим или создаем пользователя (Server-Side Logic)
    let user = await db.user.findUnique({
      where: { telegramId },
    });

    if (!user) {
      user = await db.user.create({
        data: {
          telegramId,
          firstName: tgUser.first_name,
          lastName: tgUser.last_name,
          avatar: tgUser.photo_url,
          role: "USER" // По умолчанию все пользователи
        },
      });
    }

    // 5. Создаем сессию (httpOnly Cookie)
    await createSession(user.id, user.role);
    
    return { success: true };
  } catch (error) {
    console.error("Login error:", error);
    return { error: "Database error during login" };
  }
}
