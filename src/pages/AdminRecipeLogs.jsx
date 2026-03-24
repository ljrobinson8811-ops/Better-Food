import React from "react";
import AdminGuard from "@/components/admin/AdminGuard";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, CheckCircle, XCircle, Clock } from "lucide-react";
import { motion } from "framer-motion";

const statusIcon = {
  success: <CheckCircle className="w-4 h-4 text-chart-3" />,
  failed: <XCircle className="w-4 h-4 text-primary" />,
  cached: <Clock className="w-4 h-4 text-chart-2" />,
  validating: <Clock className="w-4 h-4 text-chart-4" />,
};

export default function AdminRecipeLogs() {
  const { data: logs } = useQuery({
    queryKey: ["recipeLogs"],
    queryFn: () => base44.entities.RecipeGenerationLog.list("-created_date", 100),
    initialData: [],
  });

  const success = logs.filter(l => l.status === "success").length;
  const failed = logs.filter(l => l.status === "failed").length;
  const cached = logs.filter(l => l.status === "cached").length;
  const avgDuration = logs.filter(l => l.duration_ms).reduce((a, b, i, arr) => a + b.duration_ms / arr.length, 0);

  return (
    <AdminGuard>
      <div className="min-h-screen bg-background pb-8">
        <div className="bg-foreground rounded-b-3xl px-5 pt-14 pb-6">
          <Link to={createPageUrl("AdminDashboard")} className="flex items-center gap-2 text-foreground/40 mb-4">
            <ArrowLeft className="w-4 h-4" /> Admin
          </Link>
          <h1 className="text-2xl font-black text-background">Recipe Logs</h1>
          <p className="text-foreground/35 text-sm mt-1">{logs.length} total generations</p>
        </div>

        <div className="px-5 mt-5">
          <div className="grid grid-cols-4 gap-2 mb-5">
            {[
              { label: "Success", value: success, color: "text-chart-3" },
              { label: "Failed", value: failed, color: "text-primary" },
              { label: "Cached", value: cached, color: "text-chart-2" },
              { label: "Avg (s)", value: avgDuration > 0 ? (avgDuration / 1000).toFixed(1) : "—", color: "text-chart-4" },
            ].map(s => (
              <div key={s.label} className="bg-card border border-border rounded-xl p-2 text-center">
                <p className={`text-lg font-black ${s.color}`}>{s.value}</p>
                <p className="text-[9px] text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            {logs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No logs yet</p>
            ) : logs.map((log, i) => (
              <motion.div key={log.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                className="flex items-start gap-3 p-3 bg-card rounded-xl border border-border">
                <div className="mt-0.5">{statusIcon[log.status] || statusIcon.success}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">{log.menu_item_name || "Unknown item"}</p>
                  <p className="text-[10px] text-muted-foreground">{log.restaurant_name}</p>
                  {log.error_message && <p className="text-[10px] text-primary mt-0.5 truncate">{log.error_message}</p>}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[10px] font-black text-muted-foreground uppercase">{log.status}</p>
                  {log.duration_ms && <p className="text-[9px] text-muted-foreground">{(log.duration_ms / 1000).toFixed(1)}s</p>}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}