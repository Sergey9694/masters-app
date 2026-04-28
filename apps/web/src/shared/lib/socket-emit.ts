import { getRedis } from "./redis";
import { getIO } from "./get-io";
import type { ServerToClientEvents } from "./socket-events";

/**
 * Универсальная функция для отправки событий в Socket.io.
 * Если доступен прямой инстанс (один процесс), шлет напрямую.
 * Если нет (разные процессы, Server Actions), шлет через Redis Bridge.
 */
export async function emitToSocket({
  room,
  event,
  data
}: {
  room?: string;
  event: string;
  data: unknown;
}) {
  const io = getIO();
  
  if (io) {
    console.log(`[SocketEmit] Using Direct IO to room ${room}: ${event}`);
    if (room) {
      io.to(room).emit(event as keyof ServerToClientEvents, data as never);
    } else {
      io.emit(event as keyof ServerToClientEvents, data as never);
    }
    return true;
  }

  // Fallback to Redis Bridge
  try {
    const redis = getRedis();
    console.log(`[SocketEmit] Using Redis Bridge to room ${room}: ${event}`);
    await redis.publish("socket-bridge", JSON.stringify({ room, event, data }));
    return true;
  } catch (err) {
    console.error("[SocketEmit] Failed to emit via Redis Bridge:", err);
    return false;
  }
}
