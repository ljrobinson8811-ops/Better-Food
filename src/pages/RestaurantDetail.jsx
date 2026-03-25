import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Sparkles, ChevronRight, Flame, DollarSign, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import DifficultyBadge from "@/components/shared/DifficultyBadge";
import { Analytics } from "@/components/infra/analytics";
import { discoverMenuForRestaurant, enqueueRestaurantRefresh } from "@/components/infra/menuWorker";

const CATEGORIES = [
  { label: "All",           emoji: "" },
  { label: "Burgers",       emoji: "🍔" },
  { label: "Chicken",       emoji: "🍗" },
  { label: "Breakfast",     emoji: "🥞" },
  { label: "Fries & Sides", emoji: "🍟" },
  { label: "Drinks",        emoji: "🥤" },
  { label: "Desserts",      emoji: "🍦" },
];
const categoryMap = {
  "All": null, "Burgers": "burgers", "Chicken": "chicken",
  "Breakfast": "breakfast", "Fries & Sides": "fries_and_sides",
  "Drinks": "drinks", "Desserts": "desserts",
};
const categoryEmoji = {
  burgers: "🍔", chicken: "🍗", breakfast: "🥞", fries_and_sides: "🍟",
  drinks: "🥤", desserts: "🍦", other: "🍽️"
};

