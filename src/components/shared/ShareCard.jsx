import React, { useState } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Analytics } from "@/components/infra/analytics";

const PLATFORMS = [
  {
    label: "WhatsApp",
    emoji: "💬",
    build: (url, text) =>
      `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`,
  },
  {
    label: "TikTok",
    emoji: "🎵",
    build: null,
  },
  {
    label: "Instagram",
    emoji: "📸",
    build: null,
  },
  {
    label: "Messages",
    emoji: "📱",
    build: (url, text) =>
      `sms:?body=${encodeURIComponent(`${text}\n${url}`)}`,
  },
];

export default function ShareCard({ recipe, menuItem, onClose }) {
  const [copied, setCopied] = useState(false);

  const shareUrl =
    typeof window !== "undefined" ? window.location.href : "";

  const calorieDifference =
    Number(menuItem?.original_calories || 0) -
    Number(recipe?.better_calories || 0);

  const proteinDifference =
    Number(recipe?.better_protein || 0) -
    Number(menuItem?.original_protein || 0);

  const savings = Number(recipe?.savings_amount || 0);

  const shareText =
    `I made a healthier version of ${menuItem?.name || "this meal"} at home with Better Food!` +
    (calorieDifference > 0 ? ` Saved ${calorieDifference} calories` : "") +
    (proteinDifference > 0 ? `, +${proteinDifference}g protein` : "") +
    (savings > 0 ? `, $${savings.toFixed(2)} cheaper` : "") +
    " 🔥";

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      Analytics.recipeShared(menuItem?.id, "copy_link");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }

  async function handleNativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Better Food",
          text: shareText,
          url: shareUrl,
        });
        Analytics.recipeShared(menuItem?.id, "native_share");
      } catch {
        // user cancelled or share failed
      }
      return;
    }

    await handleCopy();
  }

  function handlePlatform(platform) {
    if (!platform.build) {
      handleNativeShare();
      return;
    }

    const url = platform.build(shareUrl, shareText);
    window.open(url, "_blank", "noopener,noreferrer");
    Analytics.recipeShared(menuItem?.id, platform.label.toLowerCase());
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/80 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="w-full max-w-lg rounded-t-3xl bg-card p-6 pb-10"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-base font-black text-foreground">
                Share your win 🏆
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Inspire others to eat better
              </p>
            </div>

            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          <div className="mb-5 rounded-2xl bg-foreground p-4">
            <p className="mb-1.5 text-[9px] font-black uppercase tracking-widest text-foreground/35">
              Better Food
            </p>
            <p className="text-sm font-black leading-tight text-background">
              {menuItem?.name || "Better Recipe"}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {calorieDifference > 0 && (
                <span className="rounded-full bg-primary/20 px-2 py-1 text-[10px] font-black text-primary">
                  −{calorieDifference} cal
                </span>
              )}

              {proteinDifference > 0 && (
                <span className="rounded-full bg-chart-3/20 px-2 py-1 text-[10px] font-black text-chart-3">
                  +{proteinDifference}g protein
                </span>
              )}

              {savings > 0 && (
                <span className="rounded-full bg-chart-4/20 px-2 py-1 text-[10px] font-black text-chart-4">
                  ${savings.toFixed(2)} saved
                </span>
              )}
            </div>
          </div>

          <div className="mb-4 grid grid-cols-5 gap-2">
            {PLATFORMS.map((platform) => (
              <button
                key={platform.label}
                onClick={() => handlePlatform(platform)}
                className="flex flex-col items-center gap-1.5 rounded-2xl bg-secondary p-3 transition-transform active:scale-95"
              >
                <span className="text-2xl">{platform.emoji}</span>
                <span className="text-[9px] font-bold text-muted-foreground">
                  {platform.label}
                </span>
              </button>
            ))}

            <button
              onClick={handleCopy}
              className="flex flex-col items-center gap-1.5 rounded-2xl bg-secondary p-3 transition-transform active:scale-95"
            >
              <span className="text-2xl">{copied ? "✅" : "🔗"}</span>
              <span className="text-[9px] font-bold text-muted-foreground">
                {copied ? "Copied!" : "Copy"}
              </span>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}