import type { Server, Socket } from "socket.io";
import type { ServerToClientEvents, ClientToServerEvents, SocketData } from "./socket-events";
import { db } from "./db";
import { decrypt } from "./auth";
import { decode } from "next-auth/jwt";
import { setUserOnline, setUserOffline } from "./redis";

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
    let authSource = "none";

    // 1. Try Auth.js session (Main Web/Telegram users) - Higher priority
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
          salt: authJsCookieName,
        });
        if (decoded?.sub) {
          userId = decoded.sub;
          authSource = "authjs";
        }
      } catch (e) {
        console.warn("[Socket Auth] Failed to decode Auth.js session", e);
      }
    }

    // 2. Try custom session (Admin panel/Legacy mobile) - Fallback
    if (!userId) {
      const customToken = cookies["session"];
      if (customToken) {
        try {
          const payload = await decrypt(customToken);
          if (payload?.userId) {
            userId = payload.userId;
            authSource = "custom";
          }
        } catch (e) {
          console.warn("[Socket Auth] Failed to decrypt custom session", e);
        }
      }
    }

    if (!userId) {
      console.warn("[Socket Auth] No valid session found in cookies:", Object.keys(cookies));
      return null;
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, firstName: true },
    });

    if (user) {
      console.log(`[Socket Auth] Authenticated user ${user.firstName} (${userId}) via ${authSource}`);
    } else {
      console.warn(`[Socket Auth] User ${userId} found in session but not in database`);
    }

    return user;
  } catch (err) {
    console.error("[Socket Auth] Unexpected error:", err);
    return null;
  }
}

/**
 * Рассылает статус пользователя всем, с кем у него есть общие чаты.
 */
async function broadcastUserStatus(
  io: Server,
  userId: string,
  status: "online" | "offline",
  lastSeenAt: Date
) {
  try {
    // Находим всех участников всех чатов, где состоит данный пользователь
    const conversations = await db.conversation.findMany({
      where: {
        participants: {
          some: { userId }
        }
      },
      select: {
        participants: {
          where: {
            userId: { not: userId }
          },
          select: { userId: true }
        }
      }
    });

    const otherUserIds = new Set<string>();
    conversations.forEach(conv => {
      conv.participants.forEach(p => otherUserIds.add(p.userId));
    });

    console.log(`[Socket Status] Broadcasting ${status} for ${userId} to ${otherUserIds.size} users`);

    otherUserIds.forEach(targetId => {
      io.to(`user:${targetId}`).emit("user:status", {
        userId,
        status,
        lastSeenAt: lastSeenAt.toISOString()
      });
    });
  } catch (err) {
    console.error("[Socket Status] Broadcast error:", err);
  }
}

export function registerSocketHandlers(
  io: Server<ClientToServerEvents, ServerToClientEvents, object, SocketData>
) {
  io.use(async (socket: Socket<ClientToServerEvents, ServerToClientEvents, object, SocketData>, next: (err?: Error) => void) => {
    const cookieHeader = socket.handshake.headers.cookie ?? "";
    const cookieNames = cookieHeader.split(";").map((c: string) => c.trim().split("=")[0]);
    console.log(`[Socket Auth] Handshake cookies:`, cookieNames);

    const user = await getUserFromCookie(cookieHeader);
    if (!user) return next(new Error("Unauthorized"));
    socket.data.userId = user.id;
    socket.data.userName = user.firstName;
    next();
  });

  io.on("connection", async (socket: Socket<ClientToServerEvents, ServerToClientEvents, object, SocketData>) => {
    const { userId, userName } = socket.data;
    console.log(`[Socket] User connected: ${userName} (${userId}). Socket ID: ${socket.id}`);

    // Устанавливаем статус ONLINE
    const now = new Date();
    await setUserOnline(userId);
    await db.user.update({
      where: { id: userId },
      data: { lastSeenAt: now }
    });
    
    // Уведомляем других
    broadcastUserStatus(io, userId, "online", now);

    // Логируем ВСЕ входящие события для дебага
    socket.onAny((eventName: string, ...args: unknown[]) => {
      console.log(`[Socket Debug] Incoming Event: ${eventName}`, args);
    });

    socket.join(`user:${userId}`);

    socket.on("join:conversation", async (conversationId: string) => {
      // B5: Validate UUID to prevent Prisma internal errors
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(conversationId)) {
        console.warn(`[Socket] Invalid UUID format: ${conversationId}`);
        return;
      }

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

    socket.on("leave:conversation", (conversationId: string) => {
      socket.leave(`conv:${conversationId}`);
      console.log(`[Socket] User ${userName} left room conv:${conversationId}`);
    });

    socket.on("disconnect", async (reason: string) => {
      console.log(`[Socket] User disconnected: ${userName} (${userId}). Reason: ${reason}`);
      
      // Небольшая задержка, чтобы не спамить при перезагрузке страницы
      setTimeout(async () => {
        // Проверяем, не переподключился ли пользователь (в другом окне/вкладке)
        const sockets = await io.in(`user:${userId}`).fetchSockets();
        if (sockets.length === 0) {
          const lastSeen = new Date();
          await setUserOffline(userId);
          await db.user.update({
            where: { id: userId },
            data: { lastSeenAt: lastSeen }
          });
          broadcastUserStatus(io, userId, "offline", lastSeen);
        }
      }, 3000);
    });

    socket.on("typing:start", async (conversationId: string) => {
      // B4: Check participant before broadcasting
      const isParticipant = await db.conversationParticipant.findFirst({
        where: { conversationId, userId },
      });
      if (!isParticipant) return;

      console.log(`[Socket Typing] Start from ${userName} in ${conversationId}`);
      socket.to(`conv:${conversationId}`).emit("typing:start", {
        conversationId,
        userId,
        userName,
      });
    });

    socket.on("typing:stop", async (conversationId: string) => {
      // B4: Check participant before broadcasting
      const isParticipant = await db.conversationParticipant.findFirst({
        where: { conversationId, userId },
      });
      if (!isParticipant) return;

      console.log(`[Socket Typing] Stop from ${userName} in ${conversationId}`);
      socket.to(`conv:${conversationId}`).emit("typing:stop", {
        conversationId,
        userId,
      });
    });
  });
}
