import React, { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  User,
  ChefHat,
  Crown,
  LogOut,
  Package,
  Flame,
  Zap,
  DollarSign,
  TrendingDown,
  Settings,
  Camera,
  Loader2,
  ShieldCheck,
  Trash2,
  CreditCard,
} from "lucide-react";
import { motion } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";

import { base44 } from "../api/base44Client.js";
import { createPageUrl } from "../utils";
import { isSuperAdmin } from "../components/admin/adminAuth.jsx";
import ReferralSection from "../components/growth/ReferralSection.jsx";
import NotificationSettings from "../components/settings/NotificationSettings.jsx";
import { Button } from "../components/ui/button.jsx";
import {
  BILLING_INTERVALS,
  createCheckoutSession,
  openCheckoutSession,
  syncPremiumFromBilling,
} from "../lib/billingService.js";
import { clearPremiumCache } from "../components/infra/premiumGate.jsx";

const skillLabels = {
  1: "Beginner",
  2: "Basic",
  3: "Intermediate",
  4: "Advanced",
};

const skillDescriptions = {
  1: "Easy recipes only",
  2: "Some prep work okay",
  3: "Complex techniques",
  4: "Pro-level cooking",
};

function GuestProfile() {
  return (
    <div className="min-h-screen bg-background pb-8">
      <div className="relative overflow-hidden rounded-b-3xl bg-foreground px-5 pb-8 pt-14">
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 50%, hsl(0 78% 48%) 0%, transparent 55%)",
          }}
        />
        <div className="relative text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl border border-background/20 bg-background/15">
            <User className="h-10 w-10 text-background/40" />
          </div>

          <h1 className="text-2xl font-black text-background">
            Join Better Food
          </h1>
          <p className="mt-1 text-sm text-background/55">
            Create an account to unlock premium features
          </p>
        </div>
      </div>

      <div className="mt-6 px-5">
        <p className="mb-3 text-xs font-black uppercase tracking-widest text-muted-foreground">
          What you unlock
        </p>

        <div className="space-y-2">
          {[
            { emoji: "🥗", label: "Healthier ingredient swaps" },
            { emoji: "👨‍🍳", label: "Guided cooking mode with timers" },
            { emoji: "🛒", label: "Ingredient pricing and nearby stores" },
            { emoji: "📊", label: "Advanced nutrition and macro tracking" },
            { emoji: "📸", label: "Upload and like community photos" },
            { emoji: "💰", label: "Portion scaling and cost calculator" },
          ].map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
            >
              <span className="flex-shrink-0 text-xl">{benefit.emoji}</span>
              <span className="text-sm font-medium text-foreground">
                {benefit.label}
              </span>
            </motion.div>
          ))}
        </div>

        <div className="mt-5 space-y-2">
          <button
            onClick={() => base44.auth.redirectToLogin()}
            className="glow-red flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-bold text-white"
          >
            <Crown className="h-5 w-5" />
            Create Account
          </button>

          <button
            onClick={() => base44.auth.redirectToLogin()}
            className="h-12 w-full rounded-2xl border border-border bg-secondary text-sm font-medium text-foreground"
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

