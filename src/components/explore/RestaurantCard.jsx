import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";

export default function RestaurantCard({ restaurant, index = 0 }) {
  const initials = restaurant.name
    .split(/[\s']/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0])
    .join("")
    .toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
    >
      <Link
        to={createPageUrl(`RestaurantDetail?id=${restaurant.id}`)}
        className="flex flex-col items-center gap-2 group"
      >
        <div className="w-16 h-16 rounded-2xl bg-secondary border border-border flex items-center justify-center overflow-hidden group-hover:border-primary/30 transition-all duration-200 group-hover:shadow-lg group-hover:shadow-primary/5">
          {restaurant.logo_url ? (
            <img
              src={restaurant.logo_url}
              alt={restaurant.name}
              className="w-full h-full object-cover rounded-2xl"
            />
          ) : (
            <span className="text-lg font-bold text-muted-foreground">{initials}</span>
          )}
        </div>
        <span className="text-xs text-center font-medium text-foreground leading-tight max-w-[72px] truncate">
          {restaurant.name}
        </span>
      </Link>
    </motion.div>
  );
}