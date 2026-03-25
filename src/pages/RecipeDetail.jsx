import React, { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Heart,
  Sparkles,
  Loader2,
  ChefHat,
  Clock,
  Users,
  TrendingDown,
  Zap,
  DollarSign,
  ShieldCheck,
  Share2,
  Lock,
  Crown,
} from "lucide-react";
import { motion } from "framer-motion";

import { createPageUrl } from "../utils";
import { base44 } from "../api/base44Client.js";
import { Analytics } from "../components/infra/analytics.jsx";
import { Quota } from "../components/infra/quota.jsx";
import { RateLimit } from "../components/infra/rateLimit.jsx";
import { generateAndStoreRecipe } from "../components/infra/recipeWorker.jsx";
import ShareCard from "../components/shared/ShareCard.jsx";
import NutritionComparison from "../components/recipe/NutritionComparison.jsx";
import IngredientTable from "../components/recipe/IngredientTable.jsx";
import IngredientBuying from "../components/recipe/IngredientBuying.jsx";
import PriceComparison from "../components/recipe/PriceComparison.jsx";
import CookingSteps from "../components/recipe/CookingSteps.jsx";
import DifficultyBadge from "../components/shared/DifficultyBadge.jsx";
import RecipeTimeBar from "../components/recipe/RecipeTimeBar.jsx";
import { Button } from "../components/ui/button.jsx";

function AdvantageCard({ icon: Icon, title, value, sub, color, bgColor, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`relative flex flex-col gap-1 overflow-hidden rounded-2xl border p-4 ${bgColor}`}
    >
      <div className="absolute right-0 top-0 h-16 w-16 translate-x-6 -translate-y-6 rounded-full bg-current opacity-10" />
      <Icon className={`mb-1 h-4 w-4 ${color}`} />
      <p className={`text-xl font-black ${color}`}>{value}</p>
      <p className="text-[11px] font-bold text-foreground">{title}</p>
      <p className="text-[10px] text-muted-foreground">{sub}</p>
    </motion.div>
  );
}

function PremiumLockCard({ feature }) {
  const messages = {
    swaps: {
      title: "Unlock Healthier Swaps",
      desc: "See premium ingredient replacements for the best health upgrades.",
      emoji: "🥗",
    },
    cooking: {
      title: "Unlock Cooking Mode",
      desc: "Use guided step by step cooking with timers and progress tracking.",
      emoji: "👨‍🍳",
    },
  };

  const message = messages[feature] || messages.swaps;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/8 via-primary/5 to-transparent p-5 text-center"
    >
      <div className="mb-3 text-3xl">{message.emoji}</div>
      <h3 className="text-sm font-black text-foreground">{message.title}</h3>
      <p className="mb-4 mt-1 text-xs leading-relaxed text-muted-foreground">
        {message.desc}
      </p>
      <Link
        to={createPageUrl("Profile")}
        className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white"
      >
        <Crown className="h-4 w-4" />
        Start 7-Day Free Trial
      </Link>
    </motion.div>
  );
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

