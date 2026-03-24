import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Flame, TrendingUp, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Dedup } from "@/infra/deduplication";
import { Validators } from "@/infra/validation";
import { Analytics } from "@/components/infra/analytics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const FILTER_CATEGORIES = [
  { label: "All", value: null, emoji: "" },
  { label: "Burgers", value: "burgers", emoji: "🍔" },
  { label: "Chicken", value: "chicken", emoji: "🍗" },
  { label: "Mexican", value: "mexican", emoji: "🌮" },
  { label: "Pizza", value: "pizza", emoji: "🍕" },
  { label: "Asian", value: "asian", emoji: "🍜" },
  { label: "Subs", value: "subs", emoji: "🥖" },
  { label: "Coffee", value: "coffee", emoji: "☕" },
];

const CATEGORY_EMOJI = {
  burgers: "🍔",
  chicken: "🍗",
  mexican: "🌮",
  pizza: "🍕",
  asian: "🍜",
  subs: "🥖",
  coffee: "☕",
  other: "🍽️",
};

const STAT_BADGES = [
  { icon: Zap, label: "High Protein", color: "text-chart-3", bg: "bg-chart-3/10" },
  { icon: Flame, label: "Popular", color: "text-primary", bg: "bg-primary/10" },
  { icon: TrendingUp, label: "Trending", color: "text-chart-2", bg: "bg-chart-2/10" },
];

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function RestaurantTile({ restaurant, index }) {
  const badge = STAT_BADGES[index % STAT_BADGES.length];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.03 }}
    >
      <Link
        to={createPageUrl(`RestaurantDetail?id=${restaurant.id}`)}
        className="block rounded-2xl border border-border bg-card p-3 transition-all hover:border-primary/25 active:scale-[0.98]"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-secondary text-xl">
            {restaurant.logo_url ? (
              <img
                src={restaurant.logo_url}
                alt={restaurant.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <span>{CATEGORY_EMOJI[restaurant.category] || "🍽️"}</span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-foreground">
              {restaurant.name}
            </p>

            <div className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${badge.bg}`}>
              <badge.icon className={`h-2.5 w-2.5 ${badge.color}`} />
              <span className={`text-[9px] font-bold ${badge.color}`}>
                {badge.label}
              </span>
            </div>
          </div>

          <div className="text-right">
            <p className="text-[10px] capitalize text-muted-foreground">
              {restaurant.category || "food"}
            </p>
            <p className="mt-0.5 text-[10px] font-bold text-chart-3">
              View Better
            </p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function Explore() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRestaurantName, setNewRestaurantName] = useState("");
  const [addError, setAddError] = useState("");
  const [adding, setAdding] = useState(false);

  const { data: restaurants = [], isLoading } = useQuery({
    queryKey: ["restaurants"],
    queryFn: async () => {
      const result = await base44.entities.Restaurant.list("name", 200);
      return asArray(result);
    },
    staleTime: 60 * 1000,
    initialData: [],
  });

  const activeFilterValue =
    FILTER_CATEGORIES.find((item) => item.label === activeFilter)?.value ?? null;

  const filteredRestaurants = useMemo(() => {
    return restaurants.filter((restaurant) => {
      const matchesSearch =
        !search.trim() ||
        restaurant.name?.toLowerCase().includes(search.trim().toLowerCase());

      const matchesFilter =
        !activeFilterValue || restaurant.category === activeFilterValue;

      return matchesSearch && matchesFilter;
    });
  }, [restaurants, search, activeFilterValue]);

  const handleAddRestaurant = async () => {
    setAddError("");

    const validationErrors = Validators.restaurantName(newRestaurantName);
    if (validationErrors) {
      setAddError(validationErrors[0]);
      return;
    }

    setAdding(true);

    try {
      const exists = await Dedup.restaurantExists(newRestaurantName);
      if (exists) {
        setAddError("This restaurant already exists.");
        return;
      }

      await base44.entities.Restaurant.create({
        name: newRestaurantName.trim(),
        category: "other",
        is_official: false,
      });

      Analytics.restaurantSearched(newRestaurantName.trim());
      setNewRestaurantName("");
      setShowAddForm(false);
      await queryClient.invalidateQueries({ queryKey: ["restaurants"] });
    } catch (error) {
      setAddError(error?.message || "Failed to add restaurant.");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="rounded-b-3xl bg-foreground px-5 pb-6 pt-14">
        <p className="mb-1 text-xs font-bold uppercase tracking-widest text-background/40">
          Explore
        </p>
        <h1 className="text-2xl font-black text-background">Find Fast Food</h1>
        <p className="mt-1 text-sm text-background/60">
          Discover better versions of your favorites
        </p>

        <div className="relative mt-4">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-background/35" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search restaurants..."
            className="h-12 w-full rounded-2xl border border-background/20 bg-background/10 pl-11 pr-4 text-sm text-background placeholder:text-background/35 focus:border-primary/60 focus:bg-background/15 focus:outline-none"
          />
        </div>
      </div>

      <div className="mt-4 px-5">
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          {FILTER_CATEGORIES.map((category, index) => (
            <motion.button
              key={category.label}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.12 + index * 0.03 }}
              onClick={() => setActiveFilter(category.label)}
              className={`flex-shrink-0 whitespace-nowrap rounded-2xl px-4 py-2 text-xs font-bold transition-all ${
                activeFilter === category.label
                  ? "bg-primary text-white shadow-md shadow-primary/20"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              {category.emoji ? `${category.emoji} ` : ""}
              {category.label}
            </motion.button>
          ))}
        </div>
      </div>

      <div className="mb-3 mt-5 flex items-center justify-between px-5">
        <p className="text-base font-black text-foreground">
          {filteredRestaurants.length}{" "}
          {activeFilter === "All" ? "Restaurants" : activeFilter}
        </p>

        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1.5 text-xs font-bold text-primary"
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </button>
        )}
      </div>

      <div className="space-y-2.5 px-5">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="shimmer h-[68px] rounded-2xl" />
          ))
        ) : filteredRestaurants.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary text-3xl">
              🔍
            </div>
            <p className="text-sm font-semibold text-foreground">
              No restaurants found
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Try a different search or add it yourself
            </p>

            <Button
              className="mt-4 rounded-xl bg-primary"
              onClick={() => setShowAddForm(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add this restaurant
            </Button>
          </div>
        ) : (
          <AnimatePresence>
            {filteredRestaurants.map((restaurant, index) => (
              <RestaurantTile
                key={restaurant.id}
                restaurant={restaurant}
                index={index}
              />
            ))}
          </AnimatePresence>
        )}

        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden rounded-2xl border border-border bg-card p-4"
            >
              <p className="mb-3 text-sm font-bold text-foreground">
                Add a Restaurant
              </p>

              <div className="flex gap-2">
                <Input
                  value={newRestaurantName}
                  onChange={(event) => {
                    setNewRestaurantName(event.target.value);
                    setAddError("");
                  }}
                  placeholder="Restaurant name..."
                  className="rounded-xl"
                />

                <Button
                  onClick={handleAddRestaurant}
                  className="flex-shrink-0 rounded-xl bg-primary"
                  disabled={adding}
                >
                  {adding ? "..." : "Add"}
                </Button>

                <Button
                  variant="ghost"
                  className="flex-shrink-0 rounded-xl"
                  onClick={() => {
                    setShowAddForm(false);
                    setAddError("");
                    setNewRestaurantName("");
                  }}
                >
                  ✕
                </Button>
              </div>

              {addError ? (
                <p className="mt-2 text-xs font-medium text-primary">{addError}</p>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="h-4" />
    </div>
  );
}