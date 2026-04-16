import { createSafeActionClient } from "next-safe-action";
import { auth } from "@/auth";

/**
 * Базовый клиент для публичных действий (доступен всем)
 */
export const actionClient = createSafeActionClient({
  handleServerError(e) {
    console.error("Action error:", e.message);
    return "Something went wrong, please try again.";
  },
});

/**
 * Клиент для аутентифицированных действий
 */
export const authActionClient = actionClient.use(async ({ next }) => {
  const session = await auth();

  if (!session || !session.user) {
    throw new Error("Session not found!");
  }

  return next({
    ctx: {
      userId: session.user.id,
      // @ts-ignore
      role: session.user.role,
    },
  });
});

/**
 * Клиент только для администраторов
 */
export const adminActionClient = authActionClient.use(async ({ next, ctx }) => {
  if (ctx.role !== "ADMIN") {
    throw new Error("Unauthorized: Admin access required");
  }

  return next({ ctx });
});
