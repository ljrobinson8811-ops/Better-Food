import { base44 } from "@/api/base44Client";
import { Cache, TTL } from "@/components/infra/cache";
import { Validators } from "@/components/infra/validation";
import { Dedup } from "@/components/infra/deduplication";
import { logError, ErrorTypes } from "./errorLogger";

function validateRecipe(r) {
  const errors = [];
  if (!r?.title) errors.push("Missing title");
  if (!r?.ingredients?.length || r.ingredients.length < 2) errors.push("Too few ingredients");
  if (!r?.steps?.length || r.steps.length < 2) errors.push("Too few steps");
  if (!r?.better_calories || r.better_calories < 50) errors.push("Invalid calorie data");
  return { valid: errors.length === 0, errors };
}

export async function generateAndStoreRecipe(menuItem, restaurant) {
  const startTime = Date.now();
  const menuItemId = menuItem.id;
  const restaurantId = restaurant?.id;

  // Cache check (memory/localStorage first, then DB)
  const memCached = Cache.get(Cache.keys.recipe(menuItemId));
  if (memCached) return { cached: true, recipe: memCached };

  const existing = await Dedup.recipeExists(menuItemId);
  if (existing) {
    Cache.set(Cache.keys.recipe(menuItemId), existing, TTL.RECIPE);
    await _logGeneration(menuItemId, restaurantId, menuItem.name, restaurant?.name, "cached", Date.now() - startTime, true, null, existing.id);
    return { cached: true, recipe: existing };
  }

  let result;
  try {
    result = await base44.integrations.Core.InvokeLLM({
      prompt: `Create a healthy homemade version of "${menuItem.name}" from ${restaurant?.name || "a fast food restaurant"}.
      Original: ${menuItem.original_calories} cal, ${menuItem.original_protein}g protein, ${menuItem.original_carbs}g carbs, ${menuItem.original_fat}g fat, ${menuItem.original_sodium}mg sodium. Price: $${menuItem.original_price_estimate}.
      Make it: similar taste, healthier swaps, lower calories/fat/sodium, maintained or higher protein.
      Return: title, prep_time_minutes, cook_time_minutes, difficulty_level (1-4),
      ingredients (each: original, better, optional_swap, quantity),
      steps (each: step_number, instruction, ingredient_note, timer_seconds),
      better_calories, better_protein, better_carbs, better_fat, better_sodium,
      homemade_cost_estimate, savings_amount`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          title: { type: "string" }, prep_time_minutes: { type: "number" },
          cook_time_minutes: { type: "number" }, difficulty_level: { type: "number" },
          ingredients: { type: "array", items: { type: "object", properties: {
            original: { type: "string" }, better: { type: "string" },
            optional_swap: { type: "string" }, quantity: { type: "string" }
          }}},
          steps: { type: "array", items: { type: "object", properties: {
            step_number: { type: "number" }, instruction: { type: "string" },
            ingredient_note: { type: "string" }, timer_seconds: { type: "number" }
          }}},
          better_calories: { type: "number" }, better_protein: { type: "number" },
          better_carbs: { type: "number" }, better_fat: { type: "number" },
          better_sodium: { type: "number" }, homemade_cost_estimate: { type: "number" },
          savings_amount: { type: "number" }
        }
      }
    });
  } catch (err) {
    await logError(ErrorTypes.AI_FAILURE, err.message, { menuItemId, restaurantId }, "high");
    await _logGeneration(menuItemId, restaurantId, menuItem.name, restaurant?.name, "failed", Date.now() - startTime, false, err.message);
    throw err;
  }

  const { valid, errors } = validateRecipe(result);
  if (!valid) {
    const msg = `Validation failed: ${errors.join(", ")}`;
    await logError(ErrorTypes.RECIPE_VALIDATION, msg, { menuItemId }, "medium");
    await _logGeneration(menuItemId, restaurantId, menuItem.name, restaurant?.name, "failed", Date.now() - startTime, false, msg);
    throw new Error(msg);
  }

  const recipe = await base44.entities.Recipe.create({
    ...result, menu_item_id: menuItemId, restaurant_id: restaurantId, servings: 1,
  });
  // Write to cache so next load is instant
  Cache.set(Cache.keys.recipe(menuItemId), recipe, TTL.RECIPE);
  await _logGeneration(menuItemId, restaurantId, menuItem.name, restaurant?.name, "success", Date.now() - startTime, true, null, recipe.id);
  return { cached: false, recipe };
}

async function _logGeneration(menuItemId, restaurantId, itemName, restName, status, durationMs, validationPassed, errorMessage, recipeId) {
  await base44.entities.RecipeGenerationLog.create({
    menu_item_id: menuItemId, restaurant_id: restaurantId,
    menu_item_name: itemName, restaurant_name: restName,
    status, duration_ms: durationMs, validation_passed: validationPassed,
    error_message: errorMessage, recipe_id: recipeId, ai_model_used: "default",
  }).catch(() => {});
}