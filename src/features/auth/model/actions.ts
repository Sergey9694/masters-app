"use server";

import { db } from "@/shared/lib/db";
import { createSession, validateTelegramWebAppData } from "@/shared/lib/auth";
import { redirect } from "next/navigation";
import { z } from "zod";

const loginSchema = z.object({
  initData: z.string(),
});

export async function loginWithTelegram(initData: string) {
  // 1. Zod input validation
  const validated = loginSchema.safeParse({ initData });
  if (!validated.success) return { error: "Invalid input" };

  // 2. Telegram signature validation
  if (!validateTelegramWebAppData(initData)) {
    return { error: "Invalid Telegram signature" };
  }

  // 3. Extract user data (S8: safe JSON parse)
  const params = new URLSearchParams(initData);
  const userJson = params.get("user");
  if (!userJson) return { error: "User data missing" };

  let tgUser: Record<string, unknown>;
  try {
    tgUser = JSON.parse(userJson);
  } catch {
    return { error: "Invalid user data format" };
  }

  if (!tgUser.id || typeof tgUser.id !== "number") {
    return { error: "Invalid Telegram user ID" };
  }

  const telegramId = BigInt(tgUser.id as number);

  try {
    // 4. Find or create user (Server-Side Logic)
    let user = await db.user.findUnique({
      where: { telegramId },
      select: { id: true, role: true },
    });

    if (!user) {
      user = await db.user.create({
        data: {
          telegramId,
          firstName: String(tgUser.first_name || "User"),
          lastName: tgUser.last_name ? String(tgUser.last_name) : null,
          avatar: tgUser.photo_url ? String(tgUser.photo_url) : null,
          role: "USER" as const,
        },
        select: { id: true, role: true },
      });
    }

    // 5. Create session (httpOnly Cookie)
    await createSession(user.id, user.role);

    return { success: true };
  } catch (error) {
    console.error("Login error:", error);
    return { error: "Database error during login" };
  }
}

export async function mockLogin() {
  // Dev-only guard
  if (process.env.NODE_ENV !== "development") return;

  let user = await db.user.findFirst({
    where: { firstName: "Админ" },
    select: { id: true, role: true },
  });

  if (!user) {
    user = await db.user.create({
      data: {
        firstName: "Админ",
        lastName: "Разраб",
        role: "ADMIN",
        phone: "70000000000",
      },
      select: { id: true, role: true },
    });
  }

  await createSession(user.id, user.role);
  redirect("/dashboard");
}
