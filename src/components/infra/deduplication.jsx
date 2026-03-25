/**
 * Deduplication guards to prevent duplicate records in the database
 * Used before any create operation for restaurants, menu items, and recipes
 */

import { base44 } from "@/api/base44Client";

function normalize(str = "") {
  return str.toLowerCase().replace(/[^a-z0-9]/g, "").trim();
}

export const Dedup = {
  /**
   * Returns true if restaurant already exists (by normalized name)
   */
  async restaurantExists(name) {
    const all = await base44.entities.Restaurant.list("name", 200).catch(() => []);
    return all.some(r => normalize(r.name) === normalize(name));
  },

  /**
   * Returns existing menu item if duplicate, null otherwise
   */
  async menuItemExists(restaurantId, itemName) {
    const items = await base44.entities.MenuItem.filter({ restaurant_id: restaurantId }).catch(() => []);
    return items.find(i => normalize(i.name) === normalize(itemName)) ?? null;
  },

  /**
   * Returns existing recipe if duplicate, null otherwise
   */
  async recipeExists(menuItemId) {
    const recipes = await base44.entities.Recipe.filter({ menu_item_id: menuItemId }).catch(() => []);
    return recipes[0] ?? null;
  },

  /**
   * Filter an array of menu items to only non-duplicates for a restaurant
   */
  async filterNewMenuItems(restaurantId, items = []) {
    const existing = await base44.entities.MenuItem.filter({ restaurant_id: restaurantId }).catch(() => []);
    const existingNames = new Set(existing.map(i => normalize(i.name)));
    return items.filter(item => !existingNames.has(normalize(item.name)));
  },
};