export default function RecipeDetail() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();

  const menuItemId = searchParams.get("menuItemId") || "";
  const restaurantId = searchParams.get("restaurantId") || "";

  const [servings, setServings] = useState(1);
  const [showShare, setShowShare] = useState(false);
  const [ingredientView, setIngredientView] = useState("original");
  const [cookingMode, setCookingMode] = useState(null);

  const { data: accessData } = useQuery({
    queryKey: ["accessLevel"],
    queryFn: async () => {
      try {
        const user = await base44.auth.me();
        if (!user) return { level: "guest", user: null };

        const statsList = await base44.entities.UserStats.filter({
          created_by: user.email,
        });
        const stats = statsList[0];
        const now = new Date();
        const expiry = stats?.premium_expiry ? new Date(stats.premium_expiry) : null;

        if (stats?.is_premium && expiry && expiry > now) {
          return { level: "premium", user };
        }

        if (expiry && expiry > now) {
          return { level: "trial", user };
        }

        return { level: "basic", user };
      } catch {
        return { level: "guest", user: null };
      }
    },
    initialData: { level: "basic", user: null },
  });

  const accessLevel = accessData?.level || "basic";
  const isPremium = accessLevel === "premium" || accessLevel === "trial";

  const { data: menuItem = null } = useQuery({
    queryKey: ["menuItem", menuItemId],
    enabled: Boolean(menuItemId),
    queryFn: async () => {
      const result = await base44.entities.MenuItem.filter({ id: menuItemId });
      return asArray(result)[0] || null;
    },
    initialData: null,
  });

  const { data: restaurant = null } = useQuery({
    queryKey: ["restaurant", restaurantId],
    enabled: Boolean(restaurantId),
    queryFn: async () => {
      const result = await base44.entities.Restaurant.filter({ id: restaurantId });
      return asArray(result)[0] || null;
    },
    initialData: null,
  });

  const {
    data: recipe = null,
    isLoading: recipeLoading,
    refetch: refetchRecipe,
  } = useQuery({
    queryKey: ["recipe", menuItemId],
    enabled: Boolean(menuItemId),
    queryFn: async () => {
      const result = await base44.entities.Recipe.filter({
        menu_item_id: menuItemId,
      });
      return asArray(result)[0] || null;
    },
    initialData: null,
  });

  const { data: favoriteRecord = null } = useQuery({
    queryKey: ["favoriteRecipe", menuItemId],
    enabled: Boolean(menuItemId) && accessLevel !== "guest",
    queryFn: async () => {
      const user = await base44.auth.me();
      const result = await base44.entities.UserFavorite.filter({
        item_id: menuItemId,
        created_by: user.email,
      });
      return asArray(result)[0] || null;
    },
    initialData: null,
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      if (favoriteRecord?.id) {
        await base44.entities.UserFavorite.delete(favoriteRecord.id);
        return null;
      }

      return base44.entities.UserFavorite.create({
        item_type: "recipe",
        item_id: menuItemId,
        item_name: menuItem?.name || "",
        restaurant_id: restaurant?.id || "",
        restaurant_name: restaurant?.name || "",
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["favoriteRecipe", menuItemId] });
      await queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
  });

  const generateRecipeMutation = useMutation({
    mutationFn: async () => {
      const currentUser = await base44.auth.me().catch(() => null);

      const rateLimitResult = RateLimit.check(
        `recipe_gen_${currentUser?.email || "anonymous"}`,
        currentUser ? "authenticated" : "anonymous"
      );

      if (!rateLimitResult.allowed) {
        throw new Error(rateLimitResult.error?.message || "Too many requests.");
      }

      if (currentUser?.email) {
        const userStatsList = await base44.entities.UserStats.filter({
          created_by: currentUser.email,
        }).catch(() => []);

        const premiumActive = Boolean(userStatsList[0]?.is_premium);

        const quotaResult = await Quota.checkAndConsume(
          Quota.ACTIONS.RECIPE_GENERATION,
          currentUser.email,
          premiumActive
        );

        if (!quotaResult.allowed) {
          throw new Error(
            `Daily limit reached (${quotaResult.limit} recipes/day).`
          );
        }
      }

      const result = await generateAndStoreRecipe(menuItem, restaurant);

      if (!result?.success && !result?.recipe) {
        throw new Error(result?.error || "Recipe generation failed.");
      }

      Analytics.recipeGenerated(menuItemId);
      return result;
    },
    onSuccess: async () => {
      await refetchRecipe();
      await queryClient.invalidateQueries({ queryKey: ["recipe", menuItemId] });
    },
  });

  const handleIngredientToggle = async (index) => {
    if (!recipe?.id || !Array.isArray(recipe.ingredients)) return;

    const updatedIngredients = [...recipe.ingredients];
    updatedIngredients[index] = {
      ...updatedIngredients[index],
      accepted: !updatedIngredients[index]?.accepted,
    };

    await base44.entities.Recipe.update(recipe.id, {
      ingredients: updatedIngredients,
    });

    await refetchRecipe();
  };

  const totalTime =
    Number(recipe?.prep_time_minutes || 0) + Number(recipe?.cook_time_minutes || 0);

  const calorieDifference =
    Number(menuItem?.original_calories || 0) - Number(recipe?.better_calories || 0);

  const proteinDifference =
    Number(recipe?.better_protein || 0) - Number(menuItem?.original_protein || 0);

  const scaledIngredients = useMemo(() => {
    return asArray(recipe?.ingredients).map((ingredient) => ({
      ...ingredient,
      quantity:
        servings > 1
          ? `${ingredient.quantity || ""} (×${servings})`
          : ingredient.quantity,
    }));
  }, [recipe?.ingredients, servings]);

  if (!menuItemId) {
    return (
      <div className="min-h-screen bg-background pb-8">
        <div className="px-5 pt-16">
          <Link
            to={createPageUrl("Explore")}
            className="inline-flex items-center gap-2 text-muted-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Explore</span>
          </Link>

          <div className="py-16 text-center">
            <h1 className="text-xl font-black text-foreground">Missing menu item</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              This page needs a valid menu item before it can load.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-40">
      <div className="relative overflow-hidden bg-foreground">
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 80% 20%, hsl(0 78% 48%) 0%, transparent 55%), radial-gradient(circle at 20% 80%, hsl(217 91% 65%) 0%, transparent 50%)",
          }}
        />

        <div className="relative px-5 pb-6 pt-14">
          <div className="mb-5 flex items-center justify-between">
            <Link
              to={createPageUrl(`RestaurantDetail?id=${restaurantId}`)}
              className="flex items-center gap-2 text-background/55"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm font-medium">
                {restaurant?.name || "Back"}
              </span>
            </Link>

            <div className="flex items-center gap-2">
              {recipe ? (
                <button
                  onClick={() => setShowShare(true)}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl border border-background/20 bg-background/10 text-background/60"
                >
                  <Share2 className="h-4 w-4" />
                </button>
              ) : null}

              {accessLevel !== "guest" ? (
                <button
                  onClick={() => toggleFavoriteMutation.mutate()}
                  className={`flex h-10 w-10 items-center justify-center rounded-2xl border transition-all ${
                    favoriteRecord
                      ? "border-primary/50 bg-primary/30 text-primary"
                      : "border-background/20 bg-background/10 text-background/60"
                  }`}
                >
                  <Heart
                    className={`h-4 w-4 ${favoriteRecord ? "fill-primary text-primary" : ""}`}
                  />
                </button>
              ) : null}
            </div>
          </div>

          <div className="mb-4">
            <p className="text-[11px] font-black uppercase tracking-widest text-background/40">
              Better Version
            </p>
            <h1 className="mt-1 text-2xl font-black leading-tight text-background">
              {recipe?.title || menuItem?.name || "Recipe"}
            </h1>
            <p className="mt-0.5 text-sm font-medium text-background/60">
              {restaurant?.name}
            </p>

            {recipe ? (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex items-center gap-1 rounded-full border border-background/15 bg-background/10 px-3 py-1">
                  <Clock className="h-3 w-3 text-background/60" />
                  <span className="text-[11px] font-bold text-background/60">
                    {totalTime} min total
                  </span>
                </div>
                <DifficultyBadge level={recipe.difficulty_level || 1} />
              </div>
            ) : null}
          </div>

          {recipe ? (
            <div className="flex flex-wrap gap-2">
              {calorieDifference > 0 ? (
                <span className="rounded-full border border-primary/30 bg-primary/25 px-3 py-1.5 text-[11px] font-black text-primary">
                  -{calorieDifference} cal
                </span>
              ) : null}

              {proteinDifference > 0 ? (
                <span className="rounded-full border border-chart-3/30 bg-chart-3/25 px-3 py-1.5 text-[11px] font-black text-chart-3">
                  +{proteinDifference}g protein
                </span>
              ) : null}

              {Number(recipe.savings_amount || 0) > 0 ? (
                <span className="rounded-full border border-chart-4/30 bg-chart-4/25 px-3 py-1.5 text-[11px] font-black text-chart-4">
                  save ${Number(recipe.savings_amount).toFixed(2)}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-4 space-y-4 px-5">
        {!recipe && !generateRecipeMutation.isPending && !recipeLoading ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 text-center"
          >
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15">
              <Sparkles className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-lg font-black text-foreground">
              Generate Better Recipe
            </h3>
            <p className="mb-5 mt-1 text-sm leading-relaxed text-muted-foreground">
              AI will recreate this dish with healthier ingredients, more protein, and lower cost.
            </p>

            <Button
              onClick={() => generateRecipeMutation.mutate()}
              className="glow-red h-12 w-full rounded-2xl bg-primary text-sm font-bold hover:bg-primary/90"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Better Recipe
            </Button>
          </motion.div>
        ) : null}

        {generateRecipeMutation.isPending || recipeLoading ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-bold text-foreground">
              Crafting your better recipe...
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Analyzing nutrition and finding ingredient swaps
            </p>
          </div>
        ) : null}

        {generateRecipeMutation.isError ? (
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
            <p className="text-sm font-bold text-foreground">Recipe generation failed</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {generateRecipeMutation.error?.message || "Please try again."}
            </p>
          </div>
        ) : null}

        {recipe ? (
          <>
            <PriceComparison
              originalPrice={menuItem?.original_price_estimate}
              homemadePrice={recipe.homemade_cost_estimate}
              savings={recipe.savings_amount}
            />

            <div>
              <p className="mb-2 text-xs font-black uppercase tracking-widest text-muted-foreground">
                Better Food Advantage
              </p>
              <div className="grid grid-cols-2 gap-3">
                <AdvantageCard
                  icon={TrendingDown}
                  title="Calories Saved"
                  value={calorieDifference > 0 ? `-${calorieDifference}` : "0"}
                  sub="vs. restaurant version"
                  color="text-primary"
                  bgColor="bg-primary/5 border-primary/15"
                  delay={0.05}
                />
                <AdvantageCard
                  icon={Zap}
                  title="Protein Boost"
                  value={
                    proteinDifference > 0
                      ? `+${proteinDifference}g`
                      : `${recipe.better_protein || 0}g`
                  }
                  sub="per serving made"
                  color="text-chart-3"
                  bgColor="bg-chart-3/5 border-chart-3/15"
                  delay={0.08}
                />
                <AdvantageCard
                  icon={DollarSign}
                  title="Money Saved"
                  value={`$${Number(recipe.savings_amount || 0).toFixed(2)}`}
                  sub="cheaper than takeout"
                  color="text-chart-4"
                  bgColor="bg-chart-4/5 border-chart-4/15"
                  delay={0.11}
                />
                <AdvantageCard
                  icon={ShieldCheck}
                  title="Sodium Cut"
                  value={`-${Math.max(
                    0,
                    Math.round(
                      Number(menuItem?.original_sodium || 0) -
                        Number(recipe?.better_sodium || 0)
                    )
                  )}mg`}
                  sub="less sodium intake"
                  color="text-chart-2"
                  bgColor="bg-chart-2/5 border-chart-2/15"
                  delay={0.14}
                />
              </div>
            </div>

            <RecipeTimeBar
              prepTime={recipe.prep_time_minutes}
              cookTime={recipe.cook_time_minutes}
            />

            <NutritionComparison menuItem={menuItem} recipe={recipe} />

            {isPremium ? (
              <div className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-bold text-foreground">
                    Servings
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setServings((current) => Math.max(1, current - 1))}
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-lg font-bold text-foreground"
                  >
                    −
                  </button>
                  <span className="w-6 text-center text-xl font-black text-foreground">
                    {servings}
                  </span>
                  <button
                    onClick={() => setServings((current) => current + 1)}
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-lg font-bold text-white"
                  >
                    +
                  </button>
                </div>
              </div>
            ) : null}

            <div>
              <p className="mb-2 text-xs font-black uppercase tracking-widest text-muted-foreground">
                Ingredients
              </p>

              <div className="mb-3 flex gap-1 rounded-xl bg-secondary p-1">
                <button
                  onClick={() => setIngredientView("original")}
                  className={`flex-1 rounded-lg py-2.5 text-xs font-bold transition-all ${
                    ingredientView === "original"
                      ? "border border-border bg-card text-foreground shadow-sm"
                      : "text-muted-foreground"
                  }`}
                >
                  Original Ingredients
                </button>

                <button
                  onClick={() => setIngredientView("swaps")}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-bold transition-all ${
                    ingredientView === "swaps" && isPremium
                      ? "bg-primary text-white shadow-sm"
                      : ingredientView === "swaps" && !isPremium
                        ? "border border-border bg-card text-muted-foreground"
                        : "text-muted-foreground"
                  }`}
                >
                  {!isPremium ? <Lock className="h-3 w-3" /> : null}
                  Healthier Swaps
                </button>
              </div>

              {ingredientView === "original" ? (
                <IngredientTable
                  ingredients={scaledIngredients}
                  onToggle={handleIngredientToggle}
                  isPremium={isPremium}
                  view="original"
                />
              ) : isPremium ? (
                <IngredientTable
                  ingredients={scaledIngredients}
                  onToggle={handleIngredientToggle}
                  isPremium={isPremium}
                  view="swaps"
                />
              ) : (
                <PremiumLockCard feature="swaps" />
              )}
            </div>

            <IngredientBuying
              ingredients={recipe.ingredients}
              isPremium={isPremium}
            />

            <div>
              {isPremium ? (
                <>
                  {!cookingMode ? (
                    <div className="space-y-2">
                      <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                        Cook It
                      </p>

                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => setCookingMode("overview")}
                          className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-4 transition-transform active:scale-95"
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
                            <ChefHat className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <span className="text-xs font-bold text-foreground">
                            Full Recipe
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            All steps at once
                          </span>
                        </button>

                        <button
                          onClick={() => {
                            setCookingMode("guided");
                            Analytics.cookingModeStarted("guided");
                          }}
                          className="flex flex-col items-center gap-2 rounded-2xl border border-primary/30 bg-primary/5 p-4 transition-transform active:scale-95"
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
                            <ChefHat className="h-5 w-5 text-primary" />
                          </div>
                          <span className="text-xs font-bold text-primary">
                            Guided Mode
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            Step by step
                          </span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => setCookingMode(null)}
                        className="mb-3 flex items-center gap-1 text-xs font-medium text-muted-foreground"
                      >
                        <ArrowLeft className="h-3 w-3" />
                        Change cooking mode
                      </button>

                      <CookingSteps
                        steps={recipe.steps}
                        isGuidedMode={cookingMode === "guided"}
                      />
                    </>
                  )}
                </>
              ) : (
                <PremiumLockCard feature="cooking" />
              )}
            </div>
          </>
        ) : null}
      </div>

      {showShare && recipe ? (
        <ShareCard
          recipe={recipe}
          menuItem={menuItem}
          onClose={() => setShowShare(false)}
        />
      ) : null}

      {recipe && !cookingMode && isPremium ? (
        <div
          className="fixed left-1/2 z-40 w-full max-w-lg -translate-x-1/2 border-t border-border bg-background/95 px-5 pb-2 pt-2 backdrop-blur-xl"
          style={{ bottom: "calc(4rem + env(safe-area-inset-bottom))" }}
        >
          <button
            onClick={() => {
              setCookingMode("guided");
              Analytics.cookingModeStarted("guided");
            }}
            className="glow-red flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-bold text-white transition-transform active:scale-[0.98]"
          >
            <ChefHat className="h-5 w-5" />
            Start Cooking
          </button>
        </div>
      ) : null}
    </div>
  );
}