import type { Server } from "socket.io";
import type { ServerToClientEvents, ClientToServerEvents, SocketData } from "./socket-events";
import { db } from "./db";
import { decrypt } from "./auth";

/**
 * Извлекает пользователя из cookie-заголовка.
 * Использует собственную JWT-реализацию проекта (jose, cookie «session»).
 */
async function getUserFromCookie(
  cookieHeader: string
): Promise<{ id: string; firstName: string } | null> {
  try {
    const cookies = Object.fromEntries(
      cookieHeader.split(";").map((c) => {
        const [k, ...v] = c.trim().split("=");
        return [k.trim(), decodeURIComponent(v.join("="))];
      })
    );

    const token = cookies["session"];
    if (!token) return null;

    const payload = await decrypt(token);
    if (!payload?.userId) return null;

    const user = await db.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, firstName: true },
    });
    return user;
  } catch {
    return null;
  }
}

export function registerSocketHandlers(
  io: Server<ClientToServerEvents, ServerToClientEvents, object, SocketData>
) {
  io.use(async (socket, next) => {
    const cookieHeader = socket.handshake.headers.cookie ?? "";
    const user = await getUserFromCookie(cookieHeader);
    if (!user) return next(new Error("Unauthorized"));
    socket.data.userId = user.id;
    socket.data.userName = user.firstName;
    next();
  });

  io.on("connection", (socket) => {
    const { userId, userName } = socket.data;

    socket.join(`user:${userId}`);

    socket.on("join:conversation", async (conversationId) => {
      const participant = await db.conversationParticipant.findFirst({
        where: { conversationId, userId },
      });
      if (participant) socket.join(`conv:${conversationId}`);
    });

    socket.on("leave:conversation", (conversationId) => {
      socket.leave(`conv:${conversationId}`);
    });

    socket.on("typing:start", (conversationId) => {
      socket.to(`conv:${conversationId}`).emit("typing:start", {
        conversationId,
        userId,
        userName,
      });
    });

    socket.on("typing:stop", (conversationId) => {
      socket.to(`conv:${conversationId}`).emit("typing:stop", {
        conversationId,
        userId,
      });
    });
  });
}
