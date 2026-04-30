import { db } from "./db";
import { auth } from "@/auth";

/**
 * Проверяет, является ли пользователь владельцем сущности или администратором.
 * Выбрасывает ошибку, если доступ запрещен.
 */
export async function assertOwnership(entity: "order" | "proposal" | "review", entityId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const userId = session.user.id;
  const isAdmin = session.user.role === "ADMIN";

  if (isAdmin) return session.user;

  let ownerId: string | undefined;

  if (entity === "order") {
    const item = await db.order.findUnique({ where: { id: entityId }, select: { clientId: true } });
    ownerId = item?.clientId;
  } else if (entity === "proposal") {
    const item = await db.proposal.findUnique({ 
        where: { id: entityId }, 
        select: { provider: { select: { userId: true } } } 
    });
    ownerId = item?.provider.userId;
  } else if (entity === "review") {
     const item = await db.review.findUnique({ where: { id: entityId }, select: { authorId: true } });
     ownerId = item?.authorId;
  }

  if (!ownerId || ownerId !== userId) {
    throw new Error("Forbidden: You do not own this resource");
  }

  return session.user;
}
