import { createServer } from "http";
import next from "next";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { getRedis } from "./src/shared/lib/redis";
import { registerSocketHandlers } from "./src/shared/lib/socket-handlers";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  SocketData,
} from "./src/shared/lib/socket-events";

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = parseInt(process.env.PORT ?? "3000", 10);

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handler);

  const io = new Server<ClientToServerEvents, ServerToClientEvents, object, SocketData>(
    httpServer,
    {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL ?? "*",
        credentials: true,
      },
      path: "/socket.io",
    }
  );

  const pubClient = getRedis();
  const subClient = pubClient.duplicate();
  io.adapter(createAdapter(pubClient, subClient));

  (global as Record<string, unknown>)._io = io;

  registerSocketHandlers(io);

  httpServer.listen(port, hostname, () => {
    console.log(`▶ Ready on http://${hostname}:${port}`);
  });
});
