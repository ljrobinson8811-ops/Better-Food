import React, { useState } from "react";
import AdminGuard from "@/components/admin/AdminGuard";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

const severityColor = { low: "text-chart-3", medium: "text-chart-4", high: "text-primary", critical: "text-red-600" };
const severityBg = { low: "bg-chart-3/8 border-chart-3/20", medium: "bg-chart-4/8 border-chart-4/20", high: "bg-primary/8 border-primary/20", critical: "bg-red-500/10 border-red-500/20" };

export default function AdminErrors() {
  const [filter, setFilter] = useState("all");
  const queryClient = useQueryClient();

  const { data: errors } = useQuery({
    queryKey: ["allErrors"],
    queryFn: () => base44.entities.ErrorLog.list("-created_date", 100),
    initialData: [],
  });

  const handleResolve = async (id) => {
    await base44.entities.ErrorLog.update(id, { resolved: true });
    queryClient.invalidateQueries({ queryKey: ["allErrors"] });
  };

  const filtered = filter === "all" ? errors : filter === "open" ? errors.filter(e => !e.resolved) : errors.filter(e => e.resolved);

  return (
    <AdminGuard>
      <div className="min-h-screen bg-background pb-8">
        <div className="bg-foreground rounded-b-3xl px-5 pt-14 pb-6">
          <Link to={createPageUrl("AdminDashboard")} className="flex items-center gap-2 text-foreground/40 mb-4">
            <ArrowLeft className="w-4 h-4" /> Admin
          </Link>
          <h1 className="text-2xl font-black text-background">Error Monitor</h1>
          <p className="text-foreground/35 text-sm mt-1">{errors.filter(e => !e.resolved).length} unresolved errors</p>
        </div>

        <div className="px-5 mt-5">
          <div className="flex gap-2 mb-4">
            {["all", "open", "resolved"].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${filter === f ? "bg-primary text-white" : "bg-secondary text-muted-foreground"}`}>
                {f}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <CheckCircle className="w-10 h-10 text-chart-3 mx-auto mb-3" />
              <p className="text-sm font-bold text-foreground">All clear!</p>
              <p className="text-xs text-muted-foreground mt-1">No errors in this filter</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((err, i) => (
                <motion.div key={err.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  className={`p-3 rounded-xl border ${err.resolved ? "bg-secondary/50 border-border opacity-60" : severityBg[err.severity] || "bg-card border-border"}`}>
                  <div className="flex items-start gap-2 justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground leading-tight">{err.message}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[9px] font-black uppercase ${severityColor[err.severity]}`}>{err.severity}</span>
                        <span className="text-[9px] text-muted-foreground">{err.error_type}</span>
                        {err.page && <span className="text-[9px] text-muted-foreground">{err.page}</span>}
                      </div>
                    </div>
                    {!err.resolved && (
                      <button onClick={() => handleResolve(err.id)}
                        className="w-7 h-7 rounded-lg bg-chart-3/15 flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-3.5 h-3.5 text-chart-3" />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminGuard>
  );
}