const MEM = new Map();
const PREFIX = "bf_";

function safeParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export const TTL = {
  MENU: 24 * 60 * 60 * 1000,
  RECIPE: 7 * 24 * 60 * 60 * 1000,
  NUTRITION: 24 * 60 * 60 * 1000,
  PRICE: 24 * 60 * 60 * 1000,
  RESTAURANT: 6 * 60 * 60 * 1000,
  SHORT: 5 * 60 * 1000,
};

export const Cache = {
  set(key, value, ttlMs = TTL.MENU) {
    const entry = {
      value,
      expiry: Date.now() + ttlMs,
    };

    MEM.set(key, entry);

    if (!canUseStorage()) {
      return;
    }

    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(entry));
    } catch {
      // ignore storage write errors
    }
  },

  get(key) {
    let entry = MEM.get(key);

    if (!entry && canUseStorage()) {
      try {
        const raw = localStorage.getItem(PREFIX + key);
        if (raw) {
          entry = safeParse(raw);
          if (entry) {
            MEM.set(key, entry);
          }
        }
      } catch {
        entry = null;
      }
    }

    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiry) {
      this.invalidate(key);
      return null;
    }

    return entry.value;
  },

  invalidate(key) {
    MEM.delete(key);

    if (!canUseStorage()) {
      return;
    }

    try {
      localStorage.removeItem(PREFIX + key);
    } catch {
      // ignore storage remove errors
    }
  },

  invalidatePrefix(prefix) {
    for (const key of Array.from(MEM.keys())) {
      if (key.startsWith(prefix)) {
        MEM.delete(key);
      }
    }

    if (!canUseStorage()) {
      return;
    }

    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i += 1) {
        const storageKey = localStorage.key(i);
        if (storageKey && storageKey.startsWith(PREFIX + prefix)) {
          keysToRemove.push(storageKey);
        }
      }

      keysToRemove.forEach((storageKey) => {
        localStorage.removeItem(storageKey);
      });
    } catch {
      // ignore storage iteration errors
    }
  },

  keys: {
    menu: (restaurantId) => `menu_${restaurantId}`,
    recipe: (menuItemId) => `recipe_${menuItemId}`,
    nutrition: (menuItemId) => `nutrition_${menuItemId}`,
    price: (menuItemId, region = "us") => `price_${menuItemId}_${region}`,
    restaurant: (id) => `restaurant_${id}`,
  },
};