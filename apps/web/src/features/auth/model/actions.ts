"use server";

import { signIn, signOut } from "@/auth";
import { db } from "@/shared/lib/db";
import { redirect } from "next/navigation";
import { z } from "zod";
import { authService } from "@/services/auth.service";
import { actionClient, authActionClient } from "@/shared/lib/safe-action";

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
  
  redirect("/dashboard");
}

/**
 * Logout action using Auth.js
 */
export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
});

export const registerWithEmail = actionClient
  .schema(registerSchema)
  .action(async ({ parsedInput: { email, password, name } }) => {
    try {
      const names = name.split(" ");
      const firstName = names[0];
      const lastName = names.slice(1).join(" ") || "";

      await authService.register({
        email,
        password,
        firstName,
        lastName,
        authProvider: "EMAIL"
      });

      return { success: true, message: "Проверьте почту для подтверждения" };
    } catch (error: any) {
      console.error("[registerWithEmail] error:", error);
      throw error instanceof Error ? error : new Error("Ошибка при регистрации");
    }
  });

/**
 * Запрос на сброс пароля
 */
export const requestPasswordReset = actionClient
  .schema(z.object({ email: z.string().email() }))
  .action(async ({ parsedInput: { email } }) => {
    try {
      await authService.requestPasswordReset(email);
      return { success: true };
    } catch (error: any) {
      console.error("[requestPasswordReset] error:", error);
      throw error;
    }
  });

/**
 * Подтверждение Email
 */
export const verifyEmailAction = actionClient
  .schema(z.object({ token: z.string() }))
  .action(async ({ parsedInput: { token } }) => {
    try {
      await authService.verifyEmail(token);
      return { success: true };
    } catch (error: any) {
      console.error("[verifyEmailAction] error:", error);
      throw error;
    }
  });

/**
 * Сброс пароля на новый
 */
export const resetPasswordAction = actionClient
  .schema(z.object({ token: z.string(), password: z.string().min(8) }))
  .action(async ({ parsedInput: { token, password } }) => {
    try {
      await authService.resetPassword(token, password);
      return { success: true };
    } catch (error: any) {
      console.error("[resetPasswordAction] error:", error);
      throw error;
    }
  });

/**
 * Привязка email-аккаунта к Telegram-аккаунту.
 * Текущий пользователь (залогинен через Telegram, email отсутствует)
 * вводит email + пароль. Находим email-аккаунт, переносим telegramId
 * на него, удаляем Telegram-only аккаунт.
 */
export const linkEmailToAccountAction = authActionClient
  .schema(z.object({ email: z.string().email(), password: z.string().min(1) }))
  .action(async ({ parsedInput: { email, password }, ctx: { userId } }) => {
    const telegramUser = await db.user.findUnique({
      where: { id: userId },
      select: { telegramId: true, email: true },
    });

    if (!telegramUser) throw new Error("Пользователь не найден");
    if (telegramUser.email) return { success: true, message: "Email уже привязан" };
    if (!telegramUser.telegramId) throw new Error("У текущего аккаунта нет telegramId");

    const emailUser = await authService.validateCredentials(email, password);
    if (!emailUser) throw new Error("Неверный email или пароль");

    // Переносим telegramId на email-аккаунт и удаляем Telegram-only аккаунт
    await db.$transaction([
      db.user.update({
        where: { id: emailUser.id },
        data: { telegramId: telegramUser.telegramId },
      }),
      db.user.delete({ where: { id: userId } }),
    ]);

    return { success: true, linkedUserId: emailUser.id };
  });
