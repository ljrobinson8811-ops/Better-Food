import React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { base44 } from "@/api/base44Client";
import HeroSection from "@/components/home/HeroSection";
import FitnessDashboard from "@/components/home/FitnessDashboard";
import QuickActions from "@/components/home/QuickActions";
import FeaturedCategories from "@/components/home/FeaturedCategories";
import FeaturedRestaurants from "@/components/home/FeaturedRestaurants";
import SocialProof from "@/components/home/SocialProof";
import PullToRefresh from "@/components/shared/PullToRefresh";

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

export default function Home() {
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch (error) {
        console.error("Failed to load current user:", error);
        return null;
      }
    },
    initialData: null,
  });

  const { data: stats } = useQuery({
    queryKey: ["userStats", user?.email || "anonymous"],
    enabled: Boolean(user?.email),
    queryFn: async () => {
      try {
        const items = await base44.entities.UserStats.filter({ created_by: user.email });
        return asArray(items)[0] || {};
      } catch (error) {
        console.error("Failed to load user stats:", error);
        return {};
      }
    },
    initialData: {},
  });

  const { data: restaurants } = useQuery({
    queryKey: ["topRestaurants"],
    queryFn: async () => {
      try {
        const result = await base44.entities.Restaurant.list("name", 20);
        return asArray(result);
      } catch (error) {
        console.error("Failed to load restaurants:", error);
        return [];
      }
    },
    initialData: [],
  });

  const handleRefresh = async () => {
    await queryClient.invalidateQueries();
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="min-h-screen bg-background">
        <HeroSection userName={user?.full_name || ""} />
        <FitnessDashboard stats={stats || {}} />
        <QuickActions />
        <FeaturedCategories />
        <FeaturedRestaurants restaurants={asArray(restaurants)} />
        <SocialProof />
        <div className="h-4" />
      </div>
    </PullToRefresh>
  );
}