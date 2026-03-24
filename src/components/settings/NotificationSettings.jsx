import React from "react";
import { Bell } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";

import { base44, safeGetCurrentUser } from "@/api/base44Client";

const DEFAULT_PREFERENCES = Object.freeze({
  trending_recipe: true,
  community_highlights: true,
  new_restaurant: true,
  referral_rewards: true,
  premium_trial_ending: true,
});

const PREFERENCES = [
  {
    key: "trending_recipe",
    label: "Trending Recipes",
    sub: "New popular better-food remakes",
  },
  {
    key: "community_highlights",
    label: "Community Highlights",
    sub: "Top community photos and wins",
  },
  {
    key: "new_restaurant",
    label: "New Restaurant Added",
    sub: "When we add a chain you might like",
  },
  {
    key: "referral_rewards",
    label: "Referral Rewards",
    sub: "When a friend joins using your link",
  },
  {
    key: "premium_trial_ending",
    label: "Premium Trial Ending",
    sub: "3-day warning before trial expires",
  },
];

export default function NotificationSettings() {
  const queryClient = useQueryClient();

  const { data: preferences } = useQuery({
    queryKey: ["notificationPreferences"],
    queryFn: async () => {
      const user = await safeGetCurrentUser();
      if (!user?.email) {
        return { ...DEFAULT_PREFERENCES };
      }

      const items = await base44.entities.NotificationPreferences.filter({
        created_by: user.email,
      });

      return items?.[0] || { ...DEFAULT_PREFERENCES };
    },
    initialData: { ...DEFAULT_PREFERENCES },
  });

  const updatePreference = useMutation({
    mutationFn: async ({ key, value }) => {
      const user = await safeGetCurrentUser();
      if (!user?.email) {
        throw new Error("Must be signed in to update notifications.");
      }

      if (preferences?.id) {
        await base44.entities.NotificationPreferences.update(preferences.id, {
          [key]: value,
        });
        return;
      }

      await base44.entities.NotificationPreferences.create({
        ...DEFAULT_PREFERENCES,
        [key]: value,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["notificationPreferences"],
      });
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card p-4"
    >
      <div className="mb-4 flex items-center gap-2">
        <Bell className="h-4 w-4 text-chart-2" />
        <p className="text-sm font-bold text-foreground">Notifications</p>
      </div>

      <div className="space-y-3">
        {PREFERENCES.map((preference) => {
          const enabled = Boolean(preferences?.[preference.key]);

          return (
            <div
              key={preference.key}
              className="flex items-center justify-between gap-3"
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-foreground">
                  {preference.label}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {preference.sub}
                </p>
              </div>

              <button
                onClick={() =>
                  updatePreference.mutate({
                    key: preference.key,
                    value: !enabled,
                  })
                }
                className={`relative h-5 w-10 flex-shrink-0 rounded-full transition-colors ${
                  enabled ? "bg-primary" : "bg-secondary"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${
                    enabled ? "left-5" : "left-0.5"
                  }`}
                />
              </button>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}