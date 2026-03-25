import React from "react";
import { motion } from "framer-motion";
import { Flame, DollarSign, Zap, TrendingDown, Award, Droplets } from "lucide-react";

function RingProgress({ value, max, color, size = 56 }) {
  const pct = Math.min(1, (value || 0) / (max || 1));
  const r = 20;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct);

  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className="rotate-[-90deg]">
      <circle cx="24" cy="24" r={r} fill="none" stroke="currentColor" strokeWidth="4" className="text-border opacity-40" />
      <circle
        cx="24" cy="24" r={r}
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 1s ease" }}
      />
    </svg>
  );
}

function StatWidget({ icon: IconComponent, label, value, unit, color, bgColor, max, delay = 0 }) {
  const Icon = IconComponent;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.4 }}
      className="bg-card rounded-2xl border border-border p-3 flex flex-col gap-2 relative overflow-hidden"
    >
      <div className={`absolute top-0 right-0 w-12 h-12 rounded-full ${bgColor} opacity-10 -translate-y-4 translate-x-4`} />
      <div className="flex items-center justify-between">
        <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${bgColor}/15`}>
          <Icon className={`w-3.5 h-3.5 ${color}`} />
        </div>
        <RingProgress value={value} max={max} color={color.replace("text-", "hsl(var(--")} />
      </div>
      <div>
        <p className="text-xl font-black text-foreground leading-none">
          {typeof value === "number" ? value.toLocaleString() : value}
          <span className="text-xs font-semibold text-muted-foreground ml-1">{unit}</span>
        </p>
        <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">{label}</p>
      </div>
    </motion.div>
  );
}

function StreakBadge({ days }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 }}
      className="flex items-center gap-3 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-2xl px-4 py-3"
    >
      <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
        <Award className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1">
        <p className="text-xs font-bold text-foreground">
          {days > 0 ? `🔥 ${days}-Week Streak!` : "Start your streak this week!"}
        </p>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {days > 0 ? "Keep choosing better food" : "Make your first better meal"}
        </p>
      </div>
      <div className="text-right">
        <p className="text-2xl font-black text-primary">{days}</p>
        <p className="text-[9px] text-muted-foreground uppercase tracking-wider">weeks</p>
      </div>
    </motion.div>
  );
}

export default function FitnessDashboard({ stats }) {
  const widgets = [
    {
      icon: Flame,
      label: "Calories Avoided",
      value: stats?.estimated_calories_avoided || 0,
      unit: "kcal",
      color: "text-chart-1",
      bgColor: "bg-red-500",
      max: 2000,
    },
    {
      icon: Zap,
      label: "Protein Gained",
      value: Math.round((stats?.estimated_calories_avoided || 0) * 0.03),
      unit: "g",
      color: "text-chart-3",
      bgColor: "bg-green-500",
      max: 150,
    },
    {
      icon: DollarSign,
      label: "Money Saved",
      value: stats?.estimated_money_saved || 0,
      unit: "$",
      color: "text-chart-4",
      bgColor: "bg-yellow-500",
      max: 100,
    },
    {
      icon: TrendingDown,
      label: "Sodium Reduced",
      value: Math.round((stats?.estimated_calories_avoided || 0) * 0.4),
      unit: "mg",
      color: "text-chart-2",
      bgColor: "bg-blue-500",
      max: 3000,
    },
  ];

  return (
    <div className="px-5 mt-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="flex items-center justify-between mb-3"
      >
        <div>
          <h2 className="text-base font-black text-foreground">Your Impact</h2>
          <p className="text-xs text-muted-foreground">Lifetime Better Food stats</p>
        </div>
        <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">All Time</span>
      </motion.div>

      <StreakBadge days={stats?.cooking_streak || 0} />

      <div className="grid grid-cols-2 gap-3 mt-3">
        {widgets.map((w, i) => (
          <StatWidget key={w.label} {...w} delay={0.2 + i * 0.06} />
        ))}
      </div>

      {/* Macro bar */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-3 bg-card rounded-2xl border border-border p-4"
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-foreground">Better Macro Balance</p>
          <span className="text-[10px] text-muted-foreground">vs fast food avg</span>
        </div>
        <div className="space-y-2.5">
          {[
            { label: "Protein", pct: 72, color: "bg-chart-3", saved: "+24g avg" },
            { label: "Calories", pct: 45, color: "bg-chart-1", saved: "-580 avg" },
            { label: "Sodium", pct: 38, color: "bg-chart-2", saved: "-890mg avg" },
          ].map(m => (
            <div key={m.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-medium text-muted-foreground">{m.label}</span>
                <span className="text-[11px] font-bold text-foreground">{m.saved}</span>
              </div>
              <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${m.pct}%` }}
                  transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" }}
                  className={`h-full ${m.color} rounded-full`}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}