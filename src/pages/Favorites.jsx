import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Heart, Utensils, Store, ArrowRight, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Favorites() {
  const [tab, setTab] = useState("recipe");

  const { data: favorites, isLoading } = useQuery({
    queryKey: ["favorites"],
    queryFn: async () => {
      const me = await base44.auth.me();
      return base44.entities.UserFavorite.filter({ created_by: me.email });
    },
    initialData: [],
  });

  const recipes = favorites.filter(f => f.item_type === "recipe");
  const restaurants = favorites.filter(f => f.item_type === "restaurant");
  const filtered = tab === "recipe" ? recipes : restaurants;

  const EmptyState = ({ isRecipe }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center text-center py-16 px-6"
    >
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/15 flex items-center justify-center mb-5">
        {isRecipe
          ? <Utensils className="w-8 h-8 text-primary/60" />
          : <Store className="w-8 h-8 text-primary/60" />
        }
      </div>
      <h3 className="text-lg font-black text-foreground">
        {isRecipe ? "No saved recipes yet" : "No saved restaurants yet"}
      </h3>
      <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-[240px]">
        {isRecipe
          ? "Find a fast food item and generate your first better recipe"
          : "Explore restaurants and save your favorites here"
        }
      </p>
      <Link
        to={createPageUrl("Explore")}
        className="mt-5 bg-primary text-white rounded-2xl px-6 py-3 text-sm font-bold flex items-center gap-2 active:scale-95 transition-transform"
      >
        <Search className="w-4 h-4" />
        Start Exploring
      </Link>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-foreground rounded-b-3xl px-5 pt-14 pb-6">
        <div className="flex items-center justify-between mb-1">
          <p className="text-background/40 text-[11px] font-black uppercase tracking-widest">Your Collection</p>
          <Heart className="w-4 h-4 text-primary fill-primary" />
        </div>
        <h1 className="text-2xl font-black text-background">Favorites</h1>
        <p className="text-background/60 text-sm mt-1">
          {favorites.length} saved items across {recipes.length} recipes & {restaurants.length} restaurants
        </p>

        {/* Tab selector */}
        <div className="flex bg-background/10 rounded-xl p-1 gap-1 mt-4">
          {[
            { val: "recipe", label: "Recipes", count: recipes.length, icon: Utensils },
            { val: "restaurant", label: "Restaurants", count: restaurants.length, icon: Store },
          ].map(t => (
            <button
              key={t.val}
              onClick={() => setTab(t.val)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
                tab === t.val ? "bg-primary text-white" : "text-foreground/40"
              }`}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
              {t.count > 0 && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${tab === t.val ? "bg-white/20" : "bg-background/20"}`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 mt-4">
        {isLoading ? (
          <div className="space-y-3">
            {Array(4).fill(0).map((_, i) => <div key={i} className="h-20 rounded-2xl shimmer" />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState isRecipe={tab === "recipe"} />
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filtered.map((fav, i) => (
                <motion.div
                  key={fav.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Link
                    to={
                      fav.item_type === "restaurant"
                        ? createPageUrl(`RestaurantDetail?id=${fav.item_id}`)
                        : createPageUrl(`RecipeDetail?menuItemId=${fav.item_id}&restaurantId=`)
                    }
                    className="flex items-center gap-3 p-3.5 bg-card rounded-2xl border border-border hover:border-primary/25 transition-all active:scale-[0.98]"
                  >
                    <div className="w-14 h-14 rounded-xl bg-secondary border border-border flex items-center justify-center flex-shrink-0">
                      {fav.image_url
                        ? <img src={fav.image_url} alt="" className="w-full h-full object-cover rounded-xl" />
                        : <span className="text-2xl">{fav.item_type === "restaurant" ? "🏪" : "🍽️"}</span>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">{fav.item_name}</p>
                      {fav.restaurant_name && (
                        <p className="text-xs text-muted-foreground mt-0.5">{fav.restaurant_name}</p>
                      )}
                      <div className="flex items-center gap-1 mt-1.5">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          fav.item_type === "recipe"
                            ? "bg-chart-3/10 text-chart-3"
                            : "bg-chart-2/10 text-chart-2"
                        }`}>
                          {fav.item_type === "recipe" ? "BETTER RECIPE" : "RESTAURANT"}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <Heart className="w-4 h-4 text-primary fill-primary" />
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40" />
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