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
