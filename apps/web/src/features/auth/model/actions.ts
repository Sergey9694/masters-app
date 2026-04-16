"use server";

import { signIn, signOut } from "@/auth";
import { db } from "@/shared/lib/db";
import { redirect } from "next/navigation";
import { z } from "zod";

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
