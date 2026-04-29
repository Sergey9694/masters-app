"use server";

import { createSession } from "@/shared/lib/auth";
import { db } from "@/shared/lib/db";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";

const loginSchema = z.object({
  username: z.string().min(1, "Введите логин"),
  password: z.string().min(1, "Введите пароль"),
});

import { checkRateLimit } from "@/shared/lib/rate-limit";
import { logAudit } from "@/shared/lib/audit";

export async function adminLogin(_prev: unknown, formData: FormData) {
  // B1: Rate limit brute-force protection (5 attempts per minute per IP/Username)
  const usernameRaw = formData.get("username")?.toString() || "unknown";
  const rl = await checkRateLimit({ 
    key: `admin:login:${usernameRaw}`, 
    limit: 5, 
    windowSec: 60 
  });

  if (!rl.allowed) {
    return { error: `Слишком много попыток. Попробуйте через ${rl.retryAfterSec} сек.` };
  }

  const result = loginSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });

  if (!result.success) {
    return { error: "Заполните все поля" };
  }

  const { username, password } = result.data;

  const user = await db.user.findFirst({
    where: {
      email: { equals: username, mode: "insensitive" },
      role: "ADMIN",
    },
    select: { id: true, role: true, passwordHash: true, email: true },
  });

  if (!user || !user.passwordHash) {
    return { error: "Неверный логин или пароль" };
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return { error: "Неверный логин или пароль" };
  }

  await createSession(user.id, user.role);

  // Логируем вход
  await logAudit({
    userId: user.id,
    action: "ADMIN_LOGIN",
    entity: "User",
    entityId: user.id,
    metadata: { email: user.email }
  });


  redirect("/admin");
}
