/**
 * Client-side per-user quota enforcement (daily counters in localStorage)
 * Premium users get higher limits
 */

const LIMITS = {
  free:    { recipes_per_day: 3,  menu_discoveries_per_day: 5,  photo_uploads_per_day: 2  },
  premium: { recipes_per_day: 50, menu_discoveries_per_day: 20, photo_uploads_per_day: 10 },
};

function quotaKey(email, action) {
  return `bf_quota_${email}_${action}_${new Date().toDateString()}`;
}

export const Quota = {
  async check(action, userEmail, isPremium = false) {
    const tier    = isPremium ? "premium" : "free";
    const limit   = LIMITS[tier][action] ?? Infinity;
    const current = parseInt(localStorage.getItem(quotaKey(userEmail, action)) || "0");
    return {
      allowed:   current < limit,
      current,
      limit,
      remaining: Math.max(0, limit - current),
      tier,
    };
  },

  increment(action, userEmail) {
    const key     = quotaKey(userEmail, action);
    const current = parseInt(localStorage.getItem(key) || "0");
    localStorage.setItem(key, String(current + 1));
  },

  async checkAndConsume(action, userEmail, isPremium = false) {
    const result = await this.check(action, userEmail, isPremium);
    if (result.allowed) this.increment(action, userEmail);
    return result;
  },

  ACTIONS: {
    RECIPE_GENERATION: "recipes_per_day",
    MENU_DISCOVERY:    "menu_discoveries_per_day",
    PHOTO_UPLOAD:      "photo_uploads_per_day",
  },
};