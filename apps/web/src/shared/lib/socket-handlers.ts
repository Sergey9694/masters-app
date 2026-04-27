import type { Server } from "socket.io";
import type { ServerToClientEvents, ClientToServerEvents, SocketData } from "./socket-events";
import { db } from "./db";
import { decrypt } from "./auth";
import { decode } from "next-auth/jwt";

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

    let userId: string | null = null;

    // 1. Check custom session (Admin/Mobile)
    const customToken = cookies["session"];
    if (customToken) {
      try {
        const payload = await decrypt(customToken);
        userId = payload.userId;
      } catch (e) {
        console.warn("[Socket Auth] Failed to decrypt custom session", e);
      }
    }

    // 2. Check Auth.js session (Web/Telegram)
    if (!userId) {
      const authJsCookieName = 
        cookies["authjs.session-token"] ? "authjs.session-token" :
        cookies["__Secure-authjs.session-token"] ? "__Secure-authjs.session-token" :
        cookies["next-auth.session-token"] ? "next-auth.session-token" :
        cookies["__Secure-next-auth.session-token"] ? "__Secure-next-auth.session-token" : 
        null;

      if (authJsCookieName) {
        try {
          const decoded = await decode({
            token: cookies[authJsCookieName],
            secret: process.env.AUTH_SECRET || "",
            salt: authJsCookieName, // Auth.js v5 requires salt, which defaults to cookie name
          });
          userId = decoded?.sub || null;
        } catch (e) {
          console.warn("[Socket Auth] Failed to decode Auth.js session", e);
        }
      }
    }

    if (!userId) return null;

    const user = await db.user.findUnique({
      where: { id: userId },
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
    const cookieNames = cookieHeader.split(";").map(c => c.trim().split("=")[0]);
    console.log(`[Socket Auth] Handshake cookies:`, cookieNames);

    const user = await getUserFromCookie(cookieHeader);
    if (!user) return next(new Error("Unauthorized"));
    socket.data.userId = user.id;
    socket.data.userName = user.firstName;
    next();
  });

  io.on("connection", (socket) => {
    const { userId, userName } = socket.data;
    console.log(`[Socket] User connected: ${userName} (${userId}). Socket ID: ${socket.id}`);

    // Логируем ВСЕ входящие события для дебага
    socket.onAny((eventName, ...args) => {
      console.log(`[Socket Debug] Incoming Event: ${eventName}`, args);
    });

    socket.join(`user:${userId}`);

    socket.on("join:conversation", async (conversationId) => {
      console.log(`[Socket Debug] User ${userName} (${userId}) attempting to join room: ${conversationId}`);
      
      // Получаем роль пользователя из базы (или можно было сохранить в socket.data)
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      const isParticipant = await db.conversationParticipant.findFirst({
        where: { conversationId, userId },
      });

      if (isParticipant || user?.role === "ADMIN") {
        socket.join(`conv:${conversationId}`);
        console.log(`[Socket] User ${userName} successfully joined room conv:${conversationId} ${user?.role === "ADMIN" ? "(as ADMIN)" : ""}`);
      } else {
        console.warn(`[Socket] User ${userName} DENIED room conv:${conversationId}. Participant check failed.`);
      }
    });

    socket.on("leave:conversation", (conversationId) => {
      socket.leave(`conv:${conversationId}`);
      console.log(`[Socket] User ${userName} left room conv:${conversationId}`);
    });

    socket.on("disconnect", (reason) => {
      console.log(`[Socket] User disconnected: ${userName} (${userId}). Reason: ${reason}`);
    });

    socket.on("typing:start", (conversationId) => {
      console.log(`[Socket Typing] Start from ${userName} in ${conversationId}`);
      socket.to(`conv:${conversationId}`).emit("typing:start", {
        conversationId,
        userId,
        userName,
      });
    });

    socket.on("typing:stop", (conversationId) => {
      console.log(`[Socket Typing] Stop from ${userName} in ${conversationId}`);
      socket.to(`conv:${conversationId}`).emit("typing:stop", {
        conversationId,
        userId,
      });
    });
  });
}
