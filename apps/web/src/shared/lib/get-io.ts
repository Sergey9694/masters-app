import type { Server } from "socket.io";
import type { ServerToClientEvents, ClientToServerEvents } from "./socket-events";

export function getIO(): Server<ClientToServerEvents, ServerToClientEvents> | null {
  return (
    ((global as Record<string, unknown>)._io as Server<
      ClientToServerEvents,
      ServerToClientEvents
    >) ?? null
  );
}
