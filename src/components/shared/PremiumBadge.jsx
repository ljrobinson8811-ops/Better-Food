import React from "react";
import { Crown, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function PremiumBadge({ small = false, feature = "" }) {
  if (small) {
    return (
      <span className="inline-flex items-center gap-1 bg-chart-4/15 border border-chart-4/25 text-chart-4 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider">
        <Crown className="w-2.5 h-2.5" />
        PRO
      </span>
    );
  }

  return (
    <div className="relative overflow-hidden bg-foreground rounded-2xl p-6">
      <div className="absolute inset-0 opacity-[0.06]" style={{
        backgroundImage: "radial-gradient(circle at 80% 20%, hsl(38 95% 54%) 0%, transparent 60%)"
      }} />
      <div className="relative text-center">
        <div className="w-14 h-14 rounded-2xl bg-chart-4/20 border border-chart-4/30 flex items-center justify-center mx-auto mb-3">
          <Lock className="w-6 h-6 text-chart-4" />
        </div>
        <p className="text-[11px] font-black text-foreground/30 uppercase tracking-widest mb-1">Premium Feature</p>
        <h4 className="text-base font-black text-background">{feature || "Unlock This Feature"}</h4>
        <p className="text-xs text-foreground/40 mt-1.5 mb-4">
          Get guided cooking, pantry tracking, portion scaling & more
        </p>
        <Link
          to={createPageUrl("Profile")}
          className="inline-flex items-center gap-2 bg-primary text-white rounded-xl px-6 py-2.5 text-sm font-black"
        >
          <Crown className="w-3.5 h-3.5" />
          Upgrade — $4.99/mo
        </Link>
        <p className="text-[10px] text-foreground/25 mt-2">7-day free trial included</p>
      </div>
    </div>
  );
}