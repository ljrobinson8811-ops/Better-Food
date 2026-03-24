import { base44 } from "@/api/base44Client";
import { Cache, TTL } from "@/infra/cache";
import { Validators } from "@/infra/validation";
import { Dedup } from "@/infra/deduplication";
import { logError, ErrorTypes } from "@/infra/errorLogger";

const MAJOR_CHAINS = [
  "mcdonald's",
  "starbucks",
  "taco bell",
  "chick-fil-a",
  "burger king",
  "wendy's",
  "chipotle",
  "in-n-out",
  "subway",
  "panda express",
  "domino's",
  "pizza hut",
  "kfc",
  "popeyes",
  "five guys",
  "sonic",
  "dairy queen",
];

function normalizeMenuItems(items = [], restaurantId) {
  return items
    .map((item) => ({
      name: String(item?.name || "").trim(),
      category: String(item?.category || "other").trim(),
      original_price_estimate: Number(item?.original_price_estimate ?? 0),
      original_calories: Number(item?.original_calories ?? 0),
      original_protein: Number(item?.original_protein ?? 0),
      original_carbs: Number(item?.original_carbs ?? 0),
      original_fat: Number(item?.original_fat ?? 0),
      original_sodium: Number(item?.original_sodium ?? 0),
      difficulty_level: Number(item?.difficulty_level ?? 2),
      restaurant_id: restaurantId,
    }))
    .filter((item) => !Validators.menuItem(item));
}

async function logDiscovery(
  restaurantId,
  restaurantName,
  status,
  itemsFound,
  itemsCreated,
  source,
  errorMessage,
  durationMs
) {
  const nextRefresh = new Date();
  nextRefresh.setDate(nextRefresh.getDate() + 7);

  await base44.entities.MenuDiscoveryLog.create({
    restaurant_id: restaurantId,
    restaurant_name: restaurantName,
    status,
    items_found: itemsFound,
    items_created: itemsCreated,
    source,
    error_message: errorMessage || null,
    duration_ms: durationMs,
    next_refresh_due: nextRefresh.toISOString().split("T")[0],
  }).catch(() => {});
}

export async function enqueueRestaurantRefresh(restaurantId, restaurantName) {
  const lowerName = String(restaurantName || "").toLowerCase();
  const isMajor = MAJOR_CHAINS.some((chain) => lowerName.includes(chain));

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
  const cacheKey = Cache.keys.menu(restaurantId);

  const cached = Cache.get(cacheKey);
  if (cached) {
    return {
      cached: true,
      success: true,
      items: cached,
      itemsCreated: cached.length,
    };
  }

  try {
    const existingItems = await base44.entities.MenuItem.filter({
      restaurant_id: restaurantId,
    });

    if (existingItems?.length > 0) {
      Cache.set(cacheKey, existingItems, TTL.MENU);
      await logDiscovery(
        restaurantId,
        restaurantName,
        "success",
        existingItems.length,
        0,
        "database_cache",
        null,
        Date.now() - startTime
      );

      return {
        cached: true,
        success: true,
        items: existingItems,
        itemsCreated: 0,
      };
    }

    const llmResult = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a fast-food menu database expert. Generate 12 to 15 of the most popular menu items for "${restaurantName}". For each item return: name, category, original_price_estimate, original_calories, original_protein, original_carbs, original_fat, original_sodium, difficulty_level. Keep values realistic.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                category: { type: "string" },
                original_price_estimate: { type: "number" },
                original_calories: { type: "number" },
                original_protein: { type: "number" },
                original_carbs: { type: "number" },
                original_fat: { type: "number" },
                original_sodium: { type: "number" },
                difficulty_level: { type: "number" },
              },
              required: [
                "name",
                "category",
                "original_price_estimate",
                "original_calories",
                "original_protein",
                "original_carbs",
                "original_fat",
                "original_sodium",
                "difficulty_level",
              ],
            },
          },
        },
        required: ["items"],
      },
    });

    if (!llmResult?.items?.length) {
      throw new Error("No menu items returned");
    }

    const normalizedItems = normalizeMenuItems(llmResult.items, restaurantId);
    const newItems = await Dedup.filterNewMenuItems(restaurantId, normalizedItems);

    if (newItems.length === 0) {
      await logDiscovery(
        restaurantId,
        restaurantName,
        "success",
        normalizedItems.length,
        0,
        "ai_extraction",
        null,
        Date.now() - startTime
      );

      return {
        success: true,
        items: [],
        itemsCreated: 0,
        cached: false,
      };
    }

    const createdItems = await base44.entities.MenuItem.bulkCreate(
      newItems.map((item) => ({
        ...item,
        restaurant_id: restaurantId,
        menu_type: "official",
      }))
    );

    Cache.set(cacheKey, createdItems, TTL.MENU);

    await logDiscovery(
      restaurantId,
      restaurantName,
      "success",
      normalizedItems.length,
      createdItems.length,
      "ai_extraction",
      null,
      Date.now() - startTime
    );

    return {
      success: true,
      items: createdItems,
      itemsCreated: createdItems.length,
      cached: false,
    };
  } catch (error) {
    await logError(
      ErrorTypes.MENU_PARSE,
      error?.message || "Menu discovery failed",
      { restaurantId, restaurantName },
      "high"
    );

    await logDiscovery(
      restaurantId,
      restaurantName,
      "failed",
      0,
      0,
      "ai_extraction",
      error?.message || "Unknown error",
      Date.now() - startTime
    );

    return {
      success: false,
      items: [],
      itemsCreated: 0,
      cached: false,
      error: error?.message || "Menu discovery failed",
    };
  }
}