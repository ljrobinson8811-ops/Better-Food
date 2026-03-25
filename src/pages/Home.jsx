import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import HeroSection from "@/components/home/HeroSection";
import FitnessDashboard from "@/components/home/FitnessDashboard";
import QuickActions from "@/components/home/QuickActions";
import FeaturedCategories from "@/components/home/FeaturedCategories";
import FeaturedRestaurants from "@/components/home/FeaturedRestaurants";
import SocialProof from "@/components/home/SocialProof";
import PullToRefresh from "@/components/shared/PullToRefresh";

export default function Home() {
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: () => base44.auth.me(),
  });

  const { data: stats } = useQuery({
    queryKey: ["userStats"],
    queryFn: async () => {
      const me = await base44.auth.me();
      const items = await base44.entities.UserStats.filter({ created_by: me.email });
      return items[0] || {};
    },
  });

  const { data: restaurants } = useQuery({
    queryKey: ["topRestaurants"],
    queryFn: () => base44.entities.Restaurant.list("name", 20),
    initialData: [],
  });

  const handleRefresh = async () => {
    await queryClient.invalidateQueries();
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="min-h-screen bg-background">
        <HeroSection userName={user?.full_name} />
        <FitnessDashboard stats={stats} />
        <QuickActions />
        <FeaturedCategories />
        <FeaturedRestaurants restaurants={restaurants} />
        <SocialProof />
        <div className="h-4" />
      </div>
    </PullToRefresh>
  );
}