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
 * ARCHITECTURE: Proxy-Bridge
 * This server listens on the PUBLIC_PORT (3000) and:
 * 1. Handles Socket.io traffic locally.
 * 2. Proxies all other HTTP traffic to the Next.js standalone server on NEXT_PORT (3001).
 * 
 * This avoids any dependency conflicts between Next.js standalone and custom server logic.
 */

async function startServer() {
  const dev = process.env.NODE_ENV !== "production";
  const hostname = "0.0.0.0";
  const PUBLIC_PORT = parseInt(process.env.PORT ?? "3000", 10);
  const NEXT_PORT = PUBLIC_PORT + 1; // Usually 3001

  console.log(`[Proxy] Initializing Proxy-Bridge on port ${PUBLIC_PORT} -> ${NEXT_PORT}`);

  const httpServer = createServer((req, res) => {
    // 1. Simple HTTP Proxy to Next.js
    const proxyReq = request({
      hostname: "localhost",
      port: NEXT_PORT,
      path: req.url,
      method: req.method,
      headers: req.headers
    }, (proxyRes) => {
      // Forward status and headers
      res.writeHead(proxyRes.statusCode!, proxyRes.headers);
      // Pipe the body
      proxyRes.pipe(res, { end: true });
    });

    proxyReq.on('error', (err) => {
      console.error(`[Proxy Error] Failed to reach Next.js on port ${NEXT_PORT}:`, err.message);
      if (!res.headersSent) {
        res.writeHead(502, { 'Content-Type': 'text/plain' });
        res.end("Bad Gateway: Next.js server is starting or unreachable.");
      }
    });

    // Pipe the incoming request body to the proxy request
    req.pipe(proxyReq, { end: true });
  });

  // 2. Socket.io initialization
  const io = new Server(httpServer, {
    cors: {
      origin: true, 
      credentials: true,
    },
    path: "/socket.io",
    addTrailingSlash: false,
    transports: ["websocket", "polling"]
  });

  // Global access for internal modules
  (global as any)._io = io;
  
  // Redis Adapter setup
  try {
    const { getRedis } = await import("./src/shared/lib/redis");
    const pubClient = getRedis();
    const subClient = pubClient.duplicate();
    io.adapter(createAdapter(pubClient, subClient));
    console.log("▶ [Proxy] Socket.io Redis Adapter enabled");

    // Redis Bridge for Server Actions
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
    console.warn("⚠ [Proxy] Redis not available, running without Redis adapter");
  }

  // Register handlers
  const { registerSocketHandlers } = await import("./src/shared/lib/socket-handlers");
  registerSocketHandlers(io);

  httpServer.listen(PUBLIC_PORT, hostname, () => {
    console.log(`▶ [Proxy] Public Gateway Ready: http://${hostname}:${PUBLIC_PORT}`);
    console.log(`▶ [Proxy] Forwarding traffic to Next.js on port ${NEXT_PORT}`);
  });

  // Handle process signals
  process.on("SIGTERM", () => {
    console.log("SIGTERM received, shutting down Proxy-Bridge...");
    httpServer.close();
    process.exit(0);
  });
}

startServer().catch((err) => {
  console.error("⨯ [Proxy] Fatal startup error:", err);
  process.exit(1);
});
