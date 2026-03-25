import { base44 } from "@/api/base44Client";
import { Cache, TTL } from "@/components/infra/cache";
import { Validators } from "@/components/infra/validation";
import { Dedup } from "@/components/infra/deduplication";
import { logError, ErrorTypes } from "./errorLogger";

const MAJOR_CHAINS = [
  "mcdonald's","starbucks","taco bell","chick-fil-a","burger king",
  "wendy's","chipotle","in-n-out","subway","panda express",
  "domino's","pizza hut","kfc","popeyes","five guys","sonic","dairy queen",
];

export async function enqueueRestaurantRefresh(restaurantId, restaurantName) {
  const isMajor = MAJOR_CHAINS.some(c => restaurantName?.toLowerCase().includes(c.toLowerCase()));
  const scheduledFor = new Date();
  scheduledFor.setDate(scheduledFor.getDate() + (isMajor ? 1 : 7));
  await base44.entities.RestaurantRefreshQueue.create({
    restaurant_id: restaurantId,
    restaurant_name: restaurantName,
    priority: isMajor ? "high" : "normal",
    status: "pending",
    scheduled_for: scheduledFor.toISOString().split("T")[0],
    attempts: 0,
    is_major_chain: isMajor,
  }).catch(() => {});
}

export async function discoverMenuForRestaurant(restaurantId, restaurantName) {
  const startTime = Date.now();
  // Check cache
  const existing = await base44.entities.MenuItem.filter({ restaurant_id: restaurantId });
  if (existing.length > 0) {
    await _logDiscovery(restaurantId, restaurantName, "success", existing.length, 0, "manual", null, Date.now() - startTime);
    return { cached: true, count: existing.length };
  }
  try {
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a menu database expert. Generate the complete popular menu for "${restaurantName}".
      Return 12-15 most popular items. For each: name, category (burgers/chicken/breakfast/fries_and_sides/drinks/desserts/other),
      original_price_estimate (USD), original_calories, original_protein (g), original_carbs (g),
      original_fat (g), original_sodium (mg), difficulty_level (1-4 ease of making at home).`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          items: { type: "array", items: { type: "object", properties: {
            name: { type: "string" }, category: { type: "string" },
            original_price_estimate: { type: "number" }, original_calories: { type: "number" },
            original_protein: { type: "number" }, original_carbs: { type: "number" },
            original_fat: { type: "number" }, original_sodium: { type: "number" },
            difficulty_level: { type: "number" }
          }}}
        }
      }
    });
    if (result?.items?.length > 0) {
      // Validate + deduplicate before bulk insert
      const schemaValid = result.items.filter(item => !Validators.menuItem({ ...item, restaurant_id: restaurantId }));
      const newItems    = await Dedup.filterNewMenuItems(restaurantId, schemaValid);
      if (newItems.length === 0) {
        await _logDiscovery(restaurantId, restaurantName, "success", 0, 0, "ai_extraction", null, Date.now() - startTime);
        return { success: true, itemsCreated: 0, cached: true };
      }
      const validItems = newItems;
      await base44.entities.MenuItem.bulkCreate(
        validItems.map(item => ({ ...item, restaurant_id: restaurantId, menu_type: "official" }))
      );
      // Cache menu for 24h
      Cache.set(Cache.keys.menu(restaurantId), validItems, TTL.MENU);
      await _logDiscovery(restaurantId, restaurantName, "success", validItems.length, validItems.length, "ai_extraction", null, Date.now() - startTime);
      return { success: true, itemsCreated: validItems.length };
    }
    throw new Error("No items returned");
  } catch (err) {
    await logError(ErrorTypes.MENU_PARSE, err.message, { restaurantId, restaurantName }, "high");
    await _logDiscovery(restaurantId, restaurantName, "failed", 0, 0, "ai_extraction", err.message, Date.now() - startTime);
    throw err;
  }
}

async function _logDiscovery(restaurantId, restaurantName, status, itemsFound, itemsCreated, source, errorMessage, durationMs) {
  const nextRefresh = new Date();
  nextRefresh.setDate(nextRefresh.getDate() + 7);
  await base44.entities.MenuDiscoveryLog.create({
    restaurant_id: restaurantId, restaurant_name: restaurantName,
    status, items_found: itemsFound, items_created: itemsCreated,
    source, error_message: errorMessage, duration_ms: durationMs,
    next_refresh_due: nextRefresh.toISOString().split("T")[0],
  }).catch(() => {});
}