import React from "react";
import { base44 } from "../api/base44Client.js";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { BarChart3, ShieldAlert, Cpu, Settings, AlertTriangle, Users, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import AdminGuard from "../components/admin/AdminGuard.jsx";

function StatTile({ label, value, sub, color = "text-foreground", delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-card border border-border rounded-2xl p-4"
    >
      <p className={`text-2xl font-black ${color}`}>{value ?? "—"}</p>
      <p className="text-xs font-bold text-foreground mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
    </motion.div>
  );
}

const adminPages = [
  { title: "Menu Ingestion", sub: "Discovery logs & queues", icon: Cpu, page: "AdminMenuIngestion", color: "text-chart-2", bg: "bg-chart-2/10 border-chart-2/20" },
  { title: "Recipe Logs", sub: "Generation pipeline", icon: BarChart3, page: "AdminRecipeLogs", color: "text-chart-3", bg: "bg-chart-3/10 border-chart-3/20" },
  { title: "Error Monitor", sub: "Failures & retries", icon: AlertTriangle, page: "AdminErrors", color: "text-primary", bg: "bg-primary/10 border-primary/20" },
  { title: "User Analytics", sub: "Behavior & conversions", icon: Users, page: "AdminAnalytics", color: "text-chart-5", bg: "bg-chart-5/10 border-chart-5/20" },
  { title: "Moderation", sub: "Photo review queue", icon: ShieldAlert, page: "AdminModeration", color: "text-chart-4", bg: "bg-chart-4/10 border-chart-4/20" },
  { title: "Premium Usage", sub: "Feature gating stats", icon: Settings, page: "AdminPremium", color: "text-chart-1", bg: "bg-chart-1/10 border-chart-1/20" },
];

export default function AdminDashboard() {
  const { data: errors = [] } = useQuery({
    queryKey: ["adminErrors"],
    queryFn: () => base44.entities.ErrorLog.list("-created_date", 5),
    initialData: [],
  });
  const { data: recipeLogCount = [] } = useQuery({
    queryKey: ["recipeLogCount"],
    queryFn: () => base44.entities.RecipeGenerationLog.list("-created_date", 100),
    initialData: [],
  });
  const { data: modQueue = [] } = useQuery({
    queryKey: ["modQueueCount"],
    queryFn: () => base44.entities.ContentModerationQueue.filter({ status: "pending" }),
    initialData: [],
  });
  const { data: analytics = [] } = useQuery({
    queryKey: ["analyticsCount"],
    queryFn: () => base44.entities.UserAnalytics.list("-created_date", 200),
    initialData: [],
  });

  const unresolved = errors.filter((e) => !e.resolved);
  const successRecipes = recipeLogCount.filter((r) => r.status === "success").length;
  const failedRecipes = recipeLogCount.filter((r) => r.status === "failed").length;
  const recipeSuccessRate = recipeLogCount.length > 0 ? Math.round((successRecipes / recipeLogCount.length) * 100) : 100;

  return (
    <AdminGuard>
      <div className="min-h-screen bg-background pb-8">
        <div className="bg-foreground rounded-b-3xl px-5 pt-14 pb-6">
          <p className="text-foreground/30 text-[11px] font-black uppercase tracking-widest mb-1">System</p>
          <h1 className="text-2xl font-black text-background">Admin Dashboard</h1>
          <p className="text-foreground/35 text-sm mt-1">Better Food — Operations Center</p>
        </div>

        <div className="px-5 mt-5">
          <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-3">System Health</p>
          <div className="grid grid-cols-2 gap-3 mb-6">
            <StatTile label="Recipe Success Rate" value={`${recipeSuccessRate}%`} sub={`${successRecipes} ok / ${failedRecipes} failed`} color={recipeSuccessRate > 80 ? "text-chart-3" : "text-primary"} delay={0.05} />
            <StatTile label="Open Errors" value={unresolved.length} sub="unresolved issues" color={unresolved.length > 0 ? "text-primary" : "text-chart-3"} delay={0.08} />
            <StatTile label="Moderation Queue" value={modQueue.length} sub="photos pending review" color={modQueue.length > 0 ? "text-chart-4" : "text-chart-3"} delay={0.11} />
            <StatTile label="Analytics Events" value={analytics.length} sub="last 200 events" color="text-chart-2" delay={0.14} />
          </div>

          <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-3">Admin Panels</p>
          <div className="grid grid-cols-1 gap-3">
            {adminPages.map((p, i) => (
              <motion.div key={p.title} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.04 }}>
                <Link
                  to={createPageUrl(p.page)}
                  className={`flex items-center gap-4 p-4 bg-card rounded-2xl border transition-all active:scale-[0.98] hover:border-primary/20 ${p.bg}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${p.bg}`}>
                    <p.icon className={`w-5 h-5 ${p.color}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-foreground">{p.title}</p>
                    <p className="text-xs text-muted-foreground">{p.sub}</p>
                  </div>
                  <span className="text-muted-foreground/40">›</span>
                </Link>
              </motion.div>
            ))}
          </div>

          {unresolved.length > 0 && (
            <div className="mt-6">
              <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-3">Recent Errors</p>
              <div className="space-y-2">
                {unresolved.slice(0, 3).map((err) => (
                  <div key={err.id} className="bg-primary/5 border border-primary/15 rounded-xl p-3 flex items-start gap-3">
                    <XCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">{err.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{err.error_type} · {err.severity}</p>
                    </div>
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