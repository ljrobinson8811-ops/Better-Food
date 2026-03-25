import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { isSuperAdmin } from "@/components/admin/adminAuth";
import { ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function AdminGuard({ children }) {
  const { data: user, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      try { return await base44.auth.me(); } catch { return null; }
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isSuperAdmin(user)) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5 text-center pb-24">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
          <ShieldAlert className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl font-black text-foreground mb-2">Access Denied</h2>
        <p className="text-sm text-muted-foreground mb-6 max-w-[240px]">
          This area is restricted to the app administrator only.
        </p>
        <Link
          to={createPageUrl("Home")}
          className="bg-primary text-white rounded-2xl px-6 py-3 font-bold text-sm"
        >
          Go Home
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}