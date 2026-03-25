/**
 * Request validation helpers
 * Returns null if valid, or an array of error strings
 */

export const Validators = {
  restaurantName(name) {
    if (!name || typeof name !== "string") return ["Restaurant name is required"];
    if (name.trim().length < 2)   return ["Name must be at least 2 characters"];
    if (name.trim().length > 100) return ["Name must be under 100 characters"];
    return null;
  },

  menuItem(item) {
    const errors = [];
    if (!item?.name?.trim())    errors.push("Item name is required");
    if (!item?.restaurant_id)   errors.push("Restaurant ID is required");
    if (item?.original_calories && (item.original_calories < 0 || item.original_calories > 6000))
      errors.push("Calories out of range (0–6000)");
    if (item?.original_protein && item.original_protein < 0)
      errors.push("Protein cannot be negative");
    return errors.length ? errors : null;
  },

  recipe(recipe) {
    const errors = [];
    if (!recipe?.title?.trim())                  errors.push("Recipe title is required");
    if (!recipe?.ingredients || recipe.ingredients.length < 2)
      errors.push("Recipe must have at least 2 ingredients");
    if (!recipe?.steps || recipe.steps.length < 2)
      errors.push("Recipe must have at least 2 steps");
    if (!recipe?.better_calories || recipe.better_calories <= 0)
      errors.push("Calorie data is required");
    return errors.length ? errors : null;
  },

  photoUpload(file) {
    if (!file) return ["No file provided"];
    const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
    if (!ALLOWED.includes(file.type)) return ["Only JPEG, PNG and WebP are allowed"];
    if (file.size > 10 * 1024 * 1024) return ["Image must be under 10 MB"];
    return null;
  },

  aiRecipeOutput(output) {
    return Validators.recipe(output);
  },
};

/** Returns a standardised error payload */
export function structuredError(code, message, details = null) {
  return {
    success: false,
    error: { code, message, timestamp: new Date().toISOString(), ...(details ? { details } : {}) },
  };
}

/** Returns a standardised success payload */
export function structuredSuccess(data) {
  return { success: true, data };
}