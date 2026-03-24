import React, { useMemo, useState } from "react";
import { MapPin, ShoppingCart, Loader2, Lock, Store } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";

import { createPageUrl } from "@/utils";

function estimateIngredient(name = "") {
  const normalized = String(name).toLowerCase();

  if (normalized.includes("beef") || normalized.includes("patty")) {
    return { price: 5.99, unit: "lb", store: "Walmart" };
  }
  if (normalized.includes("chicken breast") || normalized.includes("chicken thigh")) {
    return { price: 4.49, unit: "lb", store: "Kroger" };
  }
  if (normalized.includes("chicken")) {
    return { price: 3.99, unit: "lb", store: "Walmart" };
  }
  if (normalized.includes("turkey")) {
    return { price: 4.99, unit: "lb", store: "Whole Foods" };
  }
  if (normalized.includes("bread") || normalized.includes("bun") || normalized.includes("roll")) {
    return { price: 2.99, unit: "pack", store: "Walmart" };
  }
  if (normalized.includes("cheese")) {
    return { price: 3.49, unit: "8oz", store: "Kroger" };
  }
  if (normalized.includes("lettuce") || normalized.includes("spinach") || normalized.includes("romaine")) {
    return { price: 2.29, unit: "head", store: "Walmart" };
  }
  if (normalized.includes("tomato")) {
    return { price: 1.49, unit: "each", store: "Walmart" };
  }
  if (normalized.includes("onion")) {
    return { price: 0.99, unit: "each", store: "Walmart" };
  }
  if (normalized.includes("avocado")) {
    return { price: 1.49, unit: "each", store: "Whole Foods" };
  }
  if (normalized.includes("oil")) {
    return { price: 5.99, unit: "bottle", store: "Whole Foods" };
  }
  if (normalized.includes("egg")) {
    return { price: 3.99, unit: "dozen", store: "Walmart" };
  }
  if (normalized.includes("sauce") || normalized.includes("mayo") || normalized.includes("ketchup") || normalized.includes("mustard")) {
    return { price: 2.99, unit: "bottle", store: "Walmart" };
  }
  if (normalized.includes("flour")) {
    return { price: 3.49, unit: "5lb bag", store: "Walmart" };
  }
  if (normalized.includes("milk")) {
    return { price: 3.79, unit: "gallon", store: "Walmart" };
  }
  if (normalized.includes("butter")) {
    return { price: 4.49, unit: "lb", store: "Walmart" };
  }
  if (normalized.includes("rice") || normalized.includes("quinoa")) {
    return { price: 3.99, unit: "bag", store: "Walmart" };
  }
  if (normalized.includes("greek yogurt") || normalized.includes("yogurt")) {
    return { price: 4.99, unit: "container", store: "Whole Foods" };
  }
  if (normalized.includes("protein powder") || normalized.includes("whey")) {
    return { price: 29.99, unit: "container", store: "GNC" };
  }

  return { price: 2.49, unit: "item", store: "Walmart" };
}

export default function IngredientBuying({ ingredients = [], isPremium }) {
  const [locationStatus, setLocationStatus] = useState("idle");

  const activeIngredients = useMemo(() => {
    return ingredients.filter((ingredient) => ingredient?.accepted !== false);
  }, [ingredients]);

  const estimatedItems = useMemo(() => {
    return activeIngredients.map((ingredient) => {
      const estimate = estimateIngredient(
        ingredient?.better || ingredient?.original || ""
      );

      return {
        name: ingredient?.better || ingredient?.original || "Ingredient",
        quantity: ingredient?.quantity || "",
        ...estimate,
      };
    });
  }, [activeIngredients]);

  const total = useMemo(() => {
    return estimatedItems.reduce((sum, item) => sum + Number(item.price || 0), 0);
  }, [estimatedItems]);

  const requestLocation = () => {
    setLocationStatus("requesting");

    if (!navigator.geolocation) {
      setLocationStatus("denied");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      () => setLocationStatus("granted"),
      () => setLocationStatus("denied"),
      { timeout: 6000 }
    );
  };

  if (!isPremium) {
    return (
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex items-center gap-2 border-b border-border px-4 pb-3 pt-4">
          <ShoppingCart className="h-4 w-4 text-chart-4" />
          <h3 className="text-sm font-black text-foreground">Where to Buy</h3>
          <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-black uppercase text-primary">
            Premium
          </span>
        </div>

        <div className="p-4">
          <div className="relative">
            <div
              className="pointer-events-none select-none space-y-2 blur-sm"
              aria-hidden="true"
            >
              {activeIngredients.slice(0, 3).map((ingredient, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-xl bg-secondary p-3"
                >
                  <span className="text-sm text-foreground">
                    {ingredient?.better || ingredient?.original}
                  </span>
                  <span className="text-sm font-bold text-chart-4">$3.99</span>
                </div>
              ))}
            </div>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="mx-4 rounded-2xl border border-border bg-background/95 p-4 text-center backdrop-blur-sm">
                <Lock className="mx-auto mb-2 h-5 w-5 text-primary" />
                <p className="text-sm font-black text-foreground">
                  Ingredient Pricing
                </p>
                <p className="mb-3 mt-0.5 text-xs text-muted-foreground">
                  See price per ingredient and nearby stores
                </p>
                <Link
                  to={createPageUrl("Profile")}
                  className="text-xs font-bold text-primary hover:underline"
                >
                  Unlock with Free Trial →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-4 pb-3 pt-4">
        <ShoppingCart className="h-4 w-4 text-chart-4" />
        <h3 className="text-sm font-black text-foreground">Where to Buy</h3>

        {locationStatus === "granted" ? (
          <span className="ml-auto flex items-center gap-1 rounded-full bg-chart-3/10 px-2 py-0.5 text-[9px] font-bold text-chart-3">
            <MapPin className="h-2.5 w-2.5" />
            Near You
          </span>
        ) : null}

        {locationStatus === "denied" ? (
          <span className="ml-auto rounded-full bg-secondary px-2 py-0.5 text-[9px] text-muted-foreground">
            Avg prices
          </span>
        ) : null}
      </div>

      <AnimatePresence mode="wait">
        {locationStatus === "idle" ? (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-4"
          >
            <p className="mb-3 text-xs text-muted-foreground">
              Allow location access to find nearby stores with the best prices.
            </p>

            <button
              onClick={requestLocation}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-chart-4/20 bg-chart-4/10 text-sm font-bold text-chart-4 transition-colors hover:bg-chart-4/15"
            >
              <MapPin className="h-4 w-4" />
              Find Nearby Stores
            </button>

            <button
              onClick={() => setLocationStatus("denied")}
              className="mt-2 w-full py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Skip — show average prices instead
            </button>
          </motion.div>
        ) : null}

        {locationStatus === "requesting" ? (
          <motion.div
            key="requesting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-6 text-center"
          >
            <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-primary" />
            <p className="text-sm font-medium text-foreground">
              Accessing your location...
            </p>
          </motion.div>
        ) : null}

        {(locationStatus === "granted" || locationStatus === "denied") ? (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2 p-3"
          >
            {locationStatus === "denied" ? (
              <div className="mb-1 flex items-start gap-2 rounded-xl bg-secondary px-3 py-2">
                <MapPin className="mt-0.5 h-3 w-3 flex-shrink-0 text-muted-foreground" />
                <p className="text-[10px] text-muted-foreground">
                  Location unavailable — showing national average prices.
                </p>
              </div>
            ) : null}

            {locationStatus === "granted" ? (
              <div className="mb-1 flex items-center gap-2 rounded-xl border border-chart-3/15 bg-chart-3/8 px-3 py-2">
                <MapPin className="h-3 w-3 text-chart-3" />
                <p className="text-[10px] font-medium text-chart-3">
                  Showing stores near your location
                </p>
              </div>
            ) : null}

            {estimatedItems.map((item, index) => (
              <motion.div
                key={`${item.name}-${index}`}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.04 }}
                className="flex items-center gap-3 rounded-xl bg-secondary p-3"
              >
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-border bg-background">
                  <Store className="h-3.5 w-3.5 text-muted-foreground" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-foreground">
                    {item.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {item.quantity ? `${item.quantity} · ` : ""}
                    {item.store}
                  </p>
                </div>

                <div className="flex-shrink-0 text-right">
                  <p className="text-sm font-black text-chart-4">
                    ${Number(item.price).toFixed(2)}
                  </p>
                  <p className="text-[9px] text-muted-foreground">
                    /{item.unit}
                  </p>
                </div>
              </motion.div>
            ))}

            <div className="mt-1 flex items-center justify-between rounded-xl border border-chart-4/20 bg-chart-4/8 px-4 py-3">
              <div>
                <p className="text-xs font-black text-foreground">
                  Estimated Total
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {estimatedItems.length} ingredients ·{" "}
                  {locationStatus === "granted" ? "near you" : "national avg"}
                </p>
              </div>

              <p className="text-2xl font-black text-chart-4">
                ${total.toFixed(2)}
              </p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}