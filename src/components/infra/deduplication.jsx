import { base44 } from "@/api/base44Client";
import { logError, ErrorTypes } from "@/infra/errorLogger";

function normalize(value = "") {
  return String(value).toLowerCase().replace(/[^a-z0-9]/g, "").trim();
}

export const Dedup = {
  async restaurantExists(name) {
    try {
      const allRestaurants = await base44.entities.Restaurant.list("name", 200);
      return allRestaurants.some(
        (restaurant) => normalize(restaurant?.name) === normalize(name)
      );
    } catch (error) {
      await logError(
        ErrorTypes.API_ERROR,
        error?.message || "Restaurant deduplication failed",
        { name },
        "medium"
      );
      return false;
    }
  },

  async menuItemExists(restaurantId, itemName) {
    try {
      const items = await base44.entities.MenuItem.filter({
        restaurant_id: restaurantId,
      });

      return (
        items.find((item) => normalize(item?.name) === normalize(itemName)) || null
      );
    } catch (error) {
      await logError(
        ErrorTypes.API_ERROR,
        error?.message || "Menu item deduplication failed",
        { restaurantId, itemName },
        "medium"
      );
      return null;
    }
  },

  async recipeExists(menuItemId) {
    try {
      const recipes = await base44.entities.Recipe.filter({
        menu_item_id: menuItemId,
      });

      return recipes?.[0] || null;
    } catch (error) {
      await logError(
        ErrorTypes.API_ERROR,
        error?.message || "Recipe deduplication failed",
        { menuItemId },
        "medium"
      );
      return null;
    }
  },

  async filterNewMenuItems(restaurantId, items = []) {
    try {
      const existingItems = await base44.entities.MenuItem.filter({
        restaurant_id: restaurantId,
      });

      const existingNames = new Set(
        existingItems.map((item) => normalize(item?.name))
      );

      return items.filter((item) => !existingNames.has(normalize(item?.name)));
    } catch (error) {
      await logError(
        ErrorTypes.API_ERROR,
        error?.message || "Menu deduplication filter failed",
        { restaurantId, itemCount: items.length },
        "medium"
      );
      return items;
    }
  },
};