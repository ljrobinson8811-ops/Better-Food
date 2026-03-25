/**
 * Client-side rate limiting
 * Uses a sliding-window counter stored in memory (resets on refresh)
 * Tiers: anonymous < authenticated < premium
 */

const WINDOWS = new Map(); // key → [timestamp, ...]

export const RATE_LIMITS = {
  anonymous:     { requests: 30,  windowMs: 60_000 },  // 30/min
  authenticated: { requests: 120, windowMs: 60_000 },  // 120/min
  premium:       { requests: 500, windowMs: 60_000 },  // 500/min
};

export const RateLimit = {
  /**
   * Check and consume a rate-limit slot
   * @param {string} key        - unique identifier (e.g. "user_123_recipe_gen")
   * @param {'anonymous'|'authenticated'|'premium'} tier
   * @returns {{ allowed: boolean, remaining: number, resetInMs: number }}
   */
  check(key, tier = "authenticated") {
    const cfg  = RATE_LIMITS[tier] ?? RATE_LIMITS.authenticated;
    const now  = Date.now();
    const hits = (WINDOWS.get(key) ?? []).filter(t => now - t < cfg.windowMs);

    if (hits.length >= cfg.requests) {
      const oldest   = Math.min(...hits);
      const resetInMs = cfg.windowMs - (now - oldest);
      return {
        allowed:   false,
        remaining: 0,
        resetInMs,
        error: {
          code:    "RATE_LIMIT_EXCEEDED",
          message: `Too many requests. Try again in ${Math.ceil(resetInMs / 1000)}s.`,
          tier,
        },
      };
    }

    hits.push(now);
    WINDOWS.set(key, hits);
    return { allowed: true, remaining: cfg.requests - hits.length, resetInMs: 0 };
  },
};