import type { Server } from "socket.io";
import type { ServerToClientEvents, ClientToServerEvents } from "./socket-events";

export function getIO(): Server<ClientToServerEvents, ServerToClientEvents> | null {
  const io = (global as any)._io;
  console.log(`[getIO] Accessing global._io. Status: ${!!io}. PID: ${process.pid}. Global keys: ${Object.keys(global).filter(k => k.startsWith('_'))}`);
  return io ?? null;
}
