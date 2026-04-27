import { AsyncLocalStorage } from "node:async_hooks";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";

// --- POLYFILL START ---
// Next.js 16 requires AsyncLocalStorage to be available before 'next' is imported
if (typeof (globalThis as any).AsyncLocalStorage === "undefined") {
  (globalThis as any).AsyncLocalStorage = AsyncLocalStorage;
}
// --- POLYFILL END ---

async function startServer() {
  const dev = process.env.NODE_ENV !== "production";
  const hostname = "0.0.0.0";
  const port = parseInt(process.env.PORT ?? "3000", 10);

  // Dynamic import 'next' AFTER polyfill setup
  const { default: next } = await import("next");
  const app = next({ dev, hostname, port });
  const handler = app.getRequestHandler();

  await app.prepare();

  const httpServer = createServer((req, res) => {
    if (req.url?.startsWith("/socket.io")) {
      console.log(`[Server] Incoming Socket.io request: ${req.method} ${req.url}`);
    }
    return handler(req, res);
  });

  // Socket.io initialization on the SAME port
  const io = new Server(httpServer, {
    cors: {
      origin: "*", // More permissive for local dev/proxies
      credentials: true,
    },
    path: "/socket.io",
    addTrailingSlash: false,
    transports: ["websocket", "polling"]
  });

  (global as any)._io = io;
  console.log(`[Server] Global IO instance set: ${!!(global as any)._io} (ID: ${Math.random().toString(36).substring(7)}, PID: ${process.pid})`);

  // CRITICAL: Handle the 'upgrade' event to support both Socket.io and Next.js HMR
  const nextUpgradeHandler = app.getUpgradeHandler();
  httpServer.on("upgrade", (req, socket, head) => {
    const url = req.url || "";
    if (url.startsWith("/socket.io")) {
      console.log(`[Server] WebSocket Upgrade request for Socket.io: ${url}`);
      return;
    }
    console.log(`[Server] WebSocket Upgrade request for Next.js/Other: ${url}`);
    nextUpgradeHandler(req, socket, head);
  });

  const { getRedis } = await import("./src/shared/lib/redis");
  const pubClient = getRedis();
  const subClient = pubClient.duplicate();
  io.adapter(createAdapter(pubClient, subClient));

  (global as any)._io = io;
  console.log("▶ Global Socket.io instance initialized and stored in global._io");

  const { registerSocketHandlers } = await import("./src/shared/lib/socket-handlers");
  registerSocketHandlers(io);

  // --- REDIS BRIDGE START ---
  // Allow Server Actions (in separate processes) to emit events via Redis
  const bridgeSub = pubClient.duplicate();
  await bridgeSub.subscribe("socket-bridge", (err) => {
    if (err) console.error("[Redis Bridge] Failed to subscribe:", err);
    else console.log("▶ Redis Bridge: Subscribed to 'socket-bridge' channel");
  });

  bridgeSub.on("message", (channel, message) => {
    if (channel === "socket-bridge") {
      try {
        const { room, event, data } = JSON.parse(message);
        console.log(`[Redis Bridge] Received message for room: ${room}, event: ${event}`);
        
        if (room) {
          const roomClients = io.sockets.adapter.rooms.get(room);
          console.log(`[Redis Bridge] Room ${room} has ${roomClients?.size ?? 0} active local clients`);
          io.to(room).emit(event, data);
        } else {
          console.log(`[Redis Bridge] Emitting global event: ${event}`);
          io.emit(event, data);
        }
      } catch (e) {
        console.error("[Redis Bridge] Error processing message:", e);
      }
    }
  });
  // --- REDIS BRIDGE END ---

  httpServer.listen(port, hostname, () => {
    console.log(`▶ Next.js 16 App + Socket.io Ready on http://${hostname}:${port}`);
    console.log(`▶ Socket.io with Redis Adapter enabled`);
  });

  httpServer.on("error", (err) => {
    console.error("[Server Error]:", err);
  });

  process.on("unhandledRejection", (reason, promise) => {
    console.error("[Unhandled Rejection]:", reason);
  });

  process.on("uncaughtException", (err) => {
    console.error("[Uncaught Exception]:", err);
  });
}

startServer().catch((err) => {
  console.error("⨯ Failed to start server:", err);
  process.exit(1);
});
