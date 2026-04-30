import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/shared/lib/db";
import authConfig from "./auth.config";

type PrismaAdapterClient = Parameters<typeof PrismaAdapter>[0];

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db as PrismaAdapterClient),
  session: { strategy: "jwt" },
  trustHost: true,
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  callbacks: {
    async session({ session, token }) {
      if (token?.sub && session.user) {
        session.user.id = token.sub;
      }
      if (token?.role && session.user) {
        session.user.role = token.role;
      }
      return session;
    },
    async jwt({ token }) {
      if (!token.sub) return token;

      const user = await db.user.findUnique({
        where: { id: token.sub },
        select: { role: true }
      });

      if (user) {
        token.role = user.role;
      }
      return token;
    },
  },
});
