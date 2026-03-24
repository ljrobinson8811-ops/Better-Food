import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Search, Crown, Heart, Package, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

const actions = [
  { icon: Search, label: "Find Food", page: "Explore", color: "text-chart-2", bg: "bg-chart-2/10 border-chart-2/20" },
  { icon: Crown, label: "Top Picks", page: "Explore", color: "text-chart-4", bg: "bg-chart-4/10 border-chart-4/20" },
  { icon: Heart, label: "Saved", page: "Favorites", color: "text-primary", bg: "bg-primary/10 border-primary/20" },
  { icon: Package, label: "Pantry", page: "Profile", color: "text-chart-3", bg: "bg-chart-3/10 border-chart-3/20" },
  { icon: TrendingUp, label: "Trending", page: "Explore", color: "text-chart-5", bg: "bg-chart-5/10 border-chart-5/20" },
];

export default function QuickActions() {
  return (
    <div className="px-5 mt-6">
      <motion.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-base font-black text-foreground mb-3"
      >
        Quick Actions
      </motion.h2>
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
        {actions.map((a, i) => (
          <motion.div
            key={a.label}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.35 + i * 0.05 }}
          >
            <Link
              to={createPageUrl(a.page)}
              className={`flex flex-col items-center gap-2 w-[68px] border rounded-2xl p-3 active:scale-95 transition-transform ${a.bg}`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${a.color} bg-current/10`}>
                <a.icon className={`w-4 h-4 ${a.color}`} />
              </div>
              <span className="text-[10px] font-bold text-foreground text-center leading-tight">{a.label}</span>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}