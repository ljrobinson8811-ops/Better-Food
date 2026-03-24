import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

import AdminGuard from "@/components/admin/AdminGuard";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { discoverMenuForRestaurant } from "@/components/infra/menuWorker";

const STATUS_COLOR = {
  success: "text-chart-3",
  failed: "text-primary",
  partial: "text-chart-4",
  queued: "text-chart-2",
};

const STATUS_BG = {
  success: "bg-chart-3/10 border-chart-3/20",
  failed: "bg-primary/10 border-primary/20",
  partial: "bg-chart-4/10 border-chart-4/20",
  queued: "bg-chart-2/10 border-chart-2/20",
};

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

export default function AdminMenuIngestion() {
  const [running, setRunning] = useState(null);
  const queryClient = useQueryClient();

  const { data: logs } = useQuery({
    queryKey: ["menuLogs"],
    queryFn: async () => {
      try {
        const result = await base44.entities.MenuDiscoveryLog.list("-created_date", 50);
        return asArray(result);
      } catch (error) {
        console.error("Failed to load menu discovery logs:", error);
        return [];
      }
    },
    initialData: [],
  });

  const { data: restaurants } = useQuery({
    queryKey: ["restaurants"],
    queryFn: async () => {
      try {
        const result = await base44.entities.Restaurant.list("name", 100);
        return asArray(result);
      } catch (error) {
        console.error("Failed to load restaurants:", error);
        return [];
      }
    },
    initialData: [],
  });

  const { data: queue } = useQuery({
    queryKey: ["refreshQueue"],
    queryFn: async () => {
      try {
        const result = await base44.entities.RestaurantRefreshQueue.filter({ status: "pending" });
        return asArray(result);
      } catch (error) {
        console.error("Failed to load refresh queue:", error);
        return [];
      }
    },
    initialData: [],
  });

  const { data: menuItems } = useQuery({
    queryKey: ["allMenuItems"],
    queryFn: async () => {
      try {
        const result = await base44.entities.MenuItem.list("-created_date", 500);
        return asArray(result);
      } catch (error) {
        console.error("Failed to load menu items:", error);
        return [];
      }
    },
    initialData: [],
  });

  const withMenuIds = useMemo(() => {
    return new Set(
      asArray(menuItems)
        .map((item) => item?.restaurant_id)
        .filter(Boolean)
    );
  }, [menuItems]);

  const needsMenu = useMemo(() => {
    return asArray(restaurants).filter((restaurant) => !withMenuIds.has(restaurant?.id));
  }, [restaurants, withMenuIds]);

  const handleDiscover = async (restaurantId, restaurantName) => {
    if (!restaurantId || running === restaurantId) return;

    try {
      setRunning(restaurantId);
      await discoverMenuForRestaurant(restaurantId, restaurantName);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["menuLogs"] }),
        queryClient.invalidateQueries({ queryKey: ["allMenuItems"] }),
        queryClient.invalidateQueries({ queryKey: ["refreshQueue"] }),
      ]);
    } catch (error) {
      console.error(`Failed to discover menu for ${restaurantName}:`, error);
    } finally {
      setRunning(null);
    }
  };

  return (
    <AdminGuard>
      <div className="min-h-screen bg-background pb-8">
        <div className="bg-foreground rounded-b-3xl px-5 pt-14 pb-6">
          <Link
            to={createPageUrl("AdminDashboard")}
            className="flex items-center gap-2 text-foreground/40 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Admin
          </Link>

          <h1 className="text-2xl font-black text-background">Menu Ingestion</h1>
          <p className="text-foreground/35 text-sm mt-1">
            {asArray(logs).length} discovery logs · {asArray(queue).length} queued
          </p>
        </div>

        <div className="px-5 mt-5 space-y-5">
          {needsMenu.length > 0 && (
            <div>
              <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-3">
                No Menu Yet ({needsMenu.length})
              </p>

              <div className="space-y-2">
                {needsMenu.map((restaurant) => (
                  <div
                    key={restaurant?.id}
                    className="flex items-center gap-3 bg-card border border-border rounded-xl p-3"
                  >
                    <span className="text-sm font-bold text-foreground flex-1">
                      {restaurant?.name || "Unknown Restaurant"}
                    </span>

                    <button
                      onClick={() => handleDiscover(restaurant?.id, restaurant?.name)}
                      disabled={running === restaurant?.id}
                      className="flex items-center gap-1.5 bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-lg disabled:opacity-50"
                    >
                      {running === restaurant?.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Sparkles className="w-3 h-3" />
                      )}
                      {running === restaurant?.id ? "..." : "Discover"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-3">
              Discovery Logs
            </p>

            {asArray(logs).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No logs yet</p>
            ) : (
              <div className="space-y-2">
                {asArray(logs).map((log, index) => (
                  <motion.div
                    key={log?.id || `log-${index}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                    className={`p-3 rounded-xl border ${
                      STATUS_BG[log?.status] || "bg-secondary border-border"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-foreground">
                        {log?.restaurant_name || "Unknown Restaurant"}
                      </span>

                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          STATUS_COLOR[log?.status] || "text-muted-foreground"
                        }`}
                      >
                        {log?.status || "unknown"}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-[10px] text-muted-foreground">
                        {Number(log?.items_created) || 0} created
                      </span>

                      <span className="text-[10px] text-muted-foreground">
                        {log?.source || "unknown source"}
                      </span>

                      {Number.isFinite(Number(log?.duration_ms)) && (
                        <span className="text-[10px] text-muted-foreground">
                          {(Number(log.duration_ms) / 1000).toFixed(1)}s
                        </span>
                      )}
                    </div>

                    {log?.error_message ? (
                      <p className="text-[10px] text-primary mt-1 truncate">
                        {log.error_message}
                      </p>
                    ) : null}
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