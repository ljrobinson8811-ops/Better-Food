import { base44 } from "@/api/base44Client";

function getSessionId() {
  let sid = sessionStorage.getItem("bf_sid");
  if (!sid) {
    sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem("bf_sid", sid);
  }
  return sid;
}

export function track(eventName, metadata = {}) {
  base44.entities.UserAnalytics.create({
    event_name: eventName,
    page: window.location.pathname,
    metadata,
    session_id: getSessionId(),
  }).catch(() => {});
}

export const Analytics = {
  // Core funnel
  appOpen:              ()                                  => track("app_open"),
  restaurantSearched:   (name)                             => track("restaurant_search",         { name }),
  menuViewed:           (restaurantId, restaurantName)     => track("menu_viewed",                { restaurantId, restaurantName }),
  menuItemSelected:     (itemId, itemName, restaurantName) => track("menu_item_select",           { itemId, itemName, restaurantName }),
  recipeViewed:         (menuItemId)                       => track("recipe_view",                { menuItemId }),
  recipeGenerated:      (menuItemId)                       => track("recipe_generation",          { menuItemId }),
  recipeCacheHit:       (menuItemId)                       => track("recipe_cache_hit",           { menuItemId }),
  recipeShared:         (menuItemId, platform)             => track("recipe_share",               { menuItemId, platform }),
  // Premium
  premiumAttempted:     (feature)                          => track("premium_feature_click",      { feature }),
  premiumConverted:     ()                                 => track("subscription_start"),
  premiumCancelled:     ()                                 => track("subscription_cancel"),
  // Community
  favoriteAdded:        (type, name)                       => track("favorite_added",             { type, name }),
  cookingModeStarted:   (mode)                             => track("cooking_mode_started",       { mode }),
  photoUploaded:        (menuItemId)                       => track("photo_uploaded",             { menuItemId }),
  // Growth
  referralConversion:   (referrerEmail)                    => track("referral_conversion",        { referrerEmail }),
};