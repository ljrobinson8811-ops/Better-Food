import { base44 } from "@/api/base44Client";
import { Cache, TTL } from "@/infra/cache";
import { Validators } from "@/infra/validation";
import { Dedup } from "@/infra/deduplication";
import { logError, ErrorTypes } from "@/infra/errorLogger";

function normalizeRecipePayload(result = {}) {
  return {
    title: String(result?.title || "").trim(),
    prep_time_minutes: Number(result?.prep_time_minutes ?? 0),
    cook_time_minutes: Number(result?.cook_time_minutes ?? 0),
    difficulty_level: Number(result?.difficulty_level ?? 2),
    ingredients: Array.isArray(result?.ingredients) ? result.ingredients : [],
    steps: Array.isArray(result?.steps) ? result.steps : [],
    better_calories: Number(result?.better_calories ?? 0),
    better_protein: Number(result?.better_protein ?? 0),
    better_carbs: Number(result?.better_carbs ?? 0),
    better_fat: Number(result?.better_fat ?? 0),
    better_sodium: Number(result?.better_sodium ?? 0),
    homemade_cost_estimate: Number(result?.homemade_cost_estimate ?? 0),
    savings_amount: Number(result?.savings_amount ?? 0),
  };
}

async function logGeneration(
  menuItemId,
  restaurantId,
  itemName,
  restaurantName,
  status,
  durationMs,
  validationPassed,
  errorMessage,
  recipeId
) {
  await base44.entities.RecipeGenerationLog.create({
    menu_item_id: menuItemId,
    restaurant_id: restaurantId,
    menu_item_name: itemName,
    restaurant_name: restaurantName,
    status,
    duration_ms: durationMs,
    validation_passed: validationPassed,
    error_message: errorMessage || null,
    recipe_id: recipeId || null,
    ai_model_used: "default",
  }).catch(() => {});
}

export async function generateAndStoreRecipe(menuItem, restaurant) {
  const startTime = Date.now();
  const menuItemId = menuItem?.id;
  const restaurantId = restaurant?.id;
  const cacheKey = Cache.keys.recipe(menuItemId);

  const cached = Cache.get(cacheKey);
  if (cached) {
    return {
      cached: true,
      success: true,
      recipe: cached,
    };
  }

  try {
    const existingRecipe = await Dedup.recipeExists(menuItemId);
    if (existingRecipe) {
      Cache.set(cacheKey, existingRecipe, TTL.RECIPE);

      await logGeneration(
        menuItemId,
        restaurantId,
        menuItem?.name,
        restaurant?.name,
        "cached",
        Date.now() - startTime,
        true,
        null,
        existingRecipe.id
      );

      return {
        cached: true,
        success: true,
        recipe: existingRecipe,
      };
    }

    const llmResult = await base44.integrations.Core.InvokeLLM({
      prompt: `Create a healthier homemade version of "${menuItem?.name}" from ${restaurant?.name || "a restaurant"}.
Return:
title,
prep_time_minutes,
cook_time_minutes,
difficulty_level,
ingredients (each with original, better, optional_swap, quantity),
steps (each with step_number, instruction, ingredient_note, timer_seconds),
better_calories,
better_protein,
better_carbs,
better_fat,
better_sodium,
homemade_cost_estimate,
savings_amount.
Keep it realistic, healthier, and still close in taste.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          title: { type: "string" },
          prep_time_minutes: { type: "number" },
          cook_time_minutes: { type: "number" },
          difficulty_level: { type: "number" },
          ingredients: {
            type: "array",
            items: {
              type: "object",
              properties: {
                original: { type: "string" },
                better: { type: "string" },
                optional_swap: { type: "string" },
                quantity: { type: "string" },
              },
            },
          },
          steps: {
            type: "array",
            items: {
              type: "object",
              properties: {
                step_number: { type: "number" },
                instruction: { type: "string" },
                ingredient_note: { type: "string" },
                timer_seconds: { type: "number" },
              },
            },
          },
          better_calories: { type: "number" },
          better_protein: { type: "number" },
          better_carbs: { type: "number" },
          better_fat: { type: "number" },
          better_sodium: { type: "number" },
          homemade_cost_estimate: { type: "number" },
          savings_amount: { type: "number" },
        },
        required: [
          "title",
          "ingredients",
          "steps",
          "better_calories",
          "better_protein",
          "better_carbs",
          "better_fat",
          "better_sodium",
        ],
      },
    });

    const normalizedRecipe = normalizeRecipePayload(llmResult);
    const validationErrors = Validators.recipe(normalizedRecipe);

    if (validationErrors) {
      const message = `Recipe validation failed: ${validationErrors.join(", ")}`;

      await logError(
        ErrorTypes.RECIPE_VALIDATION,
        message,
        { menuItemId, restaurantId },
        "medium"
      );

      await logGeneration(
        menuItemId,
        restaurantId,
        menuItem?.name,
        restaurant?.name,
        "failed",
        Date.now() - startTime,
        false,
        message,
        null
      );

      return {
        success: false,
        cached: false,
        recipe: null,
        error: message,
      };
    }

    const createdRecipe = await base44.entities.Recipe.create({
      ...normalizedRecipe,
      menu_item_id: menuItemId,
      restaurant_id: restaurantId,
      servings: 1,
    });

    Cache.set(cacheKey, createdRecipe, TTL.RECIPE);

    await logGeneration(
      menuItemId,
      restaurantId,
      menuItem?.name,
      restaurant?.name,
      "success",
      Date.now() - startTime,
      true,
      null,
      createdRecipe.id
    );

    return {
      success: true,
      cached: false,
      recipe: createdRecipe,
    };
  } catch (error) {
    await logError(
      ErrorTypes.AI_FAILURE,
      error?.message || "Recipe generation failed",
      { menuItemId, restaurantId },
      "high"
    );

    await logGeneration(
      menuItemId,
      restaurantId,
      menuItem?.name,
      restaurant?.name,
      "failed",
      Date.now() - startTime,
      false,
      error?.message || "Recipe generation failed",
      null
    );

    return {
      success: false,
      cached: false,
      recipe: null,
      error: error?.message || "Recipe generation failed",
    };
  }
}