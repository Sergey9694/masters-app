import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { validateTelegramWebAppData } from "@/shared/lib/auth";
import { db } from "@/shared/lib/db";

export default {
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    Credentials({
      id: "telegram",
      name: "Telegram",
      credentials: {
        initData: { label: "Init Data", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.initData) return null;

        const validation = validateTelegramWebAppData(credentials.initData as string);
        if (!validation.ok) return null;

        const urlParams = new URLSearchParams(credentials.initData as string);
        const userDataStr = urlParams.get("user");
        if (!userDataStr) return null;

        const telegramUser = JSON.parse(userDataStr);
        const telegramId = BigInt(telegramUser.id);

        let user = await db.user.findFirst({
          where: { telegramId }
        });

        if (!user) {
          user = await db.user.create({
            data: {
              telegramId: telegramId,
              firstName: telegramUser.first_name,
              lastName: telegramUser.last_name || "",
              avatar: telegramUser.photo_url || null,
              authProvider: "TELEGRAM",
            },
          });
        }

        return {
          id: user.id,
          name: `${user.firstName} ${user.lastName || ""}`.trim(),
          email: user.email,
          image: user.avatar,
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
          name: user.firstName,
          email: user.email,
          role: user.role,
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
        if (!credentials?.email || !credentials?.password) return null;

        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.passwordHash) return null;

        const bcrypt = await import("bcryptjs");
        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!isValid) return null;

        return {
          id: user.id,
          name: user.firstName,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
} satisfies NextAuthConfig;
