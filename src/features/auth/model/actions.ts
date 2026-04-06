"use server";

import { db } from "@/shared/lib/db";
import { createSession, validateTelegramWebAppData } from "@/shared/lib/auth";
import { checkRateLimit } from "@/shared/lib/rate-limit";
import { redirect } from "next/navigation";
import { z } from "zod";

const loginSchema = z.object({
  initData: z.string(),
});

export async function loginWithTelegram(initData: string) {
  // 1. Zod input validation
  const validated = loginSchema.safeParse({ initData });
  if (!validated.success) return { error: "Invalid input" };

  // 1.5 Rate-limit по telegramId из initData (до тяжёлой проверки)
  const params0 = new URLSearchParams(initData);
  const userJson0 = params0.get("user");
  let rlKey = "login:unknown";
  try {
    const u = userJson0 ? JSON.parse(userJson0) : {};
    if (u.id) rlKey = `login:${u.id}`;
  } catch { /* ignore */ }
  const rl = checkRateLimit({ key: rlKey, limit: 10, windowSec: 60 });
  if (!rl.allowed) {
    return { error: `Слишком много попыток. Подождите ${rl.retryAfterSec} сек.` };
  }

  // 2. Telegram signature validation (HMAC + TTL)
  const check = validateTelegramWebAppData(initData);
  if (!check.ok) {
    console.error("[loginWithTelegram] validation failed:", check.reason);
    const messages: Record<typeof check.reason, string> = {
      no_token: "Сервер не сконфигурирован (no bot token)",
      no_hash: "Некорректные данные Telegram",
      bad_signature: "Неверная подпись Telegram",
      expired: "Сессия Telegram устарела, перезапустите приложение",
    };
    return { error: messages[check.reason] };
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
    // 4. Atomic upsert (avoids race condition on first-login concurrency)
    const firstName = String(tgUser.first_name || "User");
    const lastName = tgUser.last_name ? String(tgUser.last_name) : null;
    const avatar = tgUser.photo_url ? String(tgUser.photo_url) : null;

    const user = await db.user.upsert({
      where: { telegramId },
      update: { firstName, lastName, avatar },
      create: {
        telegramId,
        firstName,
        lastName,
        avatar,
        role: "USER" as const,
      },
      select: { id: true, role: true },
    });

    // 5. Create session (httpOnly Cookie)
    await createSession(user.id, user.role);

    return { success: true };
  } catch (error) {
    console.error("[loginWithTelegram] DB error:", error);
    return { error: "Ошибка базы данных при входе" };
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
