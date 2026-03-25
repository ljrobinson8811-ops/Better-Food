import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Search, Plus, Flame, TrendingUp, Zap } from "lucide-react";
import { Analytics } from "@/components/infra/analytics";
import { Dedup } from "@/components/infra/deduplication";
import { Validators } from "@/components/infra/validation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const categoryEmoji = {
  burgers: "🍔", chicken: "🍗", mexican: "🌮", pizza: "🍕",
  asian: "🍜", subs: "🥖", coffee: "☕", other: "🍽️"
};

const FILTER_CATS = [
  { label: "All",     emoji: "" },
  { label: "Burgers", emoji: "🍔" },
  { label: "Chicken", emoji: "🍗" },
  { label: "Mexican", emoji: "🌮" },
  { label: "Pizza",   emoji: "🍕" },
  { label: "Asian",   emoji: "🍜" },
  { label: "Subs",    emoji: "🥖" },
  { label: "Coffee",  emoji: "☕" },
];
const filterMap = { "All": null, "Burgers": "burgers", "Chicken": "chicken", "Mexican": "mexican", "Pizza": "pizza", "Asian": "asian", "Subs": "subs", "Coffee": "coffee" };

const STAT_BADGES = [
  { icon: Zap, label: "High Protein", color: "text-chart-3", bg: "bg-chart-3/10" },
  { icon: Flame, label: "Popular", color: "text-primary", bg: "bg-primary/10" },
  { icon: TrendingUp, label: "Trending", color: "text-chart-2", bg: "bg-chart-2/10" },
];

import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

function RestaurantTile({ restaurant, index }) {
  const badge = STAT_BADGES[index % STAT_BADGES.length];
  const initials = restaurant.name.split(/[\s']+/).filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
    >
      <Link
        to={createPageUrl(`RestaurantDetail?id=${restaurant.id}`)}
        className="block bg-card border border-border rounded-2xl p-3 active:scale-95 transition-all hover:border-primary/25 hover:shadow-md"
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center text-xl flex-shrink-0 border border-border overflow-hidden">
            {restaurant.logo_url
              ? <img src={restaurant.logo_url} alt={restaurant.name} className="w-full h-full object-cover" />
              : <span>{categoryEmoji[restaurant.category] || "🍽️"}</span>
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground truncate">{restaurant.name}</p>
            <div className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full ${badge.bg}`}>
              <badge.icon className={`w-2.5 h-2.5 ${badge.color}`} />
              <span className={`text-[9px] font-bold ${badge.color}`}>{badge.label}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground capitalize">{restaurant.category || "food"}</p>
            <p className="text-[10px] font-bold text-chart-3 mt-0.5">View Better</p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function Explore() {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [addError, setAddError] = useState("");

  const { data: rawRestaurants, isLoading, refetch } = useQuery({
    queryKey: ["restaurants"],
    queryFn: () => base44.entities.Restaurant.list("name", 100),
    initialData: [],
  });
  const restaurants = Array.isArray(rawRestaurants) ? rawRestaurants : [];

  useEffect(() => { setPage(1); }, [search, activeFilter]);

  const filtered = restaurants.filter(r => {
    const matchSearch = !search.trim() || r.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = !filterMap[activeFilter] || r.category === filterMap[activeFilter];
    return matchSearch && matchCat;
  });

  const noResults = (search.trim() || activeFilter !== "All") && filtered.length === 0;
  const paginated = filtered.slice(0, page * PAGE_SIZE);
  const hasMore   = paginated.length < filtered.length;

  const handleAddRestaurant = async () => {
    setAddError("");
    const validationErrors = Validators.restaurantName(newName);
    if (validationErrors) { setAddError(validationErrors[0]); return; }
    const exists = await Dedup.restaurantExists(newName);
    if (exists) { setAddError("This restaurant already exists."); return; }
    await base44.entities.Restaurant.create({ name: newName.trim(), is_official: false });
    Analytics.restaurantSearched(newName.trim());
    setNewName("");
    setShowAddForm(false);
    refetch();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-foreground px-5 pt-14 pb-6 rounded-b-3xl">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-background/40 text-xs font-bold uppercase tracking-widest mb-1">Explore</p>
          <h1 className="text-2xl font-black text-background">Find Fast Food</h1>
          <p className="text-background/60 text-sm mt-1">Discover better versions of your favorites</p>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative mt-4"
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
          <input
            placeholder="Search restaurants..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-12 pl-11 pr-4 bg-background/10 border border-background/20 rounded-2xl text-sm text-background placeholder:text-foreground/30 focus:outline-none focus:border-primary/60 focus:bg-background/15"
          />
        </motion.div>
      </div>

      {/* Category Pills */}
      <div className="mt-4 px-5">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {FILTER_CATS.map((cat, i) => (
            <motion.button
              key={cat.label}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 + i * 0.03 }}
              onClick={() => setActiveFilter(cat.label)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 ${
                activeFilter === cat.label
                  ? "bg-primary text-white shadow-md shadow-primary/20"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat.emoji ? `${cat.emoji} ` : ""}{cat.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Section Label */}
      <div className="px-5 mt-5 mb-3 flex items-center justify-between">
        <p className="text-base font-black text-foreground">
          {filtered.length} {activeFilter === "All" ? "Restaurants" : activeFilter}
        </p>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1.5 text-xs font-bold text-primary"
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        )}
      </div>

      {/* Restaurant List */}
      <div className="px-5 space-y-2.5">
        {isLoading ? (
          Array(8).fill(0).map((_, i) => (
            <div key={i} className="h-[68px] rounded-2xl shimmer" />
          ))
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4 text-3xl">🔍</div>
            <p className="text-sm font-semibold text-foreground">No restaurants found</p>
            <p className="text-xs text-muted-foreground mt-1">Try a different search or filter</p>
            <Button
              className="mt-4 rounded-xl bg-primary"
              onClick={() => setShowAddForm(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add this restaurant
            </Button>
          </div>
        ) : (
          <div className="space-y-2.5">
            <AnimatePresence>
              {paginated.map((r, i) => (
                <RestaurantTile key={r.id} restaurant={r} index={i} />
              ))}
            </AnimatePresence>
            {hasMore && (
              <button
                onClick={() => setPage(p => p + 1)}
                className="w-full py-3 mt-2 rounded-2xl bg-secondary text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
              >
                Load more ({filtered.length - paginated.length} remaining)
              </button>
            )}
          </div>
        )}

        {/* Add form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-card border border-border rounded-2xl p-4 overflow-hidden"
            >
              <p className="text-sm font-bold mb-3">Add a Restaurant</p>
              <div className="flex gap-2">
                <Input
                  placeholder="Restaurant name..."
                  value={newName}
                  onChange={e => { setNewName(e.target.value); setAddError(""); }}
                  className="rounded-xl"
                />
                <Button onClick={handleAddRestaurant} className="rounded-xl bg-primary flex-shrink-0">Add</Button>
                <Button variant="ghost" onClick={() => { setShowAddForm(false); setAddError(""); }} className="rounded-xl flex-shrink-0">✕</Button>
              </div>
              {addError && <p className="text-xs text-primary font-medium mt-1">{addError}</p>}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="h-4" />
    </div>
  );
}