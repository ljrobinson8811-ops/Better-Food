import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { ArrowRight, Flame } from "lucide-react";

const categoryEmoji = {
  burgers: "🍔", chicken: "🍗", mexican: "🌮", pizza: "🍕",
  asian: "🍜", subs: "🥖", coffee: "☕", other: "🍽️"
};

const categoryLabel = {
  burgers: "Burgers", chicken: "Chicken", mexican: "Mexican", pizza: "Pizza",
  asian: "Asian", subs: "Subs", coffee: "Coffee", other: "Other"
};

export default function FeaturedRestaurants({ restaurants }) {
  const safeRestaurants = Array.isArray(restaurants) ? restaurants : [];
  if (safeRestaurants.length === 0) return null;

  return (
    <div className="mt-6">
      <div className="px-5 mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-base font-black text-foreground">Popular Chains</h2>
          <p className="text-xs text-muted-foreground">Tap to see better versions</p>
        </div>
        <Link to={createPageUrl("Explore")} className="flex items-center gap-1 text-xs font-bold text-primary">
          All <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="flex gap-3 px-5 overflow-x-auto no-scrollbar pb-2">
        {safeRestaurants.slice(0, 10).map((r, i) => {
          const initials = (r.name || "").split(/[\s']+/).filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();
          return (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + i * 0.04 }}
            >
              <Link
                to={createPageUrl(`RestaurantDetail?id=${r.id}`)}
                className="flex-shrink-0 w-[120px] bg-card border border-border rounded-2xl p-3 block active:scale-95 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="w-12 h-12 rounded-xl bg-secondary border border-border flex items-center justify-center mb-2 text-xl">
                  {r.logo_url ? (
                    <img src={r.logo_url} alt={r.name} className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <span>{categoryEmoji[r.category] || "🍽️"}</span>
                  )}
                </div>
                <p className="text-xs font-bold text-foreground leading-tight truncate">{r.name}</p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-[9px] text-muted-foreground">{categoryLabel[r.category] || "Food"}</span>
                </div>
                <div className="flex items-center gap-1 mt-1.5 bg-primary/10 rounded-lg px-1.5 py-0.5 w-fit">
                  <Flame className="w-2.5 h-2.5 text-primary" />
                  <span className="text-[9px] font-bold text-primary">Better</span>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}