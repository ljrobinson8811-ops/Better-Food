import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Heart, Utensils, Store, ArrowRight, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";

function EmptyState({ isRecipe }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center px-6 py-16 text-center"
    >
      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl border border-primary/15 bg-gradient-to-br from-primary/10 to-primary/5">
        {isRecipe ? (
          <Utensils className="h-8 w-8 text-primary/60" />
        ) : (
          <Store className="h-8 w-8 text-primary/60" />
        )}
      </div>

      <h3 className="text-lg font-black text-foreground">
        {isRecipe ? "No saved recipes yet" : "No saved restaurants yet"}
      </h3>

      <p className="mt-2 max-w-[240px] text-sm leading-relaxed text-muted-foreground">
        {isRecipe
          ? "Find a fast food item and save your first better recipe."
          : "Explore restaurants and save your favorites here."}
      </p>

      <Link
        to={createPageUrl("Explore")}
        className="mt-5 flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-white transition-transform active:scale-95"
      >
        <Search className="h-4 w-4" />
        Start Exploring
      </Link>
    </motion.div>
  );
}

function buildFavoriteUrl(favorite) {
  if (favorite.item_type === "restaurant") {
    return createPageUrl(`RestaurantDetail?id=${favorite.item_id}`);
  }

  return createPageUrl(
    `RecipeDetail?menuItemId=${favorite.item_id}&restaurantId=${favorite.restaurant_id || ""}`
  );
}

export default function Favorites() {
  const [activeTab, setActiveTab] = useState("recipe");

  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ["favorites"],
    queryFn: async () => {
      const user = await base44.auth.me();
      const result = await base44.entities.UserFavorite.filter({
        created_by: user.email,
      });
      return Array.isArray(result) ? result : [];
    },
    initialData: [],
  });

  const recipeFavorites = useMemo(
    () => favorites.filter((favorite) => favorite.item_type === "recipe"),
    [favorites]
  );

  const restaurantFavorites = useMemo(
    () => favorites.filter((favorite) => favorite.item_type === "restaurant"),
    [favorites]
  );

  const visibleFavorites =
    activeTab === "recipe" ? recipeFavorites : restaurantFavorites;

  return (
    <div className="min-h-screen bg-background">
      <div className="rounded-b-3xl bg-foreground px-5 pb-6 pt-14">
        <div className="mb-1 flex items-center justify-between">
          <p className="text-[11px] font-black uppercase tracking-widest text-background/40">
            Your Collection
          </p>
          <Heart className="h-4 w-4 fill-primary text-primary" />
        </div>

        <h1 className="text-2xl font-black text-background">Favorites</h1>
        <p className="mt-1 text-sm text-background/60">
          {favorites.length} saved items across {recipeFavorites.length} recipes and{" "}
          {restaurantFavorites.length} restaurants
        </p>

        <div className="mt-4 flex gap-1 rounded-xl bg-background/10 p-1">
          {[
            {
              value: "recipe",
              label: "Recipes",
              count: recipeFavorites.length,
              icon: Utensils,
            },
            {
              value: "restaurant",
              label: "Restaurants",
              count: restaurantFavorites.length,
              icon: Store,
            },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold transition-all ${
                activeTab === tab.value
                  ? "bg-primary text-white"
                  : "text-background/40"
              }`}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
              {tab.count > 0 ? (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[9px] ${
                    activeTab === tab.value ? "bg-white/20" : "bg-background/20"
                  }`}
                >
                  {tab.count}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 px-5">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="shimmer h-20 rounded-2xl" />
            ))}
          </div>
        ) : visibleFavorites.length === 0 ? (
          <EmptyState isRecipe={activeTab === "recipe"} />
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {visibleFavorites.map((favorite, index) => (
                <motion.div
                  key={favorite.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                >
                  <Link
                    to={buildFavoriteUrl(favorite)}
                    className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5 transition-all hover:border-primary/25 active:scale-[0.98]"
                  >
                    <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-secondary">
                      {favorite.image_url ? (
                        <img
                          src={favorite.image_url}
                          alt=""
                          className="h-full w-full rounded-xl object-cover"
                        />
                      ) : (
                        <span className="text-2xl">
                          {favorite.item_type === "restaurant" ? "🏪" : "🍽️"}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-foreground">
                        {favorite.item_name}
                      </p>

                      {favorite.restaurant_name ? (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {favorite.restaurant_name}
                        </p>
                      ) : null}

                      <div className="mt-1.5 flex items-center gap-1">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                            favorite.item_type === "recipe"
                              ? "bg-chart-3/10 text-chart-3"
                              : "bg-chart-2/10 text-chart-2"
                          }`}
                        >
                          {favorite.item_type === "recipe"
                            ? "BETTER RECIPE"
                            : "RESTAURANT"}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-center gap-2">
                      <Heart className="h-4 w-4 fill-primary text-primary" />
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40" />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <div className="h-4" />
    </div>
  );
}