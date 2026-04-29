import { getRedis } from "./redis";

/**
 * Распределенный Rate Limiter на базе Redis.
 * Использует INCR + PTTL для атомарности.
 * Заменяет старый in-memory Map для работы в кластере/Docker.
 */

interface RateLimitOptions {
  /** Ключ лимита (namespace:userId). */
  key: string;
  /** Макс. запросов за окно. Default 10. */
  limit?: number;
  /** Длина окна в секундах. Default 60. */
  windowSec?: number;
}

interface RateLimitResult {
  allowed: boolean;
  count: number;
  retryAfterSec: number;
}

export async function checkRateLimit({
  key,
  limit = 10,
  windowSec = 60,
}: RateLimitOptions): Promise<RateLimitResult> {
  const redis = getRedis();
  const redisKey = `rl:${key}`;

  try {
    const current = await redis.incr(redisKey);
    
    if (current === 1) {
      await redis.expire(redisKey, windowSec);
    }

    if (current > limit) {
      const ttlMs = await redis.pttl(redisKey);
      return { 
        allowed: false, 
        count: current, 
        retryAfterSec: Math.max(0, Math.ceil(ttlMs / 1000)) 
      };
    }

    return { 
      allowed: true, 
      count: current, 
      retryAfterSec: 0 
    };
  } catch (error) {
    console.error("[RATE-LIMIT] Redis error, allowing request as fallback:", error);
    // Fail-open strategy: if Redis is down, we allow the request but log the error
    return { allowed: true, count: 0, retryAfterSec: 0 };
  }
}

/**
 * Алиас для обратной совместимости с существующим кодом.
 * ВАЖНО: Теперь это асинхронная функция.
 */
export const getRateLimitInfo = checkRateLimit;
