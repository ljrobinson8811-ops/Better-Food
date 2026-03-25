import { base44 } from "@/api/base44Client";
import { Analytics } from "./analytics";

export const PREMIUM_FEATURES = {
  COOKING_MODE: "cooking_mode",
  INGREDIENT_PRICING: "ingredient_pricing",
  PORTION_SCALING: "portion_scaling",
  PANTRY: "pantry",
  PHOTO_UPLOAD: "photo_upload",
  ADVANCED_SWAPS: "advanced_swaps",
  NUTRITION_EXPANSION: "nutrition_expansion",
};

export async function isPremiumUser() {
  const cached = sessionStorage.getItem("bf_premium");
  if (cached !== null) return cached === "true";
  try {
    const me = await base44.auth.me();
    const stats = await base44.entities.UserStats.filter({ created_by: me.email });
    const premium = stats[0]?.is_premium === true;
    sessionStorage.setItem("bf_premium", String(premium));
    return premium;
  } catch {
    return false;
  }
}

export function clearPremiumCache() {
  sessionStorage.removeItem("bf_premium");
}

export async function gateFeature(featureName, menuItemId = null) {
  const premium = await isPremiumUser();
  base44.entities.PremiumFeatureUsage.create({
    feature_name: featureName,
    action: premium ? "unlocked" : "blocked",
    menu_item_id: menuItemId,
    converted_to_premium: false,
  }).catch(() => {});
  if (!premium) Analytics.premiumAttempted(featureName);
  return premium;
}