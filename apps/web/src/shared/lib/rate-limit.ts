/**
 * Простой in-memory rate-limiter для Server Actions.
 * Ключ — обычно userId или telegramId. Не переживает рестарт процесса,
 * но для MVP достаточно. В проде заменить на Redis (INCR + EXPIRE).
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// Singleton store to survive HMR in development
const globalForRateLimit = global as unknown as { rateLimitStore: Map<string, RateLimitEntry> };
const store = globalForRateLimit.rateLimitStore || new Map<string, RateLimitEntry>();

if (process.env.NODE_ENV !== "production") {
  globalForRateLimit.rateLimitStore = store;
}

// Очистка протухших записей раз в 5 минут
if (!(global as any)._rateLimitInterval) {
  (global as any)._rateLimitInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (entry.resetAt < now) store.delete(key);
    }
  }, 5 * 60 * 1000);
}

interface RateLimitOptions {
  /** Ключ лимита (namespace:userId). */
  key: string;
  /** Макс. запросов за окно. Default 10. */
  limit?: number;
  /** Длина окна в секундах. Default 60. */
  windowSec?: number;
  /** Если true, не увеличивает счетчик. */
  peek?: boolean;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSec: number;
}

export function checkRateLimit({
  key,
  limit = 10,
  windowSec = 60,
  peek = false,
}: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    if (!peek) {
      store.set(key, { count: 1, resetAt: now + windowSec * 1000 });
    }
    return { allowed: true, remaining: limit - 1, retryAfterSec: 0 };
  }

  if (entry.count >= limit) {
    const retryAfterSec = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, remaining: 0, retryAfterSec };
  }

  if (!peek) {
    entry.count++;
  }
  
  return { allowed: true, remaining: limit - entry.count, retryAfterSec: 0 };
}

export function getRateLimitInfo(options: RateLimitOptions): RateLimitResult {
  return checkRateLimit({ ...options, peek: true });
}
