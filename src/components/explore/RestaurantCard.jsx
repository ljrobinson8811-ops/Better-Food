import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

import { createPageUrl } from "@/utils";

function getInitials(name = "") {
  return String(name)
    .split(/[\s']+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

export default function RestaurantCard({ restaurant, index = 0 }) {
  if (!restaurant?.id || !restaurant?.name) {
    return null;
  }

  const initials = getInitials(restaurant.name);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.03, duration: 0.25 }}
    >
      <Link
        to={createPageUrl(
          `RestaurantDetail?id=${encodeURIComponent(restaurant.id)}`
        )}
        className="group flex flex-col items-center gap-2"
      >
        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-border bg-secondary transition-all duration-200 group-hover:border-primary/30 group-hover:shadow-lg group-hover:shadow-primary/5">
          {restaurant.logo_url ? (
            <img
              src={restaurant.logo_url}
              alt={restaurant.name}
              className="h-full w-full rounded-2xl object-cover"
            />
          ) : (
            <span className="text-lg font-bold text-muted-foreground">
              {initials}
            </span>
          )}
        </div>

        <span className="max-w-[72px] truncate text-center text-xs font-medium leading-tight text-foreground">
          {restaurant.name}
        </span>
      </Link>
    </motion.div>
  );
}