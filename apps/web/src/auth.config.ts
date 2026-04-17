import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { validateTelegramWebAppData } from "@/shared/lib/auth";
import { db } from "@/shared/lib/db";
import { authService } from "@/services/auth.service";

export default {
  providers: [
    Credentials({
      id: "telegram",
      name: "Telegram",
      credentials: {},
      async authorize(_, request) {
        const data = await request.json();
        const initData = data?.initData;
        
        if (!initData || !validateTelegramWebAppData(initData)) return null;

        const urlParams = new URLSearchParams(initData);
        const userRaw = JSON.parse(urlParams.get("user") || "{}");
        const telegramId = userRaw.id?.toString();

        if (!telegramId) return null;

        let user = await db.user.findUnique({ where: { telegramId } });

        if (!user) {
          user = await db.user.create({
            data: {
              telegramId,
              firstName: userRaw.first_name || "User",
              lastName: userRaw.last_name || "",
              authProvider: "TELEGRAM",
            },
          });
        }

        return {
          id: user.id,
          name: user.firstName,
          email: user.email,
          role: user.role,
        };
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
