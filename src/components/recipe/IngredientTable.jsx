import React from "react";
import { Check, X, ArrowRight, Shuffle, ListOrdered } from "lucide-react";
import { motion } from "framer-motion";

export default function IngredientTable({ ingredients, onToggle, isPremium, view = "swaps" }) {
  if (!ingredients || ingredients.length === 0) return null;

  // ORIGINAL VIEW — clean shopping-list style
  if (view === "original") {
    return (
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="px-4 pt-4 pb-3 border-b border-border flex items-center gap-2">
          <ListOrdered className="w-4 h-4 text-chart-2" />
          <h3 className="text-sm font-black text-foreground">Original Ingredients</h3>
          <span className="ml-auto text-[9px] font-black text-muted-foreground bg-secondary px-2 py-0.5 rounded-full uppercase">
            {ingredients.length} items
          </span>
        </div>
        <div className="p-3 space-y-1.5">
          {ingredients.map((ing, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-center gap-3 p-3 bg-secondary rounded-xl"
            >
              <div className="w-2 h-2 rounded-full bg-muted-foreground/40 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground selectable-text">{ing.original}</p>
                {ing.quantity && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">{ing.quantity}</p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  // SWAPS VIEW — original → better with accept/reject toggle
  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="px-4 pt-4 pb-3 border-b border-border flex items-center gap-2">
        <Shuffle className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-black text-foreground">Healthier Swaps</h3>
        <span className="ml-auto text-[9px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase">
          {ingredients.filter(i => i.accepted !== false).length}/{ingredients.length} active
        </span>
      </div>

      <div className="p-3 space-y-2">
        {ingredients.map((ing, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.04 }}
            className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
              ing.accepted !== false
                ? "border-chart-3/20 bg-chart-3/5"
                : "border-border bg-secondary/50 opacity-60"
            }`}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-muted-foreground line-through">{ing.original}</span>
                <ArrowRight className="w-3 h-3 text-chart-3 flex-shrink-0" />
                <span className="text-[11px] font-bold text-foreground selectable-text">{ing.better}</span>
              </div>
              {ing.quantity && (
                <p className="text-[10px] text-muted-foreground mt-1">{ing.quantity}</p>
              )}
              {ing.optional_swap && (
                <p className="text-[10px] text-chart-2 mt-0.5 font-medium">
                  Alt: {ing.optional_swap}
                </p>
              )}
            </div>

            {isPremium ? (
              <button
                onClick={() => onToggle?.(i)}
                className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                  ing.accepted !== false
                    ? "bg-chart-3/20 text-chart-3 border border-chart-3/30"
                    : "bg-secondary text-muted-foreground border border-border"
                }`}
              >
                {ing.accepted !== false ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
              </button>
            ) : (
              <div className="w-7 h-7 rounded-lg bg-chart-3/15 border border-chart-3/25 flex items-center justify-center flex-shrink-0">
                <Check className="w-3.5 h-3.5 text-chart-3" />
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}