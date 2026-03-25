/**
 * Price Estimation Service
 * - Detects user location (geolocation API)
 * - Falls back to national US averages
 * - Caches results for 24h per item+region
 */

import { base44 } from "@/api/base44Client";
import { Cache, TTL } from "@/components/infra/cache";

// National average ingredient cost multipliers by region
const REGIONAL_MULTIPLIERS = {
  CA: 1.18, NY: 1.22, TX: 0.95, FL: 1.02,
  WA: 1.14, IL: 1.06, MA: 1.19, default: 1.0,
};

// National average grocery prices (USD per unit) for common ingredients
const NATIONAL_AVERAGES = {
  "ground beef (lb)":        6.50,
  "chicken breast (lb)":     5.20,
  "bun (each)":              0.40,
  "lettuce (head)":          2.00,
  "tomato (each)":           0.80,
  "cheddar cheese (oz)":     0.45,
  "mayo (oz)":               0.12,
  "ketchup (oz)":            0.08,
  "mustard (oz)":            0.07,
  "onion (each)":            0.60,
  "egg (each)":              0.25,
  "milk (cup)":              0.30,
  "butter (tbsp)":           0.20,
  "olive oil (tbsp)":        0.25,
  "flour (cup)":             0.15,
  "default":                 1.00,
};

async function detectRegion() {
  const cached = Cache.get("user_region");
  if (cached) return cached;
  try {
    // Use IP-based detection via a free endpoint (no API key needed)
    const res  = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(3000) });
    const data = await res.json();
    const region = data.region_code ?? "default";
    Cache.set("user_region", region, TTL.NUTRITION); // cache for 24h
    return region;
  } catch {
    return "default";
  }
}

export const PriceService = {
  /**
   * Estimate the homemade cost for a recipe's ingredients
   * @param {Array}  ingredients - array of {better: string, quantity: string}
   * @param {string} menuItemId
   */
  async estimate(ingredients = [], menuItemId = "") {
    const cacheKey = Cache.keys.price(menuItemId);
    const cached   = Cache.get(cacheKey);
    if (cached) return cached;

    const region     = await detectRegion();
    const multiplier = REGIONAL_MULTIPLIERS[region] ?? REGIONAL_MULTIPLIERS.default;

    let total = 0;
    for (const ing of ingredients) {
      const name  = (ing.better || ing.original || "").toLowerCase();
      const match = Object.keys(NATIONAL_AVERAGES).find(k => name.includes(k.split(" ")[0]));
      const price = (NATIONAL_AVERAGES[match] ?? NATIONAL_AVERAGES.default) * multiplier;
      total += price;
    }

    const result = {
      estimated_cost: parseFloat(total.toFixed(2)),
      region,
      multiplier,
      currency: "USD",
      source: "national_averages",
    };

    Cache.set(cacheKey, result, TTL.PRICE);
    return result;
  },
};