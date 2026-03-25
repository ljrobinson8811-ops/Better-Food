/**
 * TTL-based dual-layer cache (memory + localStorage)
 * Invalidation rules: daily for menus/nutrition/price, 7d for recipes
 */

const MEM = new Map();
const PREFIX = "bf_";

export const TTL = {
  MENU:       24 * 60 * 60 * 1000,
  RECIPE:      7 * 24 * 60 * 60 * 1000,
  NUTRITION:  24 * 60 * 60 * 1000,
  PRICE:      24 * 60 * 60 * 1000,
  RESTAURANT:  6 * 60 * 60 * 1000,
  SHORT:       5 * 60 * 1000,
};

export const Cache = {
  set(key, value, ttlMs = TTL.MENU) {
    const expiry = Date.now() + ttlMs;
    MEM.set(key, { value, expiry });
    try { localStorage.setItem(PREFIX + key, JSON.stringify({ value, expiry })); } catch {}
  },

  get(key) {
    let entry = MEM.get(key);
    if (!entry) {
      try {
        const raw = localStorage.getItem(PREFIX + key);
        if (raw) { entry = JSON.parse(raw); MEM.set(key, entry); }
      } catch {}
    }
    if (!entry) return null;
    if (Date.now() > entry.expiry) { this.invalidate(key); return null; }
    return entry.value;
  },

  invalidate(key) {
    MEM.delete(key);
    try { localStorage.removeItem(PREFIX + key); } catch {}
  },

  invalidatePrefix(prefix) {
    for (const k of MEM.keys()) if (k.startsWith(prefix)) this.invalidate(k);
    try {
      Object.keys(localStorage)
        .filter(k => k.startsWith(PREFIX + prefix))
        .forEach(k => localStorage.removeItem(k));
    } catch {}
  },

  keys: {
    menu:       (restaurantId) => `menu_${restaurantId}`,
    recipe:     (menuItemId)   => `recipe_${menuItemId}`,
    nutrition:  (menuItemId)   => `nutrition_${menuItemId}`,
    price:      (menuItemId, region = "us") => `price_${menuItemId}_${region}`,
    restaurant: (id)           => `restaurant_${id}`,
  },
};