import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import {
  validateTelegramWebAppData,
  validateTelegramWidgetData,
  type TelegramWidgetUser,
} from "@/shared/lib/auth";
import { db } from "@/shared/lib/db";
import { authService } from "@/services/auth.service";

async function upsertTelegramUser(telegramIdStr: string, firstName: string, lastName?: string) {
  const telegramId = BigInt(telegramIdStr);
  let user = await db.user.findUnique({ where: { telegramId } });
  if (!user) {
    user = await db.user.create({
      data: { telegramId, firstName, lastName: lastName ?? "", authProvider: "TELEGRAM" },
    });
  }
  return { id: user.id, name: user.firstName, email: user.email, role: user.role };
}

export default {
  providers: [
    // Telegram Web App (Mini App — initData из window.Telegram.WebApp)
    Credentials({
      id: "telegram",
      name: "Telegram",
      credentials: {},
      async authorize(_, request) {
        const data = await request.json();
        const initData = data?.initData;
        if (!initData) return null;

        const result = validateTelegramWebAppData(initData);
        if (!result.ok) return null;

        const urlParams = new URLSearchParams(initData);
        let userRaw: { id?: number; first_name?: string; last_name?: string } = {};
        try { userRaw = JSON.parse(urlParams.get("user") || "{}"); } catch { return null; }

        const telegramId = userRaw.id?.toString();
        if (!telegramId) return null;

        return upsertTelegramUser(telegramId, userRaw.first_name ?? "User", userRaw.last_name);
      },
    }),
    // Telegram Login Widget (веб-браузер)
    Credentials({
      id: "telegram-widget",
      name: "Telegram Widget",
      credentials: {},
      async authorize(_, request) {
        const widgetUser = (await request.json()) as TelegramWidgetUser;
        const result = validateTelegramWidgetData(widgetUser);
        if (!result.ok) return null;

        return upsertTelegramUser(
          String(widgetUser.id),
          widgetUser.first_name,
          widgetUser.last_name,
        );
      },
    }),
    Credentials({
      id: "mock-admin",
      name: "Mock Admin",
      credentials: {},
      async authorize() {
        if (process.env.NODE_ENV !== "development") return null;
        
        const user = await db.user.findFirst({
           where: { role: "ADMIN" }
        });

        if (!user) return null;

        return {
          id: user.id,
          name: "Admin",
          email: user.email,
          role: "ADMIN",
        };
      }
    }),
    Credentials({
      id: "email",
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        return authService.validateCredentials(
          credentials?.email as string,
          credentials?.password as string
        );
      },
    }),
  ],
} satisfies NextAuthConfig;
