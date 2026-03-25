import React, { useState } from "react";
import { X, Copy, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Analytics } from "@/components/infra/analytics";

const PLATFORMS = [
  {
    label: "WhatsApp",
    emoji: "💬",
    build: (url, text) => `https://wa.me/?text=${encodeURIComponent(text + "\n" + url)}`,
  },
  {
    label: "TikTok",
    emoji: "🎵",
    build: null, // opens native share
  },
  {
    label: "Instagram",
    emoji: "📸",
    build: null, // opens native share (no deep-link available)
  },
  {
    label: "Messages",
    emoji: "📱",
    build: (url, text) => `sms:?body=${encodeURIComponent(text + "\n" + url)}`,
  },
];

export default function ShareCard({ recipe, menuItem, onClose }) {
  const [copied, setCopied] = useState(false);
  const shareUrl  = window.location.href;

  const calDiff  = (menuItem?.original_calories || 0) - (recipe?.better_calories || 0);
  const protDiff = (recipe?.better_protein || 0) - (menuItem?.original_protein || 0);
  const savings  = recipe?.savings_amount || 0;

  const shareText = `I made a healthier version of ${menuItem?.name || "this meal"} at home with Better Food!`
    + (calDiff > 0 ? ` Saved ${calDiff} calories` : "")
    + (protDiff > 0 ? `, +${protDiff}g protein` : "")
    + (savings > 0 ? `, $${savings.toFixed(2)} cheaper` : "")
    + ` 🔥`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    Analytics.recipeShared(menuItem?.id, "copy_link");
    setTimeout(() => setCopied(false), 2500);
  };

  const handleNative = async () => {
    if (navigator.share) {
      await navigator.share({ title: "Better Food", text: shareText, url: shareUrl });
      Analytics.recipeShared(menuItem?.id, "native_share");
    } else {
      handleCopy();
    }
  };

  const handlePlatform = (p) => {
    if (!p.build) { handleNative(); return; }
    window.open(p.build(shareUrl, shareText), "_blank");
    Analytics.recipeShared(menuItem?.id, p.label.toLowerCase());
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-foreground/80 backdrop-blur-sm z-50 flex items-end justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="w-full max-w-lg bg-card rounded-t-3xl p-6 pb-10"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-base font-black text-foreground">Share your win 🏆</p>
              <p className="text-xs text-muted-foreground mt-0.5">Inspire others to eat better</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Preview card */}
          <div className="bg-foreground rounded-2xl p-4 mb-5">
            <p className="text-[9px] text-foreground/35 uppercase tracking-widest font-black mb-1.5">Better Food</p>
            <p className="text-sm font-black text-background leading-tight">{menuItem?.name || "Better Recipe"}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              {calDiff > 0 && (
                <span className="text-[10px] font-black text-primary bg-primary/20 px-2 py-1 rounded-full">−{calDiff} cal</span>
              )}
              {protDiff > 0 && (
                <span className="text-[10px] font-black text-chart-3 bg-chart-3/20 px-2 py-1 rounded-full">+{protDiff}g protein</span>
              )}
              {savings > 0 && (
                <span className="text-[10px] font-black text-chart-4 bg-chart-4/20 px-2 py-1 rounded-full">${savings.toFixed(2)} saved</span>
              )}
            </div>
          </div>

          {/* Share grid */}
          <div className="grid grid-cols-5 gap-2 mb-4">
            {PLATFORMS.map(p => (
              <button
                key={p.label}
                onClick={() => handlePlatform(p)}
                className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-secondary active:scale-95 transition-transform"
              >
                <span className="text-2xl">{p.emoji}</span>
                <span className="text-[9px] font-bold text-muted-foreground">{p.label}</span>
              </button>
            ))}
            <button
              onClick={handleCopy}
              className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-secondary active:scale-95 transition-transform"
            >
              <span className="text-2xl">{copied ? "✅" : "🔗"}</span>
              <span className="text-[9px] font-bold text-muted-foreground">{copied ? "Copied!" : "Copy"}</span>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}