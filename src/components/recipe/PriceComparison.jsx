import React from "react";
import { TrendingDown, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function PriceComparison({ originalPrice, homemadePrice, savings }) {
  const pctSaved = originalPrice > 0 ? Math.round((savings / originalPrice) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl border border-border overflow-hidden"
    >
      <div className="flex items-center gap-2 px-4 pt-4 pb-3 border-b border-border">
        <TrendingDown className="w-4 h-4 text-chart-3" />
        <h3 className="text-sm font-black text-foreground">Price Comparison</h3>
        {pctSaved > 0 && (
          <span className="ml-auto text-[10px] font-black bg-chart-3/15 text-chart-3 border border-chart-3/25 px-2 py-0.5 rounded-full uppercase">
            Save {pctSaved}%
          </span>
        )}
      </div>

      <div className="p-4 flex items-center gap-3">
        {/* Restaurant */}
        <div className="flex-1 bg-secondary rounded-xl p-3 text-center">
          <p className="text-[9px] font-black text-muted-foreground uppercase tracking-wider mb-1">Restaurant</p>
          <p className="text-xl font-black text-foreground line-through opacity-60">${(originalPrice || 0).toFixed(2)}</p>
        </div>

        <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />

        {/* Homemade */}
        <div className="flex-1 bg-chart-3/8 border border-chart-3/15 rounded-xl p-3 text-center">
          <p className="text-[9px] font-black text-chart-3 uppercase tracking-wider mb-1">Homemade</p>
          <p className="text-xl font-black text-chart-3">${(homemadePrice || 0).toFixed(2)}</p>
        </div>

        {/* Savings */}
        <div className="flex-1 bg-chart-4/8 border border-chart-4/15 rounded-xl p-3 text-center">
          <p className="text-[9px] font-black text-chart-4 uppercase tracking-wider mb-1">You Save</p>
          <p className="text-xl font-black text-chart-4">${(savings || 0).toFixed(2)}</p>
        </div>
      </div>
    </motion.div>
  );
}