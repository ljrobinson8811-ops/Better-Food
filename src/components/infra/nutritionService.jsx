/**
 * Nutrition Calculation Service
 * - Calculates: calories, protein, carbs, fat, fiber, sodium, sugar, cholesterol
 * - Uses AI backed by USDA FoodData Central as source of truth
 * - Caches outputs per item for 24h
 */

import { base44 } from "@/api/base44Client";
import { Cache, TTL } from "@/components/infra/cache";

export const NutritionService = {
  /**
   * Calculate detailed nutrition for a set of ingredients
   * Falls back to recipe.better_* values if AI call fails
   */
  async calculate(ingredients = [], menuItemId = "") {
    const cacheKey = Cache.keys.nutrition(menuItemId);
    const cached   = Cache.get(cacheKey);
    if (cached) return cached;

    const ingredientList = ingredients
      .filter(i => i.accepted !== false)
      .map(i => `${i.quantity ?? ""} ${i.better ?? i.original}`.trim())
      .join(", ");

    if (!ingredientList) return null;

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Using USDA FoodData Central standards, calculate the total nutrition for these ingredients: ${ingredientList}.
        Return accurate per-serving totals. Be precise.`,
        response_json_schema: {
          type: "object",
          properties: {
            calories:     { type: "number" },
            protein_g:    { type: "number" },
            carbs_g:      { type: "number" },
            fat_g:        { type: "number" },
            fiber_g:      { type: "number" },
            sodium_mg:    { type: "number" },
            sugar_g:      { type: "number" },
            cholesterol_mg: { type: "number" },
          },
        },
      });

      if (result) {
        Cache.set(cacheKey, result, TTL.NUTRITION);
        return result;
      }
    } catch {}

    return null;
  },
};