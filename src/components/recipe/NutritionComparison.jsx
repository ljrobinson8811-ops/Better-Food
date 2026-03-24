import React from "react";
import { motion } from "framer-motion";

const metrics = [
  { key: "calories", label: "Calories", unit: "kcal", color: "text-primary", barColor: "bg-primary" },
  { key: "protein", label: "Protein", unit: "g", color: "text-chart-3", barColor: "bg-chart-3", higher_is_better: true },
  { key: "carbs", label: "Carbs", unit: "g", color: "text-chart-2", barColor: "bg-chart-2" },
  { key: "fat", label: "Fat", unit: "g", color: "text-chart-5", barColor: "bg-chart-5" },
  { key: "sodium", label: "Sodium", unit: "mg", color: "text-chart-4", barColor: "bg-chart-4" },
];

function MetricBar({ label, original, better, unit, color, barColor, higherIsBetter, index }) {
  const max = Math.max(original || 0, better || 0, 1);
  const origPct = ((original || 0) / max) * 100;
  const betterPct = ((better || 0) / max) * 100;
  const diff = (original || 0) - (better || 0);
  const isImproved = higherIsBetter ? better > original : better < original;
  const pct = original > 0 ? Math.abs(Math.round((diff / original) * 100)) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06 }}
      className="space-y-2"
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-muted-foreground">{label}</span>
        <div className="flex items-center gap-2">
          {isImproved && pct > 0 && (
            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
              higherIsBetter ? "bg-chart-3/15 text-chart-3" : "bg-chart-3/15 text-chart-3"
            }`}>
              {higherIsBetter ? "+" : "-"}{pct}%
            </span>
          )}
          <span className={`text-xs font-black ${color}`}>
            {better ?? "—"}{unit && ` ${unit}`}
          </span>
        </div>
      </div>

      <div className="space-y-1">
        {/* Original bar */}
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-muted-foreground/60 w-12 text-right">Original</span>
          <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-border rounded-full" style={{ width: `${origPct}%` }} />
          </div>
          <span className="text-[9px] text-muted-foreground/60 w-10">{original ?? "—"}</span>
        </div>
        {/* Better bar */}
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-muted-foreground/60 w-12 text-right">Better</span>
          <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${betterPct}%` }}
              transition={{ delay: 0.3 + index * 0.06, duration: 0.7, ease: "easeOut" }}
              className={`h-full ${barColor} rounded-full`}
            />
          </div>
          <span className={`text-[9px] font-bold w-10 ${color}`}>{better ?? "—"}</span>
        </div>
      </div>
    </motion.div>
  );
}

export default function NutritionComparison({ menuItem, recipe }) {
  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="px-4 pt-4 pb-3 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-black text-foreground">Nutrition Breakdown</h3>
        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">Original vs Better</span>
      </div>
      <div className="p-4 space-y-4">
        {metrics.map((m, i) => (
          <MetricBar
            key={m.key}
            label={m.label}
            original={menuItem?.[`original_${m.key}`]}
            better={recipe?.[`better_${m.key}`]}
            unit={m.unit}
            color={m.color}
            barColor={m.barColor}
            higherIsBetter={m.higher_is_better}
            index={i}
          />
        ))}
      </div>
    </div>
  );
}