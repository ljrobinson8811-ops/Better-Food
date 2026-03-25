import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { motion } from "framer-motion";

const PREFS = [
  { key: "trending_recipe",     label: "Trending Recipes",          sub: "New popular better-food remakes" },
  { key: "community_highlights",label: "Community Highlights",       sub: "Top community photos & wins" },
  { key: "new_restaurant",      label: "New Restaurant Added",       sub: "When we add a chain you might like" },
  { key: "referral_rewards",    label: "Referral Rewards",           sub: "When a friend joins using your link" },
  { key: "premium_trial_ending",label: "Premium Trial Ending",       sub: "3-day warning before trial expires" },
];

export default function NotificationSettings() {
  const queryClient = useQueryClient();

  const { data: prefs } = useQuery({
    queryKey: ["notifPrefs"],
    queryFn: async () => {
      const me = await base44.auth.me();
      const items = await base44.entities.NotificationPreferences.filter({ created_by: me.email });
      return items[0] ?? { trending_recipe: true, community_highlights: true, new_restaurant: true, referral_rewards: true, premium_trial_ending: true };
    },
  });

  const updatePref = useMutation({
    mutationFn: async ({ key, value }) => {
      if (prefs?.id) {
        await base44.entities.NotificationPreferences.update(prefs.id, { [key]: value });
      } else {
        await base44.entities.NotificationPreferences.create({ ...prefs, [key]: value });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifPrefs"] }),
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl p-4"
    >
      <div className="flex items-center gap-2 mb-4">
        <Bell className="w-4 h-4 text-chart-2" />
        <p className="text-sm font-bold text-foreground">Notifications</p>
      </div>

      <div className="space-y-3">
        {PREFS.map(p => (
          <div key={p.key} className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-foreground">{p.label}</p>
              <p className="text-[10px] text-muted-foreground">{p.sub}</p>
            </div>
            <button
              onClick={() => updatePref.mutate({ key: p.key, value: !prefs?.[p.key] })}
              className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${
                prefs?.[p.key] ? "bg-primary" : "bg-secondary"
              }`}
            >
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
                prefs?.[p.key] ? "left-5" : "left-0.5"
              }`} />
            </button>
          </div>
        ))}
      </div>
    </motion.div>
  );
}