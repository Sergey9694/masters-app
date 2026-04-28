import { AsyncLocalStorage } from "node:async_hooks";
import { createServer, request } from "node:http";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";

// --- POLYFILL START ---
if (typeof (globalThis as any).AsyncLocalStorage === "undefined") {
  (globalThis as any).AsyncLocalStorage = AsyncLocalStorage;
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

  let handler: any;
  let nextUpgradeHandler: any;

  if (dev) {
    console.log(`[ANTIGRAVITY_STABLE] Running in DEVELOPMENT mode. Preparing Next.js...`);
    const { default: next } = await import("next");
    const app = next({ dev, hostname, port: PUBLIC_PORT });
    handler = app.getRequestHandler();
    await app.prepare();
    nextUpgradeHandler = app.getUpgradeHandler();
    console.log(`[ANTIGRAVITY_STABLE] Next.js is READY on port ${PUBLIC_PORT}`);
  } else {
    console.log(`[ANTIGRAVITY_STABLE] Running in PRODUCTION mode. Proxying 3000 -> 3001`);
  }

  const httpServer = createServer((req, res) => {
    if (dev) {
      return handler(req, res);
    }

    // Production Proxy Logic
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

  (global as any)._io = io;
  
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
          const { room, event, data } = JSON.parse(message);
          if (room) io.to(room).emit(event, data);
          else io.emit(event, data);
        } catch (e) {
          console.error("[Redis Bridge] Error:", e);
        }
      }
    });
  } catch (e) {
    console.warn("⚠ [ANTIGRAVITY_STABLE] Redis not available, running without adapter");
  }

  // Upgrade handler for HMR (Development)
  if (dev) {
    httpServer.on("upgrade", (req, socket, head) => {
      if (req.url?.startsWith("/socket.io")) return;
      nextUpgradeHandler(req, socket, head);
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
