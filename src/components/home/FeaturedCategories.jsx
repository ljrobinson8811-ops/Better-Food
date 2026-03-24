import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { Zap, TrendingDown, DollarSign, Target, Users } from "lucide-react";

const categories = [
  {
    icon: Zap,
    title: "High Protein Remakes",
    subtitle: "30g+ protein per serving",
    gradient: "from-chart-3/20 via-chart-3/5 to-transparent",
    border: "border-chart-3/25",
    iconColor: "text-chart-3",
    badge: "TOP PICKS",
    badgeColor: "bg-chart-3/20 text-chart-3",
  },
  {
    icon: TrendingDown,
    title: "Lowest Calorie Swaps",
    subtitle: "Cut 500+ calories easily",
    gradient: "from-primary/20 via-primary/5 to-transparent",
    border: "border-primary/25",
    iconColor: "text-primary",
    badge: "BEST FOR CUTS",
    badgeColor: "bg-primary/20 text-primary",
  },
  {
    icon: DollarSign,
    title: "Best Value Meals",
    subtitle: "Save $8+ per serving",
    gradient: "from-chart-4/20 via-chart-4/5 to-transparent",
    border: "border-chart-4/25",
    iconColor: "text-chart-4",
    badge: "SAVE MONEY",
    badgeColor: "bg-chart-4/20 text-chart-4",
  },
  {
    icon: Target,
    title: "Weight Loss Picks",
    subtitle: "Macro-optimized meals",
    gradient: "from-chart-2/20 via-chart-2/5 to-transparent",
    border: "border-chart-2/25",
    iconColor: "text-chart-2",
    badge: "TRANSFORMATION",
    badgeColor: "bg-chart-2/20 text-chart-2",
  },
  {
    icon: Users,
    title: "Community Favorites",
    subtitle: "Most remade this week",
    gradient: "from-chart-5/20 via-chart-5/5 to-transparent",
    border: "border-chart-5/25",
    iconColor: "text-chart-5",
    badge: "TRENDING",
    badgeColor: "bg-chart-5/20 text-chart-5",
  },
];

export default function FeaturedCategories() {
  return (
    <div className="mt-6">
      <div className="px-5 mb-3">
        <h2 className="text-base font-black text-foreground">Better Food Goals</h2>
        <p className="text-xs text-muted-foreground">Remakes built around your goals</p>
      </div>
      <div className="flex gap-3 px-5 overflow-x-auto no-scrollbar pb-2">
        {categories.map((cat, i) => (
          <motion.div
            key={cat.title}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + i * 0.06 }}
          >
            <Link
              to={createPageUrl("Explore")}
              className={`flex-shrink-0 w-[160px] bg-gradient-to-br ${cat.gradient} border ${cat.border} rounded-2xl p-4 block active:scale-95 transition-transform`}
            >
              <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${cat.badgeColor}`}>
                {cat.badge}
              </span>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mt-3 bg-current/10`}>
                <cat.icon className={`w-5 h-5 ${cat.iconColor}`} />
              </div>
              <h3 className="text-sm font-bold text-foreground mt-2 leading-tight">{cat.title}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">{cat.subtitle}</p>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}