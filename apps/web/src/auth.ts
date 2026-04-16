import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/shared/lib/db";
import authConfig from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db as any),
  session: { strategy: "jwt" }, // NextAuth v5 + Prisma Adapter defaults to database sessions, but we can use JWT for easier middleware checks if needed.
  ...authConfig,
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        // @ts-ignore
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        // @ts-ignore
        session.user.role = token.role;
      }
      return session;
    },
  },
});
