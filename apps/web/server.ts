import "dotenv/config";
import { AsyncLocalStorage } from "node:async_hooks";
import { createServer, request, type IncomingMessage, type ServerResponse } from "node:http";
import type { Duplex } from "node:stream";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import type { ClientToServerEvents, ServerToClientEvents } from "./src/shared/lib/socket-events";

type HttpHandler = (req: IncomingMessage, res: ServerResponse) => void | Promise<void>;
type UpgradeHandler = (req: IncomingMessage, socket: Duplex, head: Buffer) => void;
type NextServer = {
  getRequestHandler: () => HttpHandler;
  getUpgradeHandler: () => UpgradeHandler;
  prepare: () => Promise<void>;
};

interface SocketBridgePayload {
  room?: string;
  event: keyof ServerToClientEvents;
  data: unknown;
}

const globals = globalThis as typeof globalThis & {
  AsyncLocalStorage?: typeof AsyncLocalStorage;
  _io?: Server<ClientToServerEvents, ServerToClientEvents>;
};

// --- POLYFILL START ---
if (typeof globals.AsyncLocalStorage === "undefined") {
  globals.AsyncLocalStorage = AsyncLocalStorage;
}
// --- POLYFILL END ---

/**
 * ARCHITECTURE: Hybrid Proxy-Bridge (STABILIZED v2)
 * Development: Prepares Next.js and handles it in the same process (standard custom server).
 * Production: Proxies traffic to Next.js standalone on port 3001 (Proxy-Bridge).
 */

async function startServer() {
  const dev = process.env.NODE_ENV !== "production";
  const hostname = "0.0.0.0";
  const PUBLIC_PORT = parseInt(process.env.PORT ?? "3000", 10);
  const NEXT_PORT = PUBLIC_PORT + 1;

  let handler: HttpHandler | undefined;
  let nextUpgradeHandler: UpgradeHandler | undefined;

  if (dev) {
    console.log(`[ANTIGRAVITY_STABLE] Running in DEVELOPMENT mode. Preparing Next.js...`);
    const { default: next } = await import("next");
    const app = next({ dev, hostname, port: PUBLIC_PORT }) as NextServer;
    handler = app.getRequestHandler();
    await app.prepare();
    nextUpgradeHandler = app.getUpgradeHandler();
    console.log(`[ANTIGRAVITY_STABLE] Next.js is READY on port ${PUBLIC_PORT}`);
  } else {
    console.log(`[ANTIGRAVITY_STABLE] Running in PRODUCTION mode. Proxying 3000 -> 3001`);
  }

  const httpServer = createServer((req, res) => {
    if (dev && handler) {
      return handler(req, res);
    }

    // 1. Skip proxying for Socket.io (handled by the io instance attached to this server)
    if (req.url?.startsWith("/socket.io")) {
      return;
    }

    // 2. Production Proxy Logic for all other requests
    const proxyReq = request({
      hostname: "localhost",
      port: NEXT_PORT,
      path: req.url,
      method: req.method,
      headers: req.headers
    }, (proxyRes) => {
      res.writeHead(proxyRes.statusCode!, proxyRes.headers);
      proxyRes.pipe(res, { end: true });
    });

    proxyReq.on('error', (err) => {
      console.error(`[ANTIGRAVITY_ERROR] Proxy connection failed to port ${NEXT_PORT}:`, err.message);
      if (!res.headersSent) {
        res.writeHead(502, { 'Content-Type': 'text/plain' });
        res.end("Bad Gateway: Next.js server is starting or unreachable.");
      }
    });

    req.pipe(proxyReq, { end: true });
  });

  // Socket.io initialization
  const io = new Server(httpServer, {
    cors: {
      origin: true, 
      credentials: true,
    },
    path: "/socket.io",
    addTrailingSlash: false,
    transports: ["websocket", "polling"]
  });

  globals._io = io;
  
  // Redis Adapter & Bridge
  try {
    const { getRedis } = await import("./src/shared/lib/redis");
    const pubClient = getRedis();
    const subClient = pubClient.duplicate();
    io.adapter(createAdapter(pubClient, subClient));
    console.log("[ANTIGRAVITY_STABLE] Redis Adapter enabled");

    const bridgeSub = pubClient.duplicate();
    await bridgeSub.subscribe("socket-bridge");
    bridgeSub.on("message", (channel, message) => {
      if (channel === "socket-bridge") {
        try {
          const { room, event, data } = JSON.parse(message) as SocketBridgePayload;
          console.log(`[Redis Bridge] [PID:${process.pid}] Relaying ${event} to room ${room || 'global'}. Payload size: ${message.length}`);
          if (room) {
            const count = io.sockets.adapter.rooms.get(room)?.size ?? 0;
            console.log(`[Redis Bridge] Room ${room} has ${count} active connections.`);
            io.to(room).emit(event, data);
          } else {
            io.emit(event, data);
          }
        } catch (error) {
          console.error("[Redis Bridge] Error:", error);
        }
      }
    });
  } catch {
    console.warn("⚠ [ANTIGRAVITY_STABLE] Redis not available, running without adapter");
  }

  // Upgrade handler for HMR (Development)
  if (dev) {
    httpServer.on("upgrade", (req, socket, head) => {
      if (req.url?.startsWith("/socket.io")) return;
      nextUpgradeHandler?.(req, socket, head);
    });
  }

  // Register handlers
  const { registerSocketHandlers } = await import("./src/shared/lib/socket-handlers");
  registerSocketHandlers(io);

  httpServer.listen(PUBLIC_PORT, hostname, () => {
    console.log(`▶ [ANTIGRAVITY_STABLE] Server listening on http://${hostname}:${PUBLIC_PORT}`);
  });
}

startServer().catch((err) => {
  console.error("⨯ [ANTIGRAVITY_STABLE] Fatal error:", err);
  process.exit(1);
});