export default function Profile() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(BILLING_INTERVALS.MONTHLY);

  const checkoutSuccess = searchParams.get("checkout") === "success";
  const checkoutCanceled = searchParams.get("checkout") === "cancel";

  const { data: user = null } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch {
        return null;
      }
    },
    initialData: null,
  });

  const { data: stats = null } = useQuery({
    queryKey: ["userStats", user?.email || "anonymous"],
    enabled: Boolean(user?.email),
    queryFn: async () => {
      const result = await base44.entities.UserStats.filter({
        created_by: user.email,
      });
      return asArray(result)[0] || null;
    },
    initialData: null,
  });

  useEffect(() => {
    if (!checkoutSuccess || !user?.email) {
      return;
    }

    let mounted = true;

    (async () => {
      try {
        await syncPremiumFromBilling(user.email);
        clearPremiumCache();
        await queryClient.invalidateQueries({ queryKey: ["userStats", user.email] });
        await queryClient.invalidateQueries({ queryKey: ["accessLevel"] });

        if (!mounted) return;

        const next = new URLSearchParams(searchParams);
        next.delete("checkout");
        setSearchParams(next, { replace: true });
      } catch {
        // leave query param in place if sync failed
      }
    })();

    return () => {
      mounted = false;
    };
  }, [checkoutSuccess, user?.email, queryClient, searchParams, setSearchParams]);

  const updateStatsMutation = useMutation({
    mutationFn: async (updates) => {
      if (stats?.id) {
        return base44.entities.UserStats.update(stats.id, updates);
      }

      return base44.entities.UserStats.create({
        cooking_skill_level: 1,
        pantry_items: [],
        estimated_calories_avoided: 0,
        estimated_money_saved: 0,
        saved_recipes_count: 0,
        saved_restaurants_count: 0,
        is_premium: false,
        premium_expiry: null,
        billing_status: "free",
        billing_interval: null,
        stripe_customer_id: null,
        stripe_subscription_id: null,
        ...updates,
      });
    },
    onSuccess: async () => {
      if (user?.email) {
        await queryClient.invalidateQueries({ queryKey: ["userStats", user.email] });
      }
    },
  });

  const startCheckoutMutation = useMutation({
    mutationFn: async (interval) => {
      if (!user?.email) {
        throw new Error("You must be signed in to subscribe.");
      }

      const session = await createCheckoutSession({
        email: user.email,
        interval,
      });

      await openCheckoutSession(session);
      return session;
    },
  });

  const handleSubscribe = async (interval) => {
    try {
      await startCheckoutMutation.mutateAsync(interval);
    } catch (error) {
      alert(error?.message || "Unable to start checkout.");
    }
  };

  const handlePhotoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);

    try {
      const uploadResult = await base44.integrations.Core.UploadFile({ file });
      await base44.auth.updateMe({ avatar_url: uploadResult.file_url });
      await queryClient.invalidateQueries({ queryKey: ["me"] });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeletingAccount(true);

    try {
      const currentUser = await base44.auth.me();

      const statsList = await base44.entities.UserStats.filter({
        created_by: currentUser.email,
      }).catch(() => []);

      for (const record of statsList) {
        await base44.entities.UserStats.delete(record.id).catch(() => {});
      }

      const favoritesList = await base44.entities.UserFavorite.filter({
        created_by: currentUser.email,
      }).catch(() => []);

      for (const favorite of favoritesList) {
        await base44.entities.UserFavorite.delete(favorite.id).catch(() => {});
      }
    } finally {
      await base44.auth.logout();
    }
  };

  if (!user) {
    return <GuestProfile />;
  }

  const now = new Date();
  const expiry = stats?.premium_expiry ? new Date(stats.premium_expiry) : null;
  const isActivePremium = Boolean(stats?.is_premium && expiry && expiry > now);
  const billingStatus = stats?.billing_status || "free";

  const impactStats = [
    {
      icon: Flame,
      label: "Calories avoided",
      value: Number(stats?.estimated_calories_avoided || 0).toLocaleString(),
      color: "text-primary",
    },
    {
      icon: DollarSign,
      label: "Money saved",
      value: `$${Number(stats?.estimated_money_saved || 0).toFixed(0)}`,
      color: "text-chart-4",
    },
    {
      icon: Zap,
      label: "Recipes made",
      value: Number(stats?.saved_recipes_count || 0),
      color: "text-chart-3",
    },
    {
      icon: TrendingDown,
      label: "Restaurants",
      value: Number(stats?.saved_restaurants_count || 0),
      color: "text-chart-2",
    },
  ];

  const avatarUrl = user.avatar_url;
  const initials =
    user.full_name
      ?.split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?";

  return (
    <div className="min-h-screen bg-background pb-8">
      <div className="relative overflow-hidden rounded-b-3xl bg-foreground px-5 pb-6 pt-14">
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 50%, hsl(0 78% 48%) 0%, transparent 55%)",
          }}
        />

        <div className="relative mb-4 flex items-center gap-4">
          <div className="relative flex-shrink-0">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/30 to-primary/10 text-2xl font-black text-primary">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                initials
              )}
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhoto}
              className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-foreground bg-primary"
            >
              {uploadingPhoto ? (
                <Loader2 className="h-3 w-3 animate-spin text-white" />
              ) : (
                <Camera className="h-3 w-3 text-white" />
              )}
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-black uppercase tracking-widest text-background/40">
              Account
            </p>
            <h2 className="truncate text-xl font-black text-background">
              {user.full_name || "User"}
            </h2>
            <p className="mt-0.5 truncate text-xs text-background/55">
              {user.email}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {isActivePremium ? (
            <div className="inline-flex items-center gap-1.5 rounded-full border border-chart-4/40 bg-chart-4/25 px-3 py-1.5 text-xs font-bold text-chart-4">
              <Crown className="h-3 w-3" />
              Premium Active
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 rounded-full border border-background/20 bg-background/15 px-3 py-1.5 text-xs font-bold text-background/60">
              <CreditCard className="h-3 w-3" />
              {billingStatus === "past_due" ? "Billing Issue" : "Basic Plan"}
            </div>
          )}
        </div>
      </div>

      {checkoutSuccess && (
        <div className="mx-5 mt-4 rounded-2xl border border-chart-3/20 bg-chart-3/10 px-4 py-3">
          <p className="text-sm font-bold text-foreground">
            Payment complete
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Your subscription is being synced to your account.
          </p>
        </div>
      )}

      {checkoutCanceled && (
        <div className="mx-5 mt-4 rounded-2xl border border-chart-4/20 bg-chart-4/10 px-4 py-3">
          <p className="text-sm font-bold text-foreground">
            Checkout canceled
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            No charge was made.
          </p>
        </div>
      )}

      <div className="mt-5 px-5">
        <p className="mb-3 text-xs font-black uppercase tracking-widest text-muted-foreground">
          Your Health Impact
        </p>

        <div className="grid grid-cols-2 gap-3">
          {impactStats.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              className="rounded-2xl border border-border bg-card p-3"
            >
              <item.icon className={`mb-2 h-4 w-4 ${item.color}`} />
              <p className={`text-xl font-black ${item.color}`}>{item.value}</p>
              <p className="text-[10px] font-medium text-muted-foreground">
                {item.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="mt-4 px-5">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl border border-border bg-card p-4"
        >
          <div className="mb-3 flex items-center gap-2">
            <ChefHat className="h-4 w-4 text-primary" />
            <p className="text-sm font-bold text-foreground">Cooking Skill Level</p>
          </div>

          <div className="mb-3 grid grid-cols-4 gap-2">
            {Object.entries(skillLabels).map(([level, label]) => (
              <button
                key={level}
                onClick={() =>
                  updateStatsMutation.mutate({
                    cooking_skill_level: Number(level),
                  })
                }
                className={`rounded-xl border p-2 text-center transition-all ${
                  Number(stats?.cooking_skill_level || 1) === Number(level)
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-transparent bg-secondary text-muted-foreground"
                }`}
              >
                <p className="text-[11px] font-black">{label}</p>
              </button>
            ))}
          </div>

          <p className="text-xs text-muted-foreground">
            {skillDescriptions[stats?.cooking_skill_level || 1]}
          </p>
        </motion.div>
      </div>

      <div className="mt-3 px-5">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-2xl border border-border bg-card p-4"
        >
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              <p className="text-sm font-bold text-foreground">My Pantry</p>
            </div>

            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
              {asArray(stats?.pantry_items).length} items
            </span>
          </div>

          <p className="text-xs text-muted-foreground">
            Track what you already have at home
          </p>
        </motion.div>
      </div>

      {!isActivePremium && (
        <div className="mt-3 px-5">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="overflow-hidden rounded-2xl bg-gradient-to-br from-foreground to-foreground/90"
          >
            <div className="p-5">
              <div className="mb-1 flex items-center gap-2">
                <Crown className="h-4 w-4 text-chart-4" />
                <p className="text-sm font-black text-background">Go Premium</p>
              </div>

              <p className="mb-4 text-xs text-background/55">
                Premium unlocks every paid feature in Better Food.
              </p>

              <div className="mb-4 grid grid-cols-2 gap-x-4 gap-y-1.5">
                {[
                  "Healthier swaps",
                  "Guided cooking",
                  "Ingredient pricing",
                  "Nearby stores",
                  "Advanced macros",
                  "Photo uploads",
                  "Pantry tracking",
                  "Portion scaling",
                ].map((feature) => (
                  <div key={feature} className="flex items-center gap-1.5">
                    <span className="text-xs text-chart-3">✓</span>
                    <span className="text-[11px] text-background/70">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mb-3 rounded-xl bg-background/8 p-3">
                <p className="mb-2 text-center text-[10px] font-bold uppercase tracking-wider text-background/50">
                  Choose your billing
                </p>

                <div className="mb-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPlan(BILLING_INTERVALS.MONTHLY)}
                    className={`rounded-xl py-3 text-sm font-black transition-all ${
                      selectedPlan === BILLING_INTERVALS.MONTHLY
                        ? "bg-primary text-white"
                        : "border border-background/25 bg-background/15 text-background"
                    }`}
                  >
                    $4.99/mo
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedPlan(BILLING_INTERVALS.YEARLY)}
                    className={`relative rounded-xl py-3 text-sm font-black transition-all ${
                      selectedPlan === BILLING_INTERVALS.YEARLY
                        ? "bg-primary text-white"
                        : "border border-background/25 bg-background/15 text-background"
                    }`}
                  >
                    $29.99/yr
                    <span className="absolute -right-1 -top-2 rounded-full bg-chart-3 px-1.5 py-0.5 text-[8px] font-black text-white">
                      SAVE 50%
                    </span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleSubscribe(selectedPlan)}
                  disabled={startCheckoutMutation.isPending}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-chart-4 text-sm font-black text-foreground transition-all hover:opacity-90 disabled:opacity-60"
                >
                  {startCheckoutMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CreditCard className="h-4 w-4" />
                  )}
                  Start Secure Checkout
                </button>
              </div>

              <p className="text-center text-[10px] text-background/35">
                Cancel anytime
              </p>
            </div>
          </motion.div>
        </div>
      )}

      {isActivePremium && (
        <div className="mt-3 px-5">
          <div className="rounded-2xl border border-chart-4/20 bg-chart-4/8 p-4">
            <div className="mb-1 flex items-center gap-2">
              <Crown className="h-4 w-4 text-chart-4" />
              <p className="text-sm font-bold text-chart-4">
                Premium Active
              </p>
            </div>

            <p className="text-xs text-muted-foreground">
              {stats?.billing_interval === "yearly"
                ? "Yearly subscription"
                : "Monthly subscription"}
              {expiry ? ` · active until ${expiry.toLocaleDateString()}` : ""}
            </p>
          </div>
        </div>
      )}

      <div className="mt-3 px-5">
        <ReferralSection user={user} />
      </div>

      <div className="mt-3 px-5">
        <NotificationSettings />
      </div>

      {isSuperAdmin(user) && (
        <div className="mt-3 px-5">
          <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-foreground to-foreground/90">
            <div className="flex items-center gap-2 border-b border-background/10 px-4 pb-1 pt-3">
              <ShieldCheck className="h-4 w-4 text-chart-4" />
              <span className="text-xs font-black uppercase tracking-wider text-chart-4">
                Admin Mode Active
              </span>
              <span className="ml-auto rounded-full border border-chart-4/40 bg-chart-4/25 px-2 py-0.5 text-[9px] font-black text-chart-4">
                SUPER ADMIN
              </span>
            </div>

            <div className="p-4">
              <p className="mb-3 text-xs text-background/55">
                Full system access enabled for this account.
              </p>

              <Link
                to={createPageUrl("AdminDashboard")}
                className="flex w-full items-center gap-3 rounded-xl border border-background/20 bg-background/10 px-4 py-3 transition-colors hover:bg-background/15 active:scale-[0.98]"
              >
                <Settings className="h-4 w-4 text-background" />
                <span className="text-sm font-bold text-background">
                  Open Admin Dashboard
                </span>
                <span className="ml-auto text-lg text-background/40">›</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 px-5">
        <Button
          variant="ghost"
          onClick={() => base44.auth.logout()}
          className="h-12 w-full justify-start rounded-2xl text-muted-foreground hover:bg-destructive/5 hover:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>

      <div className="mb-6 mt-1 px-5">
        {!showDeleteConfirm ? (
          <Button
            variant="ghost"
            onClick={() => setShowDeleteConfirm(true)}
            className="h-12 w-full justify-start rounded-2xl text-muted-foreground/60 hover:bg-destructive/5 hover:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Account
          </Button>
        ) : (
          <div className="space-y-3 rounded-2xl border border-destructive/20 bg-destructive/8 p-4">
            <div className="flex items-start gap-3">
              <Trash2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-destructive" />
              <div>
                <p className="text-sm font-bold text-foreground">
                  Delete your account?
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  This action cannot be undone. Your data will be permanently removed.
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="h-10 flex-1 rounded-xl text-sm"
                disabled={deletingAccount}
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>

              <Button
                className="h-10 flex-1 rounded-xl bg-destructive text-sm text-white hover:bg-destructive/90"
                disabled={deletingAccount}
                onClick={handleDeleteAccount}
              >
                {deletingAccount ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Yes, Delete"
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}