import { Cache, TTL } from "@/infra/cache";
import { logError, ErrorTypes } from "@/infra/errorLogger";

const REGIONAL_MULTIPLIERS = {
  CA: 1.18,
  NY: 1.22,
  TX: 0.95,
  FL: 1.02,
  WA: 1.14,
  IL: 1.06,
  MA: 1.19,
  default: 1.0,
};

const NATIONAL_AVERAGES = {
  "ground beef": 6.5,
  "chicken breast": 5.2,
  "bun": 0.4,
  "lettuce": 2.0,
  "tomato": 0.8,
  "cheddar cheese": 0.45,
  "mayo": 0.12,
  "ketchup": 0.08,
  "mustard": 0.07,
  "onion": 0.6,
  "egg": 0.25,
  "milk": 0.3,
  "butter": 0.2,
  "olive oil": 0.25,
  "flour": 0.15,
  default: 1.0,
};

function inferIngredientBasePrice(name = "") {
  const normalizedName = name.toLowerCase();

  const match = Object.keys(NATIONAL_AVERAGES).find((key) => {
    if (key === "default") {
      return false;
    }
    return normalizedName.includes(key);
  });

  return NATIONAL_AVERAGES[match] ?? NATIONAL_AVERAGES.default;
}

async function detectRegion() {
  const cachedRegion = Cache.get("user_region");
  if (cachedRegion) {
    return cachedRegion;
  }

  try {
    const response = await fetch("https://ipapi.co/json/");
    if (!response.ok) {
      throw new Error(`Region lookup failed with ${response.status}`);
    }

    const data = await response.json();
    const region = data?.region_code || "default";
    Cache.set("user_region", region, TTL.PRICE);
    return region;
  } catch {
    return "default";
  }
}

export const PriceService = {
  async estimate(ingredients = [], menuItemId = "") {
    const region = await detectRegion();
    const cacheKey = Cache.keys.price(menuItemId || "draft", region);
    const cached = Cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const multiplier =
        REGIONAL_MULTIPLIERS[region] ?? REGIONAL_MULTIPLIERS.default;

      let total = 0;

      for (const ingredient of ingredients) {
        const ingredientName = ingredient?.better || ingredient?.original || "";
        total += inferIngredientBasePrice(ingredientName) * multiplier;
      }

      const result = {
        estimated_cost: Number(total.toFixed(2)),
        region,
        multiplier,
        currency: "USD",
        source: "national_averages",
      };

      Cache.set(cacheKey, result, TTL.PRICE);
      return result;
    } catch (error) {
      await logError(
        ErrorTypes.API_ERROR,
        error?.message || "Price estimation failed",
        { menuItemId, ingredientCount: ingredients.length, region },
        "medium"
      );

      return {
        estimated_cost: 0,
        region,
        multiplier: REGIONAL_MULTIPLIERS[region] ?? REGIONAL_MULTIPLIERS.default,
        currency: "USD",
        source: "fallback",
      };
    }
  },
};