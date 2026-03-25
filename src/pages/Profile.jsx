import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { createCheckoutSession, openCheckoutSession, syncPremiumFromBilling, BILLING_INTERVALS } from "@/lib/billingService";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  User, ChefHat, Crown, LogOut, Package, Flame, Zap,
  DollarSign, TrendingDown, Settings, Camera, Loader2, ShieldCheck, Trash2,
} from "lucide-react";
import { isSuperAdmin } from "@/components/admin/adminAuth";
import ReferralSection from "@/components/growth/ReferralSection";
import NotificationSettings from "@/components/settings/NotificationSettings";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const skillLabels = { 1: "Beginner", 2: "Basic", 3: "Intermediate", 4: "Advanced" };
const skillDescs = {
  1: "Easy recipes only",
  2: "Some prep work ok",
  3: "Complex techniques",
  4: "Pro-level cooking",
};

function GuestProfile() {
  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Hero */}
      <div className="bg-foreground rounded-b-3xl relative overflow-hidden px-5 pt-14 pb-8">
        <div className="absolute inset-0 opacity-[0.05]" style={{
          backgroundImage: "radial-gradient(circle at 20% 50%, hsl(0 78% 48%) 0%, transparent 55%)"
        }} />
        <div className="relative text-center">
          <div className="w-20 h-20 rounded-3xl bg-background/15 border border-background/20 flex items-center justify-center mx-auto mb-4">
            <User className="w-10 h-10 text-background/40" />
          </div>
          <h1 className="text-2xl font-black text-background">Join Better Food</h1>
          <p className="text-background/55 text-sm mt-1">Create a free account and unlock 7 days of Premium</p>
        </div>
      </div>

      {/* Benefits */}
      <div className="px-5 mt-6">
        <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-3">What you unlock</p>
        <div className="space-y-2">
          {[
            { emoji: "🥗", label: "Healthier ingredient swaps" },
            { emoji: "👨‍🍳", label: "Guided cooking mode with timers" },
            { emoji: "🛒", label: "Ingredient pricing & nearby stores" },
            { emoji: "📊", label: "Advanced nutrition & macro tracking" },
            { emoji: "📸", label: "Upload & like community photos" },
            { emoji: "💰", label: "Portion scaling & cost calculator" },
          ].map((b, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 bg-card rounded-xl px-4 py-3 border border-border"
            >
              <span className="text-xl flex-shrink-0">{b.emoji}</span>
              <span className="text-sm font-medium text-foreground">{b.label}</span>
              <span className="ml-auto text-xs font-bold text-chart-3">✓ Free</span>
            </motion.div>
          ))}
        </div>

        <div className="mt-5 space-y-2">
          <button
            onClick={() => base44.auth.redirectToLogin()}
            className="w-full bg-primary text-white rounded-2xl h-14 font-bold text-sm glow-red flex items-center justify-center gap-2"
          >
            <Crown className="w-5 h-5" />
            Create Free Account — 7-Day Trial
          </button>
          <button
            onClick={() => base44.auth.redirectToLogin()}
            className="w-full bg-secondary text-foreground rounded-2xl h-12 font-medium text-sm border border-border"
          >
            Sign In to Existing Account
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Profile() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const trialCreatedRef = useRef(false);

  // Sync subscription state when returning from Stripe checkout
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") === "success") {
      syncPremiumFromBilling().then(() => {
        queryClient.invalidateQueries({ queryKey: ["userStats"] });
        queryClient.invalidateQueries({ queryKey: ["accessLevel"] });
        // Clean up URL
        window.history.replaceState({}, "", window.location.pathname);
      }).catch(() => {});
    }
  }, []);

  const handleSubscribe = async (interval) => {
    setCheckingOut(true);
    try {
      const session = await createCheckoutSession({ interval });
      openCheckoutSession(session);
    } catch (err) {
      alert(err.message || "Could not start checkout. Please try again.");
      setCheckingOut(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    // Delete user stats and favorites before logout
    try {
      const me = await base44.auth.me();
      const statsList = await base44.entities.UserStats.filter({ created_by: me.email });
      for (const s of statsList) await base44.entities.UserStats.delete(s.id);
    } catch {}
    await base44.auth.logout();
  };

  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      try { return await base44.auth.me(); } catch { return null; }
    },
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["userStats"],
    queryFn: async () => {
      try {
        const me = await base44.auth.me();
        if (!me) return null;
        const items = await base44.entities.UserStats.filter({ created_by: me.email });
        return items[0] || null;
      } catch {
        return null;
      }
    },
    enabled: !!user,
  });

  // Auto-grant 7-day free trial to new accounts
  useEffect(() => {
    if (user && !statsLoading && stats === null && !trialCreatedRef.current) {
      trialCreatedRef.current = true;
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 7);
      base44.entities.UserStats.create({
        is_premium: false,
        premium_expiry: expiry.toISOString().split("T")[0],
      }).then(() => {
        queryClient.invalidateQueries({ queryKey: ["userStats"] });
        queryClient.invalidateQueries({ queryKey: ["accessLevel"] });
      });
    }
  }, [user, stats, statsLoading]);

  const updateStats = useMutation({
    mutationFn: async (updates) => {
      if (stats?.id) {
        await base44.entities.UserStats.update(stats.id, updates);
      } else {
        await base44.entities.UserStats.create(updates);
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["userStats"] }),
  });

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.auth.updateMe({ avatar_url: file_url });
    queryClient.invalidateQueries({ queryKey: ["me"] });
    setUploadingPhoto(false);
  };

  // Guest view
  if (!user) return <GuestProfile />;

  // Determine status
  const now = new Date();
  const expiry = stats?.premium_expiry ? new Date(stats.premium_expiry) : null;
  const isActivePremium = stats?.is_premium && expiry && expiry > now;
  const isInTrial = !stats?.is_premium && expiry && expiry > now;
  const trialDaysLeft = expiry ? Math.max(0, Math.ceil((expiry - now) / (1000 * 60 * 60 * 24))) : 0;
  const showPremiumCTA = !isActivePremium && !isInTrial;

  const impactStats = [
    { icon: Flame, label: "Calories avoided", value: (stats?.estimated_calories_avoided || 0).toLocaleString(), color: "text-primary" },
    { icon: DollarSign, label: "Money saved", value: `$${(stats?.estimated_money_saved || 0).toFixed(0)}`, color: "text-chart-4" },
    { icon: Zap, label: "Recipes made", value: stats?.saved_recipes_count || 0, color: "text-chart-3" },
    { icon: TrendingDown, label: "Restaurants", value: stats?.saved_restaurants_count || 0, color: "text-chart-2" },
  ];

  const avatarUrl = user?.avatar_url;
  const initials = user?.full_name?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "?";

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="bg-foreground rounded-b-3xl relative overflow-hidden px-5 pt-14 pb-6">
        <div className="absolute inset-0 opacity-[0.05]" style={{
          backgroundImage: "radial-gradient(circle at 20% 50%, hsl(0 78% 48%) 0%, transparent 55%)"
        }} />

        <div className="relative flex items-center gap-4 mb-4">
          {/* Avatar with upload */}
          <div className="relative flex-shrink-0">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/25 flex items-center justify-center text-2xl font-black text-primary overflow-hidden">
              {avatarUrl
                ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                : initials
              }
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhoto}
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary border-2 border-foreground flex items-center justify-center"
            >
              {uploadingPhoto
                ? <Loader2 className="w-3 h-3 text-white animate-spin" />
                : <Camera className="w-3 h-3 text-white" />
              }
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-background/40 text-[11px] font-black uppercase tracking-widest">Account</p>
            <h2 className="text-xl font-black text-background truncate">{user?.full_name || "User"}</h2>
            <p className="text-background/55 text-xs mt-0.5 truncate">{user?.email}</p>
          </div>
        </div>

        {/* Status badge */}
        <div className="flex gap-2 flex-wrap">
          {isActivePremium && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-chart-4/25 border border-chart-4/40 text-xs font-bold text-chart-4">
              <Crown className="w-3 h-3" />
              Premium Member
            </div>
          )}
          {isInTrial && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-chart-3/25 border border-chart-3/40 text-xs font-bold text-chart-3">
              <Crown className="w-3 h-3" />
              Free Trial — {trialDaysLeft} day{trialDaysLeft !== 1 ? "s" : ""} left
            </div>
          )}
          {showPremiumCTA && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background/15 border border-background/20 text-xs font-bold text-background/60">
              <Crown className="w-3 h-3" />
              Basic Plan
            </div>
          )}
        </div>
      </div>

      {/* Trial countdown banner */}
      {isInTrial && trialDaysLeft <= 3 && (
        <div className="mx-5 mt-4 bg-chart-3/10 border border-chart-3/20 rounded-2xl px-4 py-3 flex items-center gap-3">
          <span className="text-xl">⏳</span>
          <div className="flex-1">
            <p className="text-sm font-bold text-foreground">Trial ends in {trialDaysLeft} day{trialDaysLeft !== 1 ? "s" : ""}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Subscribe to keep full premium access</p>
          </div>
        </div>
      )}

      {/* Impact stats */}
      <div className="px-5 mt-5">
        <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-3">Your Health Impact</p>
        <div className="grid grid-cols-2 gap-3">
          {impactStats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="bg-card rounded-2xl border border-border p-3"
            >
              <s.icon className={`w-4 h-4 ${s.color} mb-2`} />
              <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-muted-foreground font-medium">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Cooking Skill */}
      <div className="px-5 mt-4">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-2xl border border-border p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <ChefHat className="w-4 h-4 text-primary" />
            <p className="text-sm font-bold text-foreground">Cooking Skill Level</p>
          </div>
          <div className="grid grid-cols-4 gap-2 mb-3">
            {Object.entries(skillLabels).map(([k, v]) => (
              <button
                key={k}
                onClick={() => updateStats.mutate({ cooking_skill_level: parseInt(k) })}
                className={`p-2 rounded-xl text-center transition-all border ${
                  (stats?.cooking_skill_level || 1) === parseInt(k)
                    ? "bg-primary/10 border-primary/30 text-primary"
                    : "bg-secondary border-transparent text-muted-foreground"
                }`}
              >
                <p className="text-[11px] font-black">{v}</p>
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">{skillDescs[stats?.cooking_skill_level || 1]}</p>
        </motion.div>
      </div>

      {/* Pantry */}
      <div className="px-5 mt-3">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-card rounded-2xl border border-border p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" />
              <p className="text-sm font-bold text-foreground">My Pantry</p>
            </div>
            <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              {stats?.pantry_items?.length || 0} items
            </span>
          </div>
          <p className="text-xs text-muted-foreground">Track what you already have at home</p>
          {stats?.pantry_items?.length > 0 ? (
            <div className="flex flex-wrap gap-2 mt-3">
              {stats.pantry_items.map((item, i) => (
                <span key={i} className="bg-secondary border border-border text-xs px-2.5 py-1 rounded-lg text-foreground font-medium">
                  {item}
                </span>
              ))}
            </div>
          ) : (
            <div className="mt-3 bg-secondary rounded-xl px-3 py-2 text-xs text-muted-foreground">
              No pantry items yet — unlock with Premium
            </div>
          )}
        </motion.div>
      </div>

      {/* Premium Plans */}
      {showPremiumCTA && (
        <div className="px-5 mt-3">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-foreground to-foreground/90 rounded-2xl overflow-hidden"
          >
            <div className="p-5">
              <div className="flex items-center gap-2 mb-1">
                <Crown className="w-4 h-4 text-chart-4" />
                <p className="text-sm font-black text-background">Go Premium</p>
              </div>
              <p className="text-background/55 text-xs mb-4">
                Both plans include every feature — only the billing period differs
              </p>

              {/* Benefits grid */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mb-4">
                {[
                  "Healthier swaps",
                  "Guided cooking",
                  "Ingredient pricing",
                  "Nearby stores",
                  "Advanced macros",
                  "Photo uploads",
                  "Pantry tracking",
                  "Portion scaling",
                ].map(f => (
                  <div key={f} className="flex items-center gap-1.5">
                    <span className="text-chart-3 text-xs">✓</span>
                    <span className="text-background/70 text-[11px]">{f}</span>
                  </div>
                ))}
              </div>

              {/* Plan cards — same benefits */}
              <div className="bg-background/8 rounded-xl p-3 mb-3">
                <p className="text-background/50 text-[10px] font-bold uppercase tracking-wider mb-2 text-center">
                  Same features · Choose your billing
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleSubscribe(BILLING_INTERVALS.MONTHLY)}
                    disabled={checkingOut}
                    className="bg-primary text-white rounded-xl py-3 text-sm font-black disabled:opacity-60 flex items-center justify-center gap-1"
                  >
                    {checkingOut ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                    $4.99/mo
                  </button>
                  <button
                    onClick={() => handleSubscribe(BILLING_INTERVALS.YEARLY)}
                    disabled={checkingOut}
                    className="bg-background/15 border border-background/25 text-background rounded-xl py-3 text-sm font-black relative disabled:opacity-60 flex items-center justify-center gap-1"
                  >
                    {checkingOut ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                    $29.99/yr
                    <span className="absolute -top-2 -right-1 text-[8px] font-black bg-chart-3 text-white px-1.5 py-0.5 rounded-full">
                      SAVE 50%
                    </span>
                  </button>
                </div>
              </div>
              <p className="text-background/35 text-[10px] text-center">7-day free trial included · Cancel anytime</p>
            </div>
          </motion.div>
        </div>
      )}

      {/* Premium active / trial active info */}
      {(isActivePremium || isInTrial) && (
        <div className="px-5 mt-3">
          <div className={`rounded-2xl border p-4 ${isActivePremium ? "bg-chart-4/8 border-chart-4/20" : "bg-chart-3/8 border-chart-3/20"}`}>
            <div className="flex items-center gap-2 mb-1">
              <Crown className={`w-4 h-4 ${isActivePremium ? "text-chart-4" : "text-chart-3"}`} />
              <p className={`text-sm font-bold ${isActivePremium ? "text-chart-4" : "text-chart-3"}`}>
                {isActivePremium ? "Premium Active" : `Free Trial — ${trialDaysLeft} days remaining`}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              {isActivePremium
                ? `Renews ${expiry ? expiry.toLocaleDateString() : "N/A"}`
                : isInTrial
                  ? `Trial ends ${expiry ? expiry.toLocaleDateString() : "soon"} — subscribe to continue`
                  : ""}
            </p>
          </div>
        </div>
      )}

      {/* Referral */}
      <div className="px-5 mt-3">
        <ReferralSection user={user} />
      </div>

      {/* Notification Preferences */}
      <div className="px-5 mt-3">
        <NotificationSettings />
      </div>

      {/* Super Admin Panel */}
      {isSuperAdmin(user) && (
        <div className="px-5 mt-3">
          <div className="bg-gradient-to-br from-foreground to-foreground/90 rounded-2xl overflow-hidden">
            <div className="px-4 pt-3 pb-1 flex items-center gap-2 border-b border-background/10">
              <ShieldCheck className="w-4 h-4 text-chart-4" />
              <span className="text-xs font-black text-chart-4 uppercase tracking-wider">Admin Mode Active</span>
              <span className="ml-auto text-[9px] font-black bg-chart-4/25 text-chart-4 border border-chart-4/40 px-2 py-0.5 rounded-full">SUPER ADMIN</span>
            </div>
            <div className="p-4">
              <p className="text-background/55 text-xs mb-3">Full system access enabled for this account.</p>
              <Link
                to={createPageUrl("AdminDashboard")}
                className="flex items-center gap-3 bg-background/10 border border-background/20 rounded-xl px-4 py-3 w-full hover:bg-background/15 transition-colors active:scale-[0.98]"
              >
                <Settings className="w-4 h-4 text-background" />
                <span className="text-sm font-bold text-background">Open Admin Dashboard</span>
                <span className="ml-auto text-background/40 text-lg">›</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Logout */}
      <div className="px-5 mt-4">
        <Button
          variant="ghost"
          onClick={() => base44.auth.logout()}
          className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-2xl h-12"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>

      {/* Delete Account */}
      <div className="px-5 mt-1 mb-6">
        {!showDeleteConfirm ? (
          <Button
            variant="ghost"
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full justify-start text-muted-foreground/60 hover:text-destructive hover:bg-destructive/5 rounded-2xl h-12"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Account
          </Button>
        ) : (
          <div className="bg-destructive/8 border border-destructive/20 rounded-2xl p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Trash2 className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-foreground">Delete your account?</p>
                <p className="text-xs text-muted-foreground mt-0.5">This action cannot be undone. Your data will be permanently removed.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 rounded-xl h-10 text-sm"
                disabled={deletingAccount}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteAccount}
                disabled={deletingAccount}
                className="flex-1 rounded-xl h-10 text-sm bg-destructive hover:bg-destructive/90 text-white"
              >
                {deletingAccount ? <Loader2 className="w-4 h-4 animate-spin" /> : "Yes, Delete"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}