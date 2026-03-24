const LIMITS = Object.freeze({
  free: {
    recipes_per_day: 3,
    menu_discoveries_per_day: 5,
    photo_uploads_per_day: 2,
  },
  premium: {
    recipes_per_day: 50,
    menu_discoveries_per_day: 20,
    photo_uploads_per_day: 10,
  },
});

const STORAGE_PREFIX = "bf_quota";

function canUseStorage() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeEmail(email) {
  return String(email || "anonymous").trim().toLowerCase();
}

function quotaKey(email, action) {
  return `${STORAGE_PREFIX}:${normalizeEmail(email)}:${action}:${getTodayKey()}`;
}

function readCount(key) {
  if (!canUseStorage()) return 0;

  try {
    const raw = localStorage.getItem(key);
    const count = Number(raw || 0);
    return Number.isFinite(count) ? count : 0;
  } catch {
    return 0;
  }
}

function writeCount(key, value) {
  if (!canUseStorage()) return;

  try {
    localStorage.setItem(key, String(value));
  } catch {
    // ignore storage errors
  }
}

export const Quota = {
  ACTIONS: Object.freeze({
    RECIPE_GENERATION: "recipes_per_day",
    MENU_DISCOVERY: "menu_discoveries_per_day",
    PHOTO_UPLOAD: "photo_uploads_per_day",
  }),

  getTier(isPremium = false) {
    return isPremium ? "premium" : "free";
  },

  getLimit(action, isPremium = false) {
    const tier = this.getTier(isPremium);
    return LIMITS[tier]?.[action] ?? Infinity;
  },

  async check(action, userEmail, isPremium = false) {
    const key = quotaKey(userEmail, action);
    const current = readCount(key);
    const limit = this.getLimit(action, isPremium);
    const allowed = current < limit;

    return {
      allowed,
      current,
      limit,
      remaining: Math.max(0, limit - current),
      tier: this.getTier(isPremium),
      action,
    };
  },

  increment(action, userEmail) {
    const key = quotaKey(userEmail, action);
    const current = readCount(key);
    writeCount(key, current + 1);

    return current + 1;
  },

  async checkAndConsume(action, userEmail, isPremium = false) {
    const result = await this.check(action, userEmail, isPremium);

    if (result.allowed) {
      const updated = this.increment(action, userEmail);
      return {
        ...result,
        current: updated,
        remaining: Math.max(0, result.limit - updated),
      };
    }

    return result;
  },

  reset(action, userEmail) {
    const key = quotaKey(userEmail, action);
    writeCount(key, 0);
  },
};