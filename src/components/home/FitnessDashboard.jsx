import React from "react";
import { motion } from "framer-motion";
import {
  Flame,
  DollarSign,
  Zap,
  TrendingDown,
  Award,
} from "lucide-react";

function RingProgress({
  value = 0,
  max = 1,
  strokeClassName = "text-primary",
  size = 56,
}) {
  const progress = Math.min(1, Math.max(0, value / Math.max(max, 1)));
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      className="rotate-[-90deg]"
    >
      <circle
        cx="24"
        cy="24"
        r={radius}
        fill="none"
        strokeWidth="4"
        className="text-border opacity-40"
        stroke="currentColor"
      />
      <circle
        cx="24"
        cy="24"
        r={radius}
        fill="none"
        strokeWidth="4"
        strokeLinecap="round"
        className={strokeClassName}
        stroke="currentColor"
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        style={{ transition: "stroke-dashoffset 0.8s ease" }}
      />
    </svg>
  );
}

function StatWidget({
  icon: Icon,
  label,
  value,
  unit,
  colorClass,
  bubbleClass,
  ringClass,
  max,
  delay = 0,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.3 }}
      className="relative overflow-hidden rounded-2xl border border-border bg-card p-3"
    >
      <div className={`absolute right-0 top-0 h-12 w-12 translate-x-4 -translate-y-4 rounded-full opacity-10 ${bubbleClass}`} />

      <div className="flex items-center justify-between">
        <div className={`flex h-7 w-7 items-center justify-center rounded-xl ${bubbleClass}/15`}>
          <Icon className={`h-3.5 w-3.5 ${colorClass}`} />
        </div>

        <RingProgress
          value={value}
          max={max}
          strokeClassName={ringClass}
        />
      </div>

      <div className="mt-2">
        <p className="leading-none text-foreground">
          <span className="text-xl font-black">
            {typeof value === "number" ? value.toLocaleString() : value}
          </span>
          <span className="ml-1 text-xs font-semibold text-muted-foreground">
            {unit}
          </span>
        </p>
        <p className="mt-0.5 text-[10px] font-medium text-muted-foreground">
          {label}
        </p>
      </div>
    </motion.div>
  );
}

function StreakBadge({ weeks = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.25 }}
      className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-4 py-3"
    >
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/15">
        <Award className="h-5 w-5 text-primary" />
      </div>

      <div className="flex-1">
        <p className="text-xs font-bold text-foreground">
          {weeks > 0 ? `🔥 ${weeks}-Week Streak` : "Start your streak this week"}
        </p>
        <p className="mt-0.5 text-[10px] text-muted-foreground">
          {weeks > 0
            ? "Keep choosing better food"
            : "Make your first better meal"}
        </p>
      </div>

      <div className="text-right">
        <p className="text-2xl font-black text-primary">{weeks}</p>
        <p className="text-[9px] uppercase tracking-wider text-muted-foreground">
          weeks
        </p>
      </div>
    </motion.div>
  );
}

export default function FitnessDashboard({ stats = {} }) {
  const caloriesAvoided = Number(stats.estimated_calories_avoided || 0);
  const moneySaved = Number(stats.estimated_money_saved || 0);
  const proteinGained = Math.round(caloriesAvoided * 0.03);
  const sodiumReduced = Math.round(caloriesAvoided * 0.4);
  const streakWeeks = Number(stats.cooking_streak || 0);

  const widgets = [
    {
      icon: Flame,
      label: "Calories Avoided",
      value: caloriesAvoided,
      unit: "kcal",
      colorClass: "text-primary",
      bubbleClass: "bg-red-500",
      ringClass: "text-primary",
      max: 2000,
    },
    {
      icon: Zap,
      label: "Protein Gained",
      value: proteinGained,
      unit: "g",
      colorClass: "text-chart-3",
      bubbleClass: "bg-green-500",
      ringClass: "text-chart-3",
      max: 150,
    },
    {
      icon: DollarSign,
      label: "Money Saved",
      value: Number(moneySaved.toFixed(0)),
      unit: "$",
      colorClass: "text-chart-4",
      bubbleClass: "bg-yellow-500",
      ringClass: "text-chart-4",
      max: 100,
    },
    {
      icon: TrendingDown,
      label: "Sodium Reduced",
      value: sodiumReduced,
      unit: "mg",
      colorClass: "text-chart-2",
      bubbleClass: "bg-blue-500",
      ringClass: "text-chart-2",
      max: 3000,
    },
  ];

  return (
    <div className="mt-6 px-5">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="mb-3 flex items-center justify-between"
      >
        <div>
          <h2 className="text-base font-black text-foreground">Your Impact</h2>
          <p className="text-xs text-muted-foreground">
            Lifetime Better Food stats
          </p>
        </div>

        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
          All Time
        </span>
      </motion.div>

      <StreakBadge weeks={streakWeeks} />

      <div className="mt-3 grid grid-cols-2 gap-3">
        {widgets.map((widget, index) => (
          <StatWidget
            key={widget.label}
            {...widget}
            delay={0.18 + index * 0.05}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="mt-3 rounded-2xl border border-border bg-card p-4"
      >
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-bold text-foreground">
            Better Macro Balance
          </p>
          <span className="text-[10px] text-muted-foreground">
            vs fast food avg
          </span>
        </div>

        <div className="space-y-2.5">
          {[
            { label: "Protein", pct: 72, barClass: "bg-chart-3", saved: "+24g avg" },
            { label: "Calories", pct: 45, barClass: "bg-primary", saved: "-580 avg" },
            { label: "Sodium", pct: 38, barClass: "bg-chart-2", saved: "-890mg avg" },
          ].map((metric, index) => (
            <div key={metric.label}>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[11px] font-medium text-muted-foreground">
                  {metric.label}
                </span>
                <span className="text-[11px] font-bold text-foreground">
                  {metric.saved}
                </span>
              </div>

              <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${metric.pct}%` }}
                  transition={{
                    delay: 0.5 + index * 0.08,
                    duration: 0.7,
                    ease: "easeOut",
                  }}
                  className={`h-full rounded-full ${metric.barClass}`}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}