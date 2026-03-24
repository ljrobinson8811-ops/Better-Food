import { base44 } from "@/api/base44Client";
import { Cache, TTL } from "@/infra/cache";
import { logError, ErrorTypes } from "@/infra/errorLogger";

function buildIngredientList(ingredients = []) {
  return ingredients
    .filter((ingredient) => ingredient && ingredient.accepted !== false)
    .map((ingredient) =>
      `${ingredient.quantity ?? ""} ${ingredient.better ?? ingredient.original ?? ""}`.trim()
    )
    .filter(Boolean)
    .join(", ");
}

function normalizeNutritionResult(result) {
  if (!result || typeof result !== "object") {
    return null;
  }

  return {
    calories: Number(result.calories ?? 0),
    protein_g: Number(result.protein_g ?? 0),
    carbs_g: Number(result.carbs_g ?? 0),
    fat_g: Number(result.fat_g ?? 0),
    fiber_g: Number(result.fiber_g ?? 0),
    sodium_mg: Number(result.sodium_mg ?? 0),
    sugar_g: Number(result.sugar_g ?? 0),
    cholesterol_mg: Number(result.cholesterol_mg ?? 0),
  };
}

export const NutritionService = {
  async calculate(ingredients = [], menuItemId = "") {
    const cacheKey = Cache.keys.nutrition(menuItemId || "draft");
    const cached = Cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const ingredientList = buildIngredientList(ingredients);
    if (!ingredientList) {
      return null;
    }

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Using USDA FoodData Central style nutrition estimation, calculate per-serving totals for these ingredients: ${ingredientList}. Return calories, protein_g, carbs_g, fat_g, fiber_g, sodium_mg, sugar_g, cholesterol_mg as numbers only.`,
        response_json_schema: {
          type: "object",
          properties: {
            calories: { type: "number" },
            protein_g: { type: "number" },
            carbs_g: { type: "number" },
            fat_g: { type: "number" },
            fiber_g: { type: "number" },
            sodium_mg: { type: "number" },
            sugar_g: { type: "number" },
            cholesterol_mg: { type: "number" },
          },
          required: [
            "calories",
            "protein_g",
            "carbs_g",
            "fat_g",
            "fiber_g",
            "sodium_mg",
            "sugar_g",
            "cholesterol_mg",
          ],
        },
      });

      const normalized = normalizeNutritionResult(result);
      if (!normalized) {
        throw new Error("Invalid nutrition payload returned");
      }

      Cache.set(cacheKey, normalized, TTL.NUTRITION);
      return normalized;
    } catch (error) {
      await logError(
        ErrorTypes.AI_FAILURE,
        error?.message || "Nutrition calculation failed",
        { menuItemId, ingredientCount: ingredients.length },
        "medium"
      );
      return null;
    }
  },
};