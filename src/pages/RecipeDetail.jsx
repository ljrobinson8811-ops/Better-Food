import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, Heart, Sparkles, Loader2, ChefHat, Clock, Users,
  TrendingDown, Zap, DollarSign, ShieldCheck, Share2, Lock, Crown
} from "lucide-react";
import ShareCard from "@/components/shared/ShareCard";
import { Analytics } from "@/components/infra/analytics";
import { generateAndStoreRecipe } from "@/components/infra/recipeWorker";
import { Quota } from "@/components/infra/quota";
import { RateLimit } from "@/components/infra/rateLimit";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import NutritionComparison from "@/components/recipe/NutritionComparison";
import IngredientTable from "@/components/recipe/IngredientTable";
import IngredientBuying from "@/components/recipe/IngredientBuying";
import PriceComparison from "@/components/recipe/PriceComparison";
import CookingSteps from "@/components/recipe/CookingSteps";
import DifficultyBadge from "@/components/shared/DifficultyBadge";
import RecipeTimeBar from "@/components/recipe/RecipeTimeBar";

function AdvantageCard({ icon: Icon, title, value, sub, color, bgColor, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`rounded-2xl border p-4 flex flex-col gap-1 relative overflow-hidden ${bgColor}`}
    >
      <div className="absolute top-0 right-0 w-16 h-16 rounded-full opacity-10 bg-current -translate-y-6 translate-x-6" />
      <Icon className={`w-4 h-4 ${color} mb-1`} />
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
      desc: "Discover which ingredients to replace for maximum health benefits",
      emoji: "🥗",
    },
    cooking: {
      title: "Unlock Cooking Mode",
      desc: "Step-by-step guided cooking with built-in timers and progress tracking",
      emoji: "👨‍🍳",
    },
  };
  const msg = messages[feature] || messages.swaps;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-primary/8 via-primary/5 to-transparent border border-primary/20 rounded-2xl p-5 text-center"
    >
      <div className="text-3xl mb-3">{msg.emoji}</div>
      <h3 className="text-sm font-black text-foreground">{msg.title}</h3>
      <p className="text-xs text-muted-foreground mt-1 mb-4 leading-relaxed">{msg.desc}</p>
      <Link
        to={createPageUrl("Profile")}
        className="inline-flex items-center gap-2 bg-primary text-white rounded-xl px-5 py-2.5 text-sm font-bold"
      >
        <Crown className="w-4 h-4" />
        Start 7-Day Free Trial
      </Link>
    </motion.div>
  );
}

export default function RecipeDetail() {
  const params = new URLSearchParams(window.location.search);
  const menuItemId = params.get("menuItemId");
  const restaurantId = params.get("restaurantId");
  const [generating, setGenerating] = useState(false);
  const [cookingMode, setCookingMode] = useState(null);
  const [servings, setServings] = useState(1);
  const [showShare, setShowShare] = useState(false);
  const [ingredientView, setIngredientView] = useState("original");
  const queryClient = useQueryClient();

  // Determine user access level
  const { data: accessData } = useQuery({
    queryKey: ["accessLevel"],
    queryFn: async () => {
      try {
        const me = await base44.auth.me();
        if (!me) return { level: "guest", user: null };
        const statsItems = await base44.entities.UserStats.filter({ created_by: me.email });
        const s = statsItems[0];
        if (!s) return { level: "basic", user: me };
        const now = new Date();
        const expiry = s.premium_expiry ? new Date(s.premium_expiry) : null;
        if (s.is_premium && expiry && expiry > now) return { level: "premium", user: me };
        if (expiry && expiry > now) return { level: "trial", user: me };
        return { level: "basic", user: me };
      } catch {
        return { level: "guest", user: null };
      }
    },
    initialData: { level: "basic", user: null },
  });
  const accessLevel = accessData?.level || "basic";
  const isPremium = accessLevel === "premium" || accessLevel === "trial";

  const { data: menuItem } = useQuery({
    queryKey: ["menuItem", menuItemId],
    queryFn: () => base44.entities.MenuItem.filter({ id: menuItemId }),
    select: d => d[0],
    enabled: !!menuItemId,
  });

  const { data: restaurant } = useQuery({
    queryKey: ["restaurant", restaurantId],
    queryFn: () => base44.entities.Restaurant.filter({ id: restaurantId }),
    select: d => d[0],
    enabled: !!restaurantId,
  });

  const { data: recipe, refetch: refetchRecipe } = useQuery({
    queryKey: ["recipe", menuItemId],
    queryFn: () => base44.entities.Recipe.filter({ menu_item_id: menuItemId }),
    select: d => d[0],
    enabled: !!menuItemId,
  });

  const { data: isFavorited } = useQuery({
    queryKey: ["fav", menuItemId],
    queryFn: async () => {
      const me = await base44.auth.me();
      const favs = await base44.entities.UserFavorite.filter({ item_id: menuItemId, created_by: me.email });
      return favs.length > 0 ? favs[0] : null;
    },
    enabled: !!menuItemId && accessLevel !== "guest",
  });

  const toggleFav = useMutation({
    mutationFn: async () => {
      if (isFavorited) {
        await base44.entities.UserFavorite.delete(isFavorited.id);
      } else {
        await base44.entities.UserFavorite.create({
          item_type: "recipe", item_id: menuItemId,
          item_name: menuItem?.name, restaurant_name: restaurant?.name,
        });
      }
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["fav", menuItemId] });
      const prev = queryClient.getQueryData(["fav", menuItemId]);
      // Optimistically toggle: if favorited set to null, else set a placeholder truthy value
      queryClient.setQueryData(["fav", menuItemId], prev ? null : { id: "optimistic" });
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev !== undefined) queryClient.setQueryData(["fav", menuItemId], context.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["fav", menuItemId] }),
  });

  const handleGenerateRecipe = async () => {
    const me = await base44.auth.me().catch(() => null);
    const rl = RateLimit.check(`recipe_gen_${me?.email ?? "anon"}`, me ? "authenticated" : "anonymous");
    if (!rl.allowed) { alert(rl.error.message); return; }

    if (me) {
      const statsItems = await base44.entities.UserStats.filter({ created_by: me.email }).catch(() => []);
      const isP = statsItems[0]?.is_premium ?? false;
      const quota = await Quota.checkAndConsume(Quota.ACTIONS.RECIPE_GENERATION, me.email, isP);
      if (!quota.allowed) {
        alert(`Daily limit reached (${quota.limit} recipes/day). ${isP ? "Contact support." : "Upgrade to Premium for more."}`);
        return;
      }
    }

    setGenerating(true);
    await generateAndStoreRecipe(menuItem, restaurant);
    Analytics.recipeGenerated(menuItemId);
    await refetchRecipe();
    setGenerating(false);
  };

  const handleIngredientToggle = async (index) => {
    if (!recipe) return;
    const newIngredients = [...recipe.ingredients];
    newIngredients[index] = { ...newIngredients[index], accepted: !newIngredients[index].accepted };
    await base44.entities.Recipe.update(recipe.id, { ingredients: newIngredients });
    refetchRecipe();
  };

  const calDiff = (menuItem?.original_calories || 0) - (recipe?.better_calories || 0);
  const protDiff = (recipe?.better_protein || 0) - (menuItem?.original_protein || 0);
  const totalTime = (recipe?.prep_time_minutes || 0) + (recipe?.cook_time_minutes || 0);

  const scaledIngredients = recipe?.ingredients?.map(ing => ({
    ...ing,
    quantity: servings > 1 ? `${ing.quantity} (×${servings})` : ing.quantity,
  }));

  return (
    <div className="min-h-screen bg-background pb-40">
      {/* Dark hero header */}
      <div className="bg-foreground relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 80% 20%, hsl(0 78% 48%) 0%, transparent 55%), radial-gradient(circle at 20% 80%, hsl(217 91% 65%) 0%, transparent 50%)",
          }}
        />

        <div className="relative px-5 pt-14 pb-6">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-5">
            <Link
              to={createPageUrl(`RestaurantDetail?id=${restaurantId}`)}
              className="flex items-center gap-2 text-background/55 hover:text-background/80 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">{restaurant?.name || "Back"}</span>
            </Link>
            <div className="flex items-center gap-2">
              {recipe && (
                <button
                  onClick={() => setShowShare(true)}
                  className="w-10 h-10 rounded-2xl border bg-background/10 border-background/20 text-background/60 flex items-center justify-center transition-all"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              )}
              {accessLevel !== "guest" && (
                <button
                  onClick={() => toggleFav.mutate()}
                  className={`w-10 h-10 rounded-2xl border flex items-center justify-center transition-all ${
                    isFavorited
                      ? "bg-primary/30 border-primary/50 text-primary"
                      : "bg-background/10 border-background/20 text-background/60"
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isFavorited ? "fill-primary text-primary" : ""}`} />
                </button>
              )}
            </div>
          </div>

          {/* Title & meta */}
          <div className="mb-4">
            <p className="text-background/40 text-[11px] font-black uppercase tracking-widest">Better Version</p>
            <h1 className="text-2xl font-black text-background leading-tight mt-1">
              {recipe?.title || menuItem?.name || "Recipe"}
            </h1>
            <p className="text-background/60 text-sm mt-0.5 font-medium">{restaurant?.name}</p>
            {recipe && (
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center gap-1 bg-background/10 border border-background/15 rounded-full px-3 py-1">
                  <Clock className="w-3 h-3 text-background/60" />
                  <span className="text-[11px] text-background/60 font-bold">{totalTime} min total</span>
                </div>
                <DifficultyBadge level={recipe.difficulty_level || 1} />
              </div>
            )}
          </div>

          {/* Key win chips */}
          {recipe && (
            <div className="flex gap-2 flex-wrap">
              {calDiff > 0 && (
                <span className="text-[11px] font-black bg-primary/25 text-primary border border-primary/30 px-3 py-1.5 rounded-full">
                  -{calDiff} cal
                </span>
              )}
              {protDiff > 0 && (
                <span className="text-[11px] font-black bg-chart-3/25 text-chart-3 border border-chart-3/30 px-3 py-1.5 rounded-full">
                  +{protDiff}g protein
                </span>
              )}
              {recipe.savings_amount > 0 && (
                <span className="text-[11px] font-black bg-chart-4/25 text-chart-4 border border-chart-4/30 px-3 py-1.5 rounded-full">
                  save ${recipe.savings_amount.toFixed(2)}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-5 mt-4 space-y-4">

        {/* Generate CTA */}
        {!recipe && !generating && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-2xl p-6 text-center"
          >
            <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-lg font-black text-foreground">Generate Better Recipe</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-5 leading-relaxed">
              AI will recreate this dish with healthier ingredients, more protein, and lower cost
            </p>
            <Button
              onClick={handleGenerateRecipe}
              className="bg-primary hover:bg-primary/90 rounded-2xl px-8 h-12 text-sm font-bold glow-red w-full"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Better Recipe
            </Button>
          </motion.div>
        )}

        {generating && (
          <div className="bg-card border border-border rounded-2xl p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
            <p className="text-sm font-bold text-foreground">Crafting your better recipe...</p>
            <p className="text-xs text-muted-foreground mt-1">Analyzing nutrition &amp; finding ingredient swaps</p>
          </div>
        )}

        {/* === RECIPE CONTENT (in required order) === */}
        {recipe && (
          <>
            {/* 1. Price comparison */}
            <PriceComparison
              originalPrice={menuItem?.original_price_estimate}
              homemadePrice={recipe.homemade_cost_estimate}
              savings={recipe.savings_amount}
            />

            {/* 2. Advantage cards */}
            <div>
              <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-2">Better Food Advantage</p>
              <div className="grid grid-cols-2 gap-3">
                <AdvantageCard
                  icon={TrendingDown} title="Calories Saved" delay={0.05}
                  value={calDiff > 0 ? `-${calDiff}` : "0"}
                  sub="vs. restaurant version"
                  color="text-primary" bgColor="bg-primary/5 border-primary/15"
                />
                <AdvantageCard
                  icon={Zap} title="Protein Boost" delay={0.08}
                  value={protDiff > 0 ? `+${protDiff}g` : `${recipe.better_protein || 0}g`}
                  sub="per serving made"
                  color="text-chart-3" bgColor="bg-chart-3/5 border-chart-3/15"
                />
                <AdvantageCard
                  icon={DollarSign} title="Money Saved" delay={0.11}
                  value={`$${(recipe.savings_amount || 0).toFixed(2)}`}
                  sub="cheaper than takeout"
                  color="text-chart-4" bgColor="bg-chart-4/5 border-chart-4/15"
                />
                <AdvantageCard
                  icon={ShieldCheck} title="Sodium Cut" delay={0.14}
                  value={`-${Math.max(0, Math.round((menuItem?.original_sodium || 0) - (recipe?.better_sodium || 0)))}mg`}
                  sub="less sodium intake"
                  color="text-chart-2" bgColor="bg-chart-2/5 border-chart-2/15"
                />
              </div>
            </div>

            {/* 3. Time bar */}
            <RecipeTimeBar prepTime={recipe.prep_time_minutes} cookTime={recipe.cook_time_minutes} />

            {/* 4. Nutrition comparison */}
            <NutritionComparison menuItem={menuItem} recipe={recipe} />

            {/* 5. Servings scaler (premium only) */}
            {isPremium && (
              <div className="flex items-center justify-between bg-card rounded-2xl border border-border px-4 py-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-bold text-foreground">Servings</span>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setServings(Math.max(1, servings - 1))}
                    className="w-9 h-9 rounded-xl bg-secondary text-foreground flex items-center justify-center text-lg font-bold"
                  >
                    −
                  </button>
                  <span className="text-xl font-black w-6 text-center text-foreground">{servings}</span>
                  <button
                    onClick={() => setServings(servings + 1)}
                    className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center text-lg font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* 6 & 7. INGREDIENT SECTION with toggle */}
            <div>
              <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-2">Ingredients</p>

              {/* Toggle: Original | Healthier Swaps */}
              <div className="flex bg-secondary rounded-xl p-1 gap-1 mb-3">
                <button
                  onClick={() => setIngredientView("original")}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${
                    ingredientView === "original"
                      ? "bg-card text-foreground shadow-sm border border-border"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Original Ingredients
                </button>
                <button
                  onClick={() => {
                    if (isPremium) setIngredientView("swaps");
                    else setIngredientView("swaps"); // still set so the lock card shows
                  }}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    ingredientView === "swaps" && isPremium
                      ? "bg-primary text-white shadow-sm"
                      : ingredientView === "swaps" && !isPremium
                        ? "bg-card text-muted-foreground border border-border"
                        : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {!isPremium && <Lock className="w-3 h-3" />}
                  Healthier Swaps
                </button>
              </div>

              {/* Ingredient content */}
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

            {/* 8. BUYING SECTION */}
            <IngredientBuying
              ingredients={recipe.ingredients}
              isPremium={isPremium}
            />

            {/* 9. COOKING SECTION */}
            <div>
              {isPremium ? (
                <>
                  {!cookingMode && (
                    <div className="space-y-2">
                      <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Cook It</p>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => setCookingMode("overview")}
                          className="rounded-2xl border border-border bg-card p-4 flex flex-col items-center gap-2 active:scale-95 transition-transform"
                        >
                          <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                            <ChefHat className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <span className="text-xs font-bold text-foreground">Full Recipe</span>
                          <span className="text-[10px] text-muted-foreground">All steps at once</span>
                        </button>
                        <button
                          onClick={() => setCookingMode("guided")}
                          className="rounded-2xl border border-primary/30 bg-primary/5 p-4 flex flex-col items-center gap-2 active:scale-95 transition-transform"
                        >
                          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                            <ChefHat className="w-5 h-5 text-primary" />
                          </div>
                          <span className="text-xs font-bold text-primary">Guided Mode</span>
                          <span className="text-[10px] text-muted-foreground">Step by step</span>
                        </button>
                      </div>
                    </div>
                  )}
                  {cookingMode && (
                    <>
                      <button
                        onClick={() => setCookingMode(null)}
                        className="text-xs text-muted-foreground font-medium flex items-center gap-1 mb-3"
                      >
                        <ArrowLeft className="w-3 h-3" /> Change cooking mode
                      </button>
                      <CookingSteps steps={recipe.steps} isGuidedMode={cookingMode === "guided"} />
                    </>
                  )}
                </>
              ) : (
                <PremiumLockCard feature="cooking" />
              )}
            </div>
          </>
        )}
      </div>

      {/* Share modal */}
      {showShare && (
        <ShareCard recipe={recipe} menuItem={menuItem} onClose={() => setShowShare(false)} />
      )}

      {/* Sticky Start Cooking CTA — positioned above bottom nav */}
      {recipe && !cookingMode && isPremium && (
        <div className="fixed bottom-16 left-1/2 -translate-x-1/2 w-full max-w-lg px-5 pb-2 pt-2 bg-background/95 backdrop-blur-xl border-t border-border z-40">
          <button
            onClick={() => setCookingMode("guided")}
            className="w-full bg-primary text-white rounded-2xl h-14 font-bold text-sm flex items-center justify-center gap-2 glow-red active:scale-[0.98] transition-transform"
          >
            <ChefHat className="w-5 h-5" />
            Start Cooking
          </button>
        </div>
      )}
    </div>
  );
}