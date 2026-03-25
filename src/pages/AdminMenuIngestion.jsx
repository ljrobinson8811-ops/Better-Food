import React, { useState } from "react";
import AdminGuard from "@/components/admin/AdminGuard";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { discoverMenuForRestaurant } from "@/components/infra/menuWorker";

const statusColor = { success: "text-chart-3", failed: "text-primary", partial: "text-chart-4", queued: "text-chart-2" };
const statusBg = { success: "bg-chart-3/10 border-chart-3/20", failed: "bg-primary/10 border-primary/20", partial: "bg-chart-4/10 border-chart-4/20", queued: "bg-chart-2/10 border-chart-2/20" };

export default function AdminMenuIngestion() {
  const [running, setRunning] = useState(null);
  const queryClient = useQueryClient();

  const { data: logs } = useQuery({
    queryKey: ["menuLogs"],
    queryFn: () => base44.entities.MenuDiscoveryLog.list("-created_date", 50),
    initialData: [],
  });

  const { data: restaurants } = useQuery({
    queryKey: ["restaurants"],
    queryFn: () => base44.entities.Restaurant.list("name", 100),
    initialData: [],
  });

  const { data: queue } = useQuery({
    queryKey: ["refreshQueue"],
    queryFn: () => base44.entities.RestaurantRefreshQueue.filter({ status: "pending" }),
    initialData: [],
  });

  const { data: menuItems } = useQuery({
    queryKey: ["allMenuItems"],
    queryFn: () => base44.entities.MenuItem.list("-created_date", 500),
    initialData: [],
  });

  const handleDiscover = async (restaurantId, restaurantName) => {
    setRunning(restaurantId);
    await discoverMenuForRestaurant(restaurantId, restaurantName);
    queryClient.invalidateQueries({ queryKey: ["menuLogs"] });
    setRunning(null);
  };

  const withMenuIds = new Set(menuItems.map(m => m.restaurant_id));
  const needsMenu = restaurants.filter(r => !withMenuIds.has(r.id));

  return (
    <AdminGuard>
      <div className="min-h-screen bg-background pb-8">
        <div className="bg-foreground rounded-b-3xl px-5 pt-14 pb-6">
          <Link to={createPageUrl("AdminDashboard")} className="flex items-center gap-2 text-foreground/40 mb-4">
            <ArrowLeft className="w-4 h-4" /> Admin
          </Link>
          <h1 className="text-2xl font-black text-background">Menu Ingestion</h1>
          <p className="text-foreground/35 text-sm mt-1">{logs.length} discovery logs · {queue.length} queued</p>
        </div>

        <div className="px-5 mt-5 space-y-5">
          {needsMenu.length > 0 && (
            <div>
              <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-3">No Menu Yet ({needsMenu.length})</p>
              <div className="space-y-2">
                {needsMenu.map(r => (
                  <div key={r.id} className="flex items-center gap-3 bg-card border border-border rounded-xl p-3">
                    <span className="text-sm font-bold text-foreground flex-1">{r.name}</span>
                    <button
                      onClick={() => handleDiscover(r.id, r.name)}
                      disabled={running === r.id}
                      className="flex items-center gap-1.5 bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-lg disabled:opacity-50"
                    >
                      {running === r.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      {running === r.id ? "..." : "Discover"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-3">Discovery Logs</p>
            {logs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No logs yet</p>
            ) : (
              <div className="space-y-2">
                {logs.map((log, i) => (
                  <motion.div key={log.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                    className={`p-3 rounded-xl border ${statusBg[log.status] || "bg-secondary border-border"}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-foreground">{log.restaurant_name}</span>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${statusColor[log.status]}`}>
                        {log.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] text-muted-foreground">{log.items_created} created</span>
                      <span className="text-[10px] text-muted-foreground">{log.source}</span>
                      {log.duration_ms && <span className="text-[10px] text-muted-foreground">{(log.duration_ms / 1000).toFixed(1)}s</span>}
                    </div>
                    {log.error_message && <p className="text-[10px] text-primary mt-1 truncate">{log.error_message}</p>}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}