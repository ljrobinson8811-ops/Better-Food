const WINDOWS = new Map();

export const RATE_LIMITS = Object.freeze({
  anonymous: { requests: 30, windowMs: 60_000 },
  authenticated: { requests: 120, windowMs: 60_000 },
  premium: { requests: 500, windowMs: 60_000 },
});

function getConfig(tier) {
  return RATE_LIMITS[tier] ?? RATE_LIMITS.authenticated;
}

function pruneHits(hits, windowMs, now) {
  return hits.filter((timestamp) => now - timestamp < windowMs);
}

export const RateLimit = {
  check(key, tier = "authenticated") {
    const now = Date.now();
    const config = getConfig(tier);
    const existingHits = WINDOWS.get(key) ?? [];
    const hits = pruneHits(existingHits, config.windowMs, now);

    if (hits.length >= config.requests) {
      const oldest = Math.min(...hits);
      const resetInMs = Math.max(0, config.windowMs - (now - oldest));

      WINDOWS.set(key, hits);

      return {
        allowed: false,
        remaining: 0,
        resetInMs,
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: `Too many requests. Try again in ${Math.ceil(
            resetInMs / 1000
          )}s.`,
          tier,
        },
      };
    }

    hits.push(now);
    WINDOWS.set(key, hits);

    return {
      allowed: true,
      remaining: Math.max(0, config.requests - hits.length),
      resetInMs: 0,
    };
  },

  clear(key) {
    WINDOWS.delete(key);
  },

  clearAll() {
    WINDOWS.clear();
  },
};