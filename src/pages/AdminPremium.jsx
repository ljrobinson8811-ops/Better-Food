import React from "react";
import AdminGuard from "@/components/admin/AdminGuard";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Crown, Lock, Unlock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { motion } from "framer-motion";

export default function AdminPremium() {
  const { data: usage } = useQuery({
    queryKey: ["premiumAll"],
    queryFn: () => base44.entities.PremiumFeatureUsage.list("-created_date", 500),
    initialData: [],
  });

  const blocked = usage.filter(u => u.action === "blocked");
  const unlocked = usage.filter(u => u.action === "unlocked");

  const featureBlockedCounts = blocked.reduce((acc, u) => {
    acc[u.feature_name] = (acc[u.feature_name] || 0) + 1;
    return acc;
  }, {});
  const chartData = Object.entries(featureBlockedCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name: name.replace(/_/g, " "), count }));

  const conversionRate = usage.length > 0
    ? ((usage.filter(u => u.converted_to_premium).length / usage.length) * 100).toFixed(1)
    : 0;

  return (
    <AdminGuard>
      <div className="min-h-screen bg-background pb-8">
        <div className="bg-foreground rounded-b-3xl px-5 pt-14 pb-6">
          <Link to={createPageUrl("AdminDashboard")} className="flex items-center gap-2 text-foreground/40 mb-4">
            <ArrowLeft className="w-4 h-4" /> Admin
          </Link>
          <h1 className="text-2xl font-black text-background">Premium Usage</h1>
          <p className="text-foreground/35 text-sm mt-1">Feature gating & conversion tracking</p>
        </div>

        <div className="px-5 mt-5 space-y-5">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Blocked", value: blocked.length, color: "text-primary", icon: Lock },
              { label: "Unlocked", value: unlocked.length, color: "text-chart-3", icon: Unlock },
              { label: "Conv. Rate", value: `${conversionRate}%`, color: "text-chart-4", icon: Crown },
            ].map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className="bg-card border border-border rounded-2xl p-3 text-center">
                <s.icon className={`w-4 h-4 ${s.color} mx-auto mb-1.5`} />
                <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </motion.div>
            ))}
          </div>

          <div className="bg-card border border-border rounded-2xl p-4">
            <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-4">Most Blocked Features</p>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 8, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 8, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "11px" }} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {chartData.map((_, i) => <Cell key={i} fill="hsl(var(--primary))" />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No blocked feature data yet</p>
            )}
          </div>

          <div className="bg-card border border-border rounded-2xl p-4">
            <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-3">Recent Feature Attempts</p>
            {usage.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data yet</p>
            ) : (
              <div className="space-y-2">
                {usage.slice(0, 10).map(u => (
                  <div key={u.id} className="flex items-center justify-between">
                    <span className="text-xs font-medium text-foreground capitalize">{u.feature_name?.replace(/_/g, " ")}</span>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${u.action === "blocked" ? "bg-primary/15 text-primary" : "bg-chart-3/15 text-chart-3"}`}>
                      {u.action}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}