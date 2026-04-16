import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { validateTelegramWebAppData } from "@/shared/lib/auth";
import { db } from "@/shared/lib/db";

export default {
  providers: [
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
  ],
} satisfies NextAuthConfig;
