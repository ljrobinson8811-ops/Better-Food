import React from "react";

const levels = {
  1: { label: "Beginner", color: "bg-chart-3/15 text-chart-3 border-chart-3/25" },
  2: { label: "Basic", color: "bg-chart-2/15 text-chart-2 border-chart-2/25" },
  3: { label: "Intermediate", color: "bg-chart-4/15 text-chart-4 border-chart-4/25" },
  4: { label: "Advanced", color: "bg-primary/15 text-primary border-primary/25" },
};

export default function DifficultyBadge({ level }) {
  const info = levels[level] || levels[1];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-wider ${info.color}`}>
      {"●".repeat(level)}{"○".repeat(4 - level)} {info.label}
    </span>
  );
}