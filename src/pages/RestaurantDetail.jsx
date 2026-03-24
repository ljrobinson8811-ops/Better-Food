import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Loader2,
  Sparkles,
  ChevronRight,
  Flame,
  DollarSign,
  Zap,
} from "lucide-react";

import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import DifficultyBadge from "@/components/shared/DifficultyBadge";
import { Analytics } from "@/components/infra/analytics";
import { discoverMenuForRestaurant, enqueueRestaurantRefresh } from "@/infra/menuWorker";

const CATEGORIES = [
  { label: "All", emoji: "" },
  { label: "Burgers", emoji: "🍔" },
  { label: "Chicken", emoji: "🍗" },
  { label: "Breakfast", emoji: "🥞" },
  { label: "Fries & Sides", emoji: "🍟" },
  { label: "Drinks", emoji: "🥤" },
  { label: "Desserts", emoji: "🍦" },
];

const CATEGORY_MAP = {
  All: null,
  Burgers: "burgers",
  Chicken: "chicken",
  Breakfast: "breakfast",
  "Fries & Sides": "fries_and_sides",
  Drinks: "drinks",
  Desserts: "desserts",
};

const CATEGORY_EMOJI = {
  burgers: "🍔",
  chicken: "🍗",
  breakfast: "🥞",
  fries_and_sides: "🍟",
  drinks: "🥤",
  desserts: "🍦",
  other: "🍽️",
};

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asNumber(value, fallback = null) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function formatPrice(value) {
  const number = asNumber(value);
  return number === null ? null : `$${number.toFixed(2)}`;
}