export default function RestaurantDetail() {
  const params = new URLSearchParams(window.location.search);
  const restaurantId = params.get("id");
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeMenu, setActiveMenu] = useState("official");
  const [generating, setGenerating] = useState(false);

  const { data: restaurant } = useQuery({
    queryKey: ["restaurant", restaurantId],
    queryFn: () => base44.entities.Restaurant.filter({ id: restaurantId }),
    select: d => d[0],
    enabled: !!restaurantId,
  });

  const { data: rawMenuItems, isLoading, refetch } = useQuery({
    queryKey: ["menuItems", restaurantId],
    queryFn: () => base44.entities.MenuItem.filter({ restaurant_id: restaurantId }),
    initialData: [],
    enabled: !!restaurantId,
  });
  const menuItems = Array.isArray(rawMenuItems) ? rawMenuItems : [];

  const filteredItems = menuItems.filter(item => {
    const catVal = categoryMap[activeCategory];
    const catMatch = !catVal || item.category === catVal;
    const menuMatch = !item.menu_type || item.menu_type === activeMenu;
    return catMatch && menuMatch;
  });

  // Track menu view
  React.useEffect(() => {
    if (restaurant) {
      Analytics.menuViewed(restaurantId, restaurant.name);
      enqueueRestaurantRefresh(restaurantId, restaurant.name);
    }
  }, [restaurant]);

  const handleGenerateMenu = async () => {
    setGenerating(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate a menu for ${restaurant?.name}. Return the top 12 most popular menu items with: name, category (burgers/chicken/breakfast/fries_and_sides/drinks/desserts/other), original_price_estimate, original_calories, original_protein, original_carbs, original_fat, original_sodium, difficulty_level (1-4)`,
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
    if (result?.items) {
      await base44.entities.MenuItem.bulkCreate(result.items.map(item => ({
        ...item, restaurant_id: restaurantId, menu_type: "official"
      })));
      refetch();
    }
    setGenerating(false);
  };

  const officialCount = menuItems.filter(m => !m.menu_type || m.menu_type === "official").length;
  const unofficialCount = menuItems.filter(m => m.menu_type === "unofficial").length;

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Dark hero header */}
      <div className="bg-foreground relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.05]" style={{
          backgroundImage: "radial-gradient(circle at 70% 30%, hsl(0 78% 48%) 0%, transparent 60%)"
        }} />
        <div className="relative px-5 pt-14 pb-6">
          <Link
            to={createPageUrl("Explore")}
            className="inline-flex items-center gap-2 text-background/55 hover:text-background/80 transition-colors mb-5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Explore</span>
          </Link>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-background/10 border border-background/15 flex items-center justify-center text-2xl overflow-hidden flex-shrink-0">
              {restaurant?.logo_url
                ? <img src={restaurant.logo_url} alt="" className="w-full h-full object-cover" />
                : <span>🍔</span>
              }
            </div>
            <div>
              <p className="text-background/45 text-[11px] font-bold uppercase tracking-widest">Restaurant</p>
              <h1 className="text-2xl font-black text-background mt-0.5">{restaurant?.name || "..."}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-background/55">{menuItems.length} items available</span>
                {menuItems.length > 0 && (
                  <span className="text-[9px] font-bold text-chart-3 bg-chart-3/20 px-2 py-0.5 rounded-full">BETTER VERSIONS READY</span>
                )}
              </div>
            </div>
          </div>

          {/* Quick stats */}
          {menuItems.length > 0 && (
            <div className="flex gap-3 mt-4">
              {[
                { icon: Flame, val: "Avg -520", label: "calories", color: "text-primary" },
                { icon: Zap, val: "Avg +18g", label: "protein", color: "text-chart-3" },
                { icon: DollarSign, val: "Avg $5+", label: "saved", color: "text-chart-4" },
              ].map(s => (
                <div key={s.label} className="flex-1 bg-background/8 border border-background/12 rounded-xl p-2 text-center">
                  <p className={`text-xs font-black ${s.color}`}>{s.val}</p>
                   <p className="text-[9px] text-background/55">{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Menu type selector */}
        <div className="px-5 pb-4">
          <div className="flex bg-background/10 rounded-xl p-1 gap-1">
            {[
              { val: "official", label: `Official Menu`, count: officialCount },
              { val: "unofficial", label: `Community`, count: unofficialCount },
            ].map(t => (
              <button
                key={t.val}
                onClick={() => setActiveMenu(t.val)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeMenu === t.val
                    ? "bg-primary text-white"
                    : "text-background/55 hover:text-background/80"
                }`}
              >
                {t.label}
                {t.count > 0 && (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${activeMenu === t.val ? "bg-white/20" : "bg-background/20"}`}>
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Category Scroll */}
      <div className="mt-4 px-5">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {CATEGORIES.map(cat => (
            <button
              key={cat.label}
              onClick={() => setActiveCategory(cat.label)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeCategory === cat.label
                  ? "bg-primary text-white shadow-md shadow-primary/20"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              {cat.emoji ? `${cat.emoji} ` : ""}{cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Items */}
      <div className="px-5 mt-4">
        {isLoading ? (
          <div className="space-y-3">
            {Array(5).fill(0).map((_, i) => <div key={i} className="h-20 rounded-2xl shimmer" />)}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 rounded-3xl bg-secondary flex items-center justify-center mx-auto mb-4 text-4xl">
              {menuItems.length === 0 ? "✨" : "🔍"}
            </div>
            <h3 className="text-base font-black text-foreground">
              {menuItems.length === 0 ? "Menu Not Yet Loaded" : "No items here"}
            </h3>
            <p className="text-sm text-muted-foreground mt-1 mb-5">
              {menuItems.length === 0
                ? "Let AI discover the full menu for you"
                : "Try a different category"
              }
            </p>
            {menuItems.length === 0 && (
              <Button
                onClick={handleGenerateMenu}
                disabled={generating}
                className="bg-primary hover:bg-primary/90 rounded-2xl px-8 py-3 text-sm font-bold h-auto glow-red"
              >
                {generating
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Discovering Menu...</>
                  : <><Sparkles className="w-4 h-4 mr-2" /> Discover Menu with AI</>
                }
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filteredItems.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Link
                    to={createPageUrl(`RecipeDetail?menuItemId=${item.id}&restaurantId=${restaurantId}`)}
                    className="flex items-center gap-3 p-3 bg-card rounded-2xl border border-border hover:border-primary/25 transition-all active:scale-[0.98]"
                  >
                    <div className="w-14 h-14 rounded-xl bg-secondary border border-border flex items-center justify-center text-2xl flex-shrink-0">
                      {item.image_url
                        ? <img src={item.image_url} alt="" className="w-full h-full object-cover rounded-xl" />
                        : <span>{categoryEmoji[item.category] || "🍽️"}</span>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">{item.name}</p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        {item.original_calories && (
                          <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                            {item.original_calories} cal
                          </span>
                        )}
                        {item.original_price_estimate && (
                          <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                            ${item.original_price_estimate.toFixed(2)}
                          </span>
                        )}
                        {item.difficulty_level && <DifficultyBadge level={item.difficulty_level} />}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="text-[9px] font-bold text-chart-3 bg-chart-3/10 px-2 py-0.5 rounded-full">BETTER →</span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}