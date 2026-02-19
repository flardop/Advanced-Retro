type RateLimitConfig = {
  key: string;
  maxRequests: number;
  windowMs: number;
};

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

type CounterState = {
  count: number;
  resetAt: number;
};

declare global {
  // eslint-disable-next-line no-var
  var __ADVANCED_RETRO_RATE_LIMITS__: Map<string, CounterState> | undefined;
}

function getStore(): Map<string, CounterState> {
  if (!globalThis.__ADVANCED_RETRO_RATE_LIMITS__) {
    globalThis.__ADVANCED_RETRO_RATE_LIMITS__ = new Map<string, CounterState>();
  }
  return globalThis.__ADVANCED_RETRO_RATE_LIMITS__;
}

export function checkRateLimit(config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const maxRequests = Math.max(1, Math.floor(config.maxRequests));
  const windowMs = Math.max(1000, Math.floor(config.windowMs));
  const key = String(config.key || '').trim();

  if (!key) {
    return {
      allowed: true,
      remaining: maxRequests,
      resetAt: now + windowMs,
    };
  }

  const store = getStore();
  const current = store.get(key);

  if (!current || current.resetAt <= now) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: Math.max(0, maxRequests - 1),
      resetAt,
    };
  }

  current.count += 1;
  store.set(key, current);

  const allowed = current.count <= maxRequests;
  return {
    allowed,
    remaining: Math.max(0, maxRequests - current.count),
    resetAt: current.resetAt,
  };
}
