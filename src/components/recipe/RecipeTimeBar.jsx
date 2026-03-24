import React from "react";
import { Clock, ChefHat, Timer } from "lucide-react";
import { motion } from "framer-motion";

export default function RecipeTimeBar({ prepTime, cookTime }) {
  const total = (prepTime || 0) + (cookTime || 0);
  if (!total) return null;

  const items = [
    { label: "Prep", value: prepTime, icon: Clock, color: "text-chart-2", bg: "bg-chart-2/8 border-chart-2/20" },
    { label: "Cook", value: cookTime, icon: ChefHat, color: "text-primary", bg: "bg-primary/8 border-primary/20" },
    { label: "Total", value: total, icon: Timer, color: "text-chart-3", bg: "bg-chart-3/8 border-chart-3/20" },
  ];

  return (
    <div className="flex gap-2.5">
      {items.map((item, i) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }}
          className={`flex-1 rounded-2xl border p-3 text-center ${item.bg}`}
        >
          <item.icon className={`w-4 h-4 ${item.color} mx-auto mb-1`} />
          <p className={`text-lg font-black ${item.color} leading-none`}>
            {item.value || "—"}
          </p>
          <p className="text-[9px] text-muted-foreground font-medium mt-0.5">min</p>
          <p className="text-[10px] text-muted-foreground font-bold">{item.label}</p>
        </motion.div>
      ))}
    </div>
  );
}