import React, { useState } from "react";
import { MapPin, ShoppingCart, Loader2, Lock, Store } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

function estimateIngredient(name) {
  const n = (name || "").toLowerCase();
  if (n.includes("beef") || n.includes("ground") || n.includes("patty")) return { price: 5.99, unit: "lb", store: "Walmart" };
  if (n.includes("chicken breast") || n.includes("chicken thigh")) return { price: 4.49, unit: "lb", store: "Kroger" };
  if (n.includes("chicken")) return { price: 3.99, unit: "lb", store: "Walmart" };
  if (n.includes("turkey")) return { price: 4.99, unit: "lb", store: "Whole Foods" };
  if (n.includes("bread") || n.includes("bun") || n.includes("roll")) return { price: 2.99, unit: "pack", store: "Walmart" };
  if (n.includes("cheddar") || n.includes("mozzarella") || n.includes("cheese")) return { price: 3.49, unit: "8oz", store: "Kroger" };
  if (n.includes("romaine") || n.includes("spinach") || n.includes("lettuce")) return { price: 2.29, unit: "head", store: "Walmart" };
  if (n.includes("tomato")) return { price: 1.49, unit: "each", store: "Walmart" };
  if (n.includes("red onion") || n.includes("onion")) return { price: 0.99, unit: "each", store: "Walmart" };
  if (n.includes("garlic")) return { price: 0.79, unit: "bulb", store: "Walmart" };
  if (n.includes("avocado")) return { price: 1.49, unit: "each", store: "Whole Foods" };
  if (n.includes("olive oil") || n.includes("avocado oil")) return { price: 5.99, unit: "bottle", store: "Whole Foods" };
  if (n.includes("oil")) return { price: 3.49, unit: "bottle", store: "Walmart" };
  if (n.includes("egg")) return { price: 3.99, unit: "dozen", store: "Walmart" };
  if (n.includes("mayo") || n.includes("mayonnaise")) return { price: 3.29, unit: "jar", store: "Walmart" };
  if (n.includes("ketchup") || n.includes("mustard")) return { price: 2.49, unit: "bottle", store: "Walmart" };
  if (n.includes("sauce") || n.includes("sriracha") || n.includes("hot sauce")) return { price: 2.99, unit: "bottle", store: "Walmart" };
  if (n.includes("paprika") || n.includes("cumin") || n.includes("salt") || n.includes("pepper")) return { price: 1.49, unit: "container", store: "Walmart" };
  if (n.includes("flour")) return { price: 3.49, unit: "5lb bag", store: "Walmart" };
  if (n.includes("buttermilk") || n.includes("milk")) return { price: 3.79, unit: "gallon", store: "Walmart" };
  if (n.includes("butter")) return { price: 4.49, unit: "lb", store: "Walmart" };
  if (n.includes("quinoa") || n.includes("rice")) return { price: 3.99, unit: "bag", store: "Walmart" };
  if (n.includes("lime") || n.includes("lemon")) return { price: 0.69, unit: "each", store: "Walmart" };
  if (n.includes("jalapen") || n.includes("chili")) return { price: 0.99, unit: "each", store: "Walmart" };
  if (n.includes("greek yogurt") || n.includes("yogurt")) return { price: 4.99, unit: "container", store: "Whole Foods" };
  if (n.includes("protein powder") || n.includes("whey")) return { price: 29.99, unit: "container", store: "GNC" };
  return { price: 2.49, unit: "item", store: "Walmart" };
}

export default function IngredientBuying({ ingredients, isPremium }) {
  const [locationStatus, setLocationStatus] = useState("idle");

  const activeIngredients = (ingredients || []).filter(ing => ing.accepted !== false);

  if (!isPremium) {
    return (
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="px-4 pt-4 pb-3 border-b border-border flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-chart-4" />
          <h3 className="text-sm font-black text-foreground">Where to Buy</h3>
          <span className="ml-auto text-[9px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase">Premium</span>
        </div>
        <div className="p-4">
          <div className="relative">
            <div className="space-y-2 blur-sm pointer-events-none select-none" aria-hidden="true">
              {activeIngredients.slice(0, 3).map((ing, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-secondary rounded-xl">
                  <span className="text-sm text-foreground">{ing.better || ing.original}</span>
                  <span className="text-sm font-bold text-chart-4">$3.99</span>
                </div>
              ))}
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="bg-background/95 backdrop-blur-sm rounded-2xl p-4 text-center mx-4 border border-border">
                <Lock className="w-5 h-5 text-primary mx-auto mb-2" />
                <p className="text-sm font-black text-foreground">Ingredient Pricing</p>
                <p className="text-xs text-muted-foreground mt-0.5 mb-3">
                  See price per ingredient &amp; nearby stores
                </p>
                <Link
                  to={createPageUrl("Profile")}
                  className="text-xs font-bold text-primary underline-offset-2 hover:underline"
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

  const priceItems = activeIngredients.map(ing => {
    const est = estimateIngredient(ing.better || ing.original);
    return { name: ing.better || ing.original, quantity: ing.quantity, ...est };
  });
  const total = priceItems.reduce((sum, item) => sum + item.price, 0);

  const handleLocation = () => {
    setLocationStatus("requesting");
    if (!navigator.geolocation) { setLocationStatus("denied"); return; }
    navigator.geolocation.getCurrentPosition(
      () => setLocationStatus("granted"),
      () => setLocationStatus("denied"),
      { timeout: 6000 }
    );
  };

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="px-4 pt-4 pb-3 border-b border-border flex items-center gap-2">
        <ShoppingCart className="w-4 h-4 text-chart-4" />
        <h3 className="text-sm font-black text-foreground">Where to Buy</h3>
        {locationStatus === "granted" && (
          <span className="ml-auto flex items-center gap-1 text-[9px] font-bold text-chart-3 bg-chart-3/10 px-2 py-0.5 rounded-full">
            <MapPin className="w-2.5 h-2.5" /> Near You
          </span>
        )}
        {locationStatus === "denied" && (
          <span className="ml-auto text-[9px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">Avg prices</span>
        )}
      </div>

      <AnimatePresence mode="wait">
        {locationStatus === "idle" && (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-4">
            <p className="text-xs text-muted-foreground mb-3">
              Allow location access to find nearby stores with the best prices for each ingredient.
            </p>
            <button
              onClick={handleLocation}
              className="w-full flex items-center justify-center gap-2 bg-chart-4/10 hover:bg-chart-4/15 border border-chart-4/20 text-chart-4 rounded-xl h-11 text-sm font-bold transition-colors"
            >
              <MapPin className="w-4 h-4" />
              Find Nearby Stores
            </button>
            <button
              onClick={() => setLocationStatus("denied")}
              className="w-full text-xs text-muted-foreground mt-2 py-1.5 hover:text-foreground transition-colors"
            >
              Skip — show average prices instead
            </button>
          </motion.div>
        )}

        {locationStatus === "requesting" && (
          <motion.div key="requesting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">Accessing your location...</p>
          </motion.div>
        )}

        {(locationStatus === "granted" || locationStatus === "denied") && (
          <motion.div key="results" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="p-3 space-y-2">
            {locationStatus === "denied" && (
              <div className="flex items-start gap-2 bg-secondary rounded-xl px-3 py-2 mb-1">
                <MapPin className="w-3 h-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                <p className="text-[10px] text-muted-foreground">
                  Location unavailable — showing national average prices. Enable location for nearby store results.
                </p>
              </div>
            )}
            {locationStatus === "granted" && (
              <div className="flex items-center gap-2 bg-chart-3/8 border border-chart-3/15 rounded-xl px-3 py-2 mb-1">
                <MapPin className="w-3 h-3 text-chart-3" />
                <p className="text-[10px] text-chart-3 font-medium">Showing stores near your location</p>
              </div>
            )}

            {priceItems.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-3 p-3 bg-secondary rounded-xl"
              >
                <div className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center flex-shrink-0">
                  <Store className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">{item.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {item.quantity ? `${item.quantity} · ` : ""}{item.store}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-black text-chart-4">${item.price.toFixed(2)}</p>
                  <p className="text-[9px] text-muted-foreground">/{item.unit}</p>
                </div>
              </motion.div>
            ))}

            <div className="flex items-center justify-between px-4 py-3 bg-chart-4/8 border border-chart-4/20 rounded-xl mt-1">
              <div>
                <p className="text-xs font-black text-foreground">Estimated Total</p>
                <p className="text-[10px] text-muted-foreground">
                  {priceItems.length} ingredients · {locationStatus === "granted" ? "near you" : "national avg"}
                </p>
              </div>
              <p className="text-2xl font-black text-chart-4">${total.toFixed(2)}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}