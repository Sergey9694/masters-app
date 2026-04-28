import Redis from "ioredis";

declare global {
  // eslint-disable-next-line no-var
  var _redis: Redis | undefined;
}

export function getRedis(): Redis {
  if (!global._redis) {
    global._redis = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379");
    global._redis.on("error", (e) => console.error("[REDIS]", e.message));
  }
  return global._redis;
}

const STATUS_PREFIX = "user:status:";

/**
 * Устанавливает статус пользователя 'online' с временем жизни (TTL) 2 минуты.
 * Используем TTL как предохранитель, если disconnect не сработает.
 */
export async function setUserOnline(userId: string) {
  const redis = getRedis();
  await redis.set(`${STATUS_PREFIX}${userId}`, "online", "EX", 120);
}

export async function setUserOffline(userId: string) {
  const redis = getRedis();
  await redis.del(`${STATUS_PREFIX}${userId}`);
}

export async function isUserOnline(userId: string): Promise<boolean> {
  const redis = getRedis();
  const status = await redis.get(`${STATUS_PREFIX}${userId}`);
  return status === "online";
}