export default function RestaurantDetail() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const restaurantId = searchParams.get("id") || "";

  const [activeCategory, setActiveCategory] = useState("All");
  const [activeMenuType, setActiveMenuType] = useState("official");
  const [discovering, setDiscovering] = useState(false);

  const { data: restaurant = null, isLoading: restaurantLoading } = useQuery({
    queryKey: ["restaurant", restaurantId],
    enabled: Boolean(restaurantId),
    queryFn: async () => {
      const result = await base44.entities.Restaurant.filter({ id: restaurantId });
      return asArray(result)[0] || null;
    },
    initialData: null,
  });

  const { data: menuItems = [], isLoading: menuItemsLoading } = useQuery({
    queryKey: ["menuItems", restaurantId],
    enabled: Boolean(restaurantId),
    queryFn: async () => {
      const result = await base44.entities.MenuItem.filter({
        restaurant_id: restaurantId,
      });
      return asArray(result);
    },
    initialData: [],
    staleTime: 60 * 1000,
  });

  const filteredItems = useMemo(() => {
    const selectedCategory = CATEGORY_MAP[activeCategory];

    return menuItems.filter((item) => {
      const categoryMatch = !selectedCategory || item.category === selectedCategory;
      const menuType = item.menu_type || "official";
      const menuTypeMatch = menuType === activeMenuType;
      return categoryMatch && menuTypeMatch;
    });
  }, [menuItems, activeCategory, activeMenuType]);

  const officialCount = useMemo(() => {
    return menuItems.filter(
      (item) => !item.menu_type || item.menu_type === "official"
    ).length;
  }, [menuItems]);

  const unofficialCount = useMemo(() => {
    return menuItems.filter((item) => item.menu_type === "unofficial").length;
  }, [menuItems]);

  useEffect(() => {
    if (!restaurantId || !restaurant?.name) return;

    Analytics.menuViewed(restaurantId, restaurant.name);
    enqueueRestaurantRefresh(restaurantId, restaurant.name).catch(() => {});
  }, [restaurantId, restaurant?.name]);

  const handleDiscoverMenu = async () => {
    if (!restaurantId || !restaurant?.name || discovering) return;

    setDiscovering(true);

    try {
      await discoverMenuForRestaurant(restaurantId, restaurant.name);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["menuItems", restaurantId] }),
        queryClient.invalidateQueries({ queryKey: ["menuLogs"] }),
      ]);
    } finally {
      setDiscovering(false);
    }
  };

  if (!restaurantId) {
    return (
      <div className="min-h-screen bg-background pb-8">
        <div className="px-5 pt-16">
          <Link
            to={createPageUrl("Explore")}
            className="mb-6 inline-flex items-center gap-2 text-muted-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Explore</span>
          </Link>

          <div className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-secondary text-4xl">
              ⚠️
            </div>
            <h1 className="text-xl font-black text-foreground">
              Missing restaurant ID
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              This page needs a valid restaurant before it can load.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isLoading = restaurantLoading || menuItemsLoading;
  const restaurantName = restaurant?.name || "Restaurant";
  const restaurantLogo = restaurant?.logo_url || "";
  const hasMenuItems = menuItems.length > 0;

  return (
    <div className="min-h-screen bg-background pb-8">
      <div className="relative overflow-hidden bg-foreground">
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 70% 30%, hsl(0 78% 48%) 0%, transparent 60%)",
          }}
        />

        <div className="relative px-5 pb-6 pt-14">
          <Link
            to={createPageUrl("Explore")}
            className="mb-5 inline-flex items-center gap-2 text-background/55"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Explore</span>
          </Link>

          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-background/15 bg-background/10 text-2xl">
              {restaurantLogo ? (
                <img src={restaurantLogo} alt="" className="h-full w-full object-cover" />
              ) : (
                <span>🍔</span>
              )}
            </div>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-background/45">
                Restaurant
              </p>
              <h1 className="mt-0.5 text-2xl font-black text-background">
                {restaurantName}
              </h1>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-[10px] text-background/55">
                  {menuItems.length} item{menuItems.length === 1 ? "" : "s"} available
                </span>
                {hasMenuItems ? (
                  <span className="rounded-full bg-chart-3/20 px-2 py-0.5 text-[9px] font-bold text-chart-3">
                    BETTER VERSIONS READY
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          {hasMenuItems ? (
            <div className="mt-4 flex gap-3">
              {[
                { icon: Flame, val: "Avg -520", label: "calories", color: "text-primary" },
                { icon: Zap, val: "Avg +18g", label: "protein", color: "text-chart-3" },
                { icon: DollarSign, val: "Avg $5+", label: "saved", color: "text-chart-4" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="flex-1 rounded-xl border border-background/12 bg-background/8 p-2 text-center"
                >
                  <p className={`text-xs font-black ${stat.color}`}>{stat.val}</p>
                  <p className="text-[9px] text-background/55">{stat.label}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="px-5 pb-4">
          <div className="flex gap-1 rounded-xl bg-background/10 p-1">
            {[
              { value: "official", label: "Official Menu", count: officialCount },
              { value: "unofficial", label: "Community", count: unofficialCount },
            ].map((menuType) => (
              <button
                key={menuType.value}
                onClick={() => setActiveMenuType(menuType.value)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-all ${
                  activeMenuType === menuType.value
                    ? "bg-primary text-white"
                    : "text-background/55"
                }`}
              >
                {menuType.label}
                {menuType.count > 0 ? (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[9px] ${
                      activeMenuType === menuType.value
                        ? "bg-white/20"
                        : "bg-background/20"
                    }`}
                  >
                    {menuType.count}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 px-5">
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {CATEGORIES.map((category) => (
            <button
              key={category.label}
              onClick={() => setActiveCategory(category.label)}
              className={`flex-shrink-0 rounded-xl px-4 py-2 text-xs font-bold whitespace-nowrap transition-all ${
                activeCategory === category.label
                  ? "bg-primary text-white shadow-md shadow-primary/20"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              {category.emoji ? `${category.emoji} ` : ""}
              {category.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 px-5">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="shimmer h-20 rounded-2xl" />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-secondary text-4xl">
              {menuItems.length === 0 ? "✨" : "🔍"}
            </div>

            <h3 className="text-base font-black text-foreground">
              {menuItems.length === 0 ? "Menu Not Yet Loaded" : "No items here"}
            </h3>

            <p className="mb-5 mt-1 text-sm text-muted-foreground">
              {menuItems.length === 0
                ? "Let AI discover the menu for you"
                : "Try a different category"}
            </p>

            {menuItems.length === 0 ? (
              <Button
                onClick={handleDiscoverMenu}
                disabled={discovering}
                className="glow-red h-auto rounded-2xl bg-primary px-8 py-3 text-sm font-bold"
              >
                {discovering ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Discovering Menu...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Discover Menu with AI
                  </>
                )}
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filteredItems.map((item, index) => {
                const calories = asNumber(item.original_calories);
                const price = formatPrice(item.original_price_estimate);

                return (
                  <motion.div
                    key={item.id || `${item.name}-${index}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <Link
                      to={createPageUrl(
                        `RecipeDetail?menuItemId=${item.id}&restaurantId=${restaurantId}`
                      )}
                      className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 transition-all hover:border-primary/25 active:scale-[0.98]"
                    >
                      <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-secondary text-2xl">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt=""
                            className="h-full w-full rounded-xl object-cover"
                          />
                        ) : (
                          <span>{CATEGORY_EMOJI[item.category] || "🍽️"}</span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-foreground">
                          {item.name || "Menu Item"}
                        </p>

                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          {calories !== null ? (
                            <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground">
                              {calories} cal
                            </span>
                          ) : null}

                          {price ? (
                            <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground">
                              {price}
                            </span>
                          ) : null}

                          {item.difficulty_level ? (
                            <DifficultyBadge level={item.difficulty_level} />
                          ) : null}
                        </div>
                      </div>

                      <div className="flex flex-shrink-0 flex-col items-end gap-1">
                        <span className="rounded-full bg-chart-3/10 px-2 py-0.5 text-[9px] font-bold text-chart-3">
                          BETTER →
                        </span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}