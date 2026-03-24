import { base44 } from "@/api/base44Client";
import { Analytics } from "@/components/infra/analytics";

export const PREMIUM_FEATURES = Object.freeze({
  COOKING_MODE: "cooking_mode",
  INGREDIENT_PRICING: "ingredient_pricing",
  PORTION_SCALING: "portion_scaling",
  PANTRY: "pantry",
  PHOTO_UPLOAD: "photo_upload",
  ADVANCED_SWAPS: "advanced_swaps",
  NUTRITION_EXPANSION: "nutrition_expansion",
});

function canUseSessionStorage() {
  return typeof window !== "undefined" && typeof sessionStorage !== "undefined";
}

function readCachedPremiumStatus() {
  if (!canUseSessionStorage()) return null;

  try {
    const raw = sessionStorage.getItem("bf_premium_status");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeCachedPremiumStatus(value) {
  if (!canUseSessionStorage()) return;

  try {
    sessionStorage.setItem("bf_premium_status", JSON.stringify(value));
  } catch {
    // ignore storage errors
  }
}

export function clearPremiumCache() {
  if (!canUseSessionStorage()) return;

  try {
    sessionStorage.removeItem("bf_premium_status");
  } catch {
    // ignore storage errors
  }
}

export async function isPremiumUser() {
  const cached = readCachedPremiumStatus();
  if (typeof cached?.isPremium === "boolean") {
    return cached.isPremium;
  }

  try {
    const user = await base44.auth.me();
    if (!user?.email) {
      writeCachedPremiumStatus({ isPremium: false });
      return false;
    }

    const statsList = await base44.entities.UserStats.filter({
      created_by: user.email,
    });

    const stats = statsList?.[0];
    const now = new Date();
    const expiry = stats?.premium_expiry ? new Date(stats.premium_expiry) : null;

    const activeBillingStatuses = new Set(["active", "trialing"]);
    const isPremium =
      activeBillingStatuses.has(String(stats?.billing_status || "").toLowerCase()) &&
      Boolean(expiry && expiry > now);

    writeCachedPremiumStatus({ isPremium });
    return isPremium;
  } catch {
    writeCachedPremiumStatus({ isPremium: false });
    return false;
  }
}

export async function gateFeature(featureName, menuItemId = null) {
  const premium = await isPremiumUser();

  base44.entities.PremiumFeatureUsage
    .create({
      feature_name: featureName,
      action: premium ? "unlocked" : "blocked",
      menu_item_id: menuItemId,
      converted_to_premium: false,
    })
    .catch(() => {});

  if (!premium) {
    Analytics.premiumAttempted(featureName);
  }

  return premium;
}