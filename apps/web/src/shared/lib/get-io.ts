import { Server } from "socket.io";
import type { ServerToClientEvents, ClientToServerEvents } from "./socket-events";
import type { DefaultEventsMap } from "socket.io";

declare global {
  var _io: Server<ClientToServerEvents, ServerToClientEvents, DefaultEventsMap, unknown> | undefined;
}

export function getIO(): Server<ClientToServerEvents, ServerToClientEvents> | null {
  const io = global._io;
  console.log(`[getIO] Accessing global._io. Status: ${!!io}. PID: ${process.pid}. Global keys: ${Object.keys(global).filter(k => k.startsWith('_'))}`);
  return io ?? null;
}
