"use server";

import { signIn, signOut } from "@/auth";
import { db } from "@/shared/lib/db";
import { redirect } from "next/navigation";
import { z } from "zod";
import { logAudit } from "@/shared/lib/audit";
import { createEmailToken, verifyEmailToken, sendEmail } from "@/shared/lib/email";

const loginSchema = z.object({
  initData: z.string(),
});

/**
 * Login via Telegram using Auth.js Credentials Provider
 */
export async function loginWithTelegram(initData: string) {
  const validated = loginSchema.safeParse({ initData });
  if (!validated.success) return { error: "Invalid input" };

  try {
    const result = await signIn("telegram", {
      initData,
      redirect: false,
    });

    if (result?.error) {
      return { error: "Ошибка входа через Telegram" };
    }

    return { success: true };
  } catch (error) {
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
      throw error; // Let Next.js handle redirects
    }
    console.error("[loginWithTelegram] error:", error);
    return { error: "Внутренняя ошибка при входе" };
  }
}

/**
 * Mock login for development purposes
 */
export async function mockLogin() {
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

  // Auth.js doesn't have a direct "login as user ID" without a provider
  // For mock login, we might need a special "mock" provider or just use current session logic
  // But for now, let's keep it simple and redirect - though session won't be created this way.
  // TODO: Implement mock provider in auth.config.ts if needed
  
  // Alternative: manual session creation if using JWT strategy
  // But let's stay within Auth.js boundaries.
  
  redirect("/dashboard");
}

/**
 * Logout action using Auth.js
 */
export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}

import { actionClient } from "@/shared/lib/safe-action";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
});

export const registerWithEmail = actionClient
  .schema(registerSchema)
  .action(async ({ parsedInput: { email, password, name } }) => {
    const existing = await db.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existing) {
      console.log(`[AUTH_DEBUG] User ${email} already exists, skipping registration.`);
      throw new Error("Пользователь с таким email уже существует");
    }

    console.log(`[AUTH_DEBUG] Creating user: ${email}`);

    const bcrypt = await import("bcryptjs");
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const names = name.split(" ");
    const firstName = names[0];
    const lastName = names.slice(1).join(" ") || "";

    const user = await db.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        authProvider: "EMAIL",
        // @ts-ignore
        emailVerified: null, // Изначально не верифицирован
      },
    });

    const token = await createEmailToken({ email, type: "verify" });
    const verifyLink = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/auth/verify?token=${token}`;

    console.log(`[AUTH_DEBUG] User created, sending verification email...`);
    await sendEmail({
      to: email,
      subject: "Подтвердите ваш email — УслугиРядом",
      html: `<p>Здравствуйте, ${firstName}!</p><p>Для завершения регистрации подтвердите ваш email, перейдя по ссылке:</p><a href="${verifyLink}">${verifyLink}</a>`,
    });

    console.log(`[AUTH_DEBUG] Registration successful for ${email}`);
    return { success: true, message: "Проверьте почту для подтверждения" };
  });

/**
 * Запрос на сброс пароля (Phase 2.2.3)
 */
export const requestPasswordReset = actionClient
  .schema(z.object({ email: z.string().email() }))
  .action(async ({ parsedInput: { email } }) => {
    const user = await db.user.findUnique({
      where: { email },
      select: { id: true }
    });

    if (user) {
      const token = await createEmailToken({ email, type: "reset" });
      const resetLink = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/auth/reset-password?token=${token}`;

      await logAudit({
        userId: user.id,
        action: "UPDATE",
        entity: "User",
        entityId: user.id,
        metadata: { info: "Password reset requested" },
      });

      await sendEmail({
        to: email,
        subject: "Восстановление пароля — УслугиРядом",
        html: `<p>Вы запросили сброс пароля. Перейдите по ссылке для установки нового:</p><a href="${resetLink}">${resetLink}</a>`,
      });
    }

    return { success: true };
  });

/**
 * Подтверждение Email (Phase 2.3.3)
 */
export const verifyEmailAction = actionClient
  .schema(z.object({ token: z.string() }))
  .action(async ({ parsedInput: { token } }) => {
    const payload = await verifyEmailToken(token);
    if (!payload || payload.type !== "verify") {
      throw new Error("Неверный или просроченный токен");
    }

    await db.user.update({
      where: { email: payload.email },
      // @ts-ignore
      data: { emailVerified: new Date() },
    });

    return { success: true };
  });

/**
 * Сброс пароля на новый (Phase 2.3.6)
 */
export const resetPasswordAction = actionClient
  .schema(z.object({ token: z.string(), password: z.string().min(8) }))
  .action(async ({ parsedInput: { token, password } }) => {
    const payload = await verifyEmailToken(token);
    if (!payload || payload.type !== "reset") {
      throw new Error("Неверный или просроченный токен");
    }

    const bcrypt = await import("bcryptjs");
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    await db.user.update({
      where: { email: payload.email },
      data: { passwordHash },
    });

    return { success: true };
  });
