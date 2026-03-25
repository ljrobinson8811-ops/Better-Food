import React from "react";
import AdminGuard from "../components/admin/AdminGuard.jsx";
import { base44 } from "../api/base44Client.js";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { ArrowLeft } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

export default function AdminAnalytics() {
  const { data: events = [] } = useQuery({
    queryKey: ["analyticsAll"],
    queryFn: () => base44.entities.UserAnalytics.list("-created_date", 500),
    initialData: [],
  });

  const { data: premiumUsage = [] } = useQuery({
    queryKey: ["premiumUsage"],
    queryFn: () => base44.entities.PremiumFeatureUsage.list("-created_date", 200),
    initialData: [],
  });

  const eventCounts = events.reduce((acc, e) => {
    acc[e.event_name] = (acc[e.event_name] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.entries(eventCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({ name: name.replace(/_/g, " "), count }));

  const attempted = premiumUsage.filter((p) => p.action === "attempted").length;
  const blocked = premiumUsage.filter((p) => p.action === "blocked").length;
  const converted = premiumUsage.filter((p) => p.converted_to_premium).length;

  const featureCounts = premiumUsage.reduce((acc, e) => {
    if (e.action === "blocked") acc[e.feature_name] = (acc[e.feature_name] || 0) + 1;
    return acc;
  }, {});

  return (
    <AdminGuard>
      <div className="min-h-screen bg-background pb-8">
        <div className="bg-foreground rounded-b-3xl px-5 pt-14 pb-6">
          <Link to={createPageUrl("AdminDashboard")} className="flex items-center gap-2 text-foreground/40 mb-4">
            <ArrowLeft className="w-4 h-4" /> Admin
          </Link>
          <h1 className="text-2xl font-black text-background">User Analytics</h1>
          <p className="text-foreground/35 text-sm mt-1">{events.length} events tracked</p>
        </div>

        <div className="px-5 mt-5 space-y-5">
          <div className="bg-card border border-border rounded-2xl p-4">
            <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-4">Top Events</p>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 8, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 8, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "11px" }} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={`hsl(var(--chart-${(i % 5) + 1}))`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No events yet</p>
            )}
          </div>

          <div className="bg-card border border-border rounded-2xl p-4">
            <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-4">Premium Funnel</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Attempted", value: attempted, color: "text-chart-2" },
                { label: "Blocked", value: blocked, color: "text-primary" },
                { label: "Converted", value: converted, color: "text-chart-3" },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                  <p className="text-[10px] text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {Object.keys(featureCounts).length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-4">
              <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-3">Most Blocked Features</p>
              <div className="space-y-2">
                {Object.entries(featureCounts).sort((a, b) => b[1] - a[1]).map(([feature, count]) => (
                  <div key={feature} className="flex items-center justify-between">
                    <span className="text-xs font-medium text-foreground capitalize">{feature.replace(/_/g, " ")}</span>
                    <span className="text-xs font-black text-primary">{count}×</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminGuard>
  );
}