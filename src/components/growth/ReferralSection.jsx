import React, { useState, useEffect } from "react";
import { Copy, Check, Gift, Share2 } from "lucide-react";
import { GrowthService } from "@/components/infra/growthService";
import { motion } from "framer-motion";

export default function ReferralSection({ user }) {
  const [code, setCode]     = useState("");
  const [copied, setCopied] = useState(false);
  const [stats, setStats]   = useState({ count: 0, totalDaysEarned: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.email) return;
    Promise.all([
      GrowthService.getReferralCode(user),
      GrowthService.getReferralStats(user.email),
    ]).then(([c, s]) => {
      setCode(c);
      setStats(s);
      setLoading(false);
    });
  }, [user]);

  const referralUrl = code ? GrowthService.getReferralUrl(code) : "";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShare = async () => {
    const text = "Join me on Better Food — make healthier versions of your fav fast food at home! 🔥";
    if (navigator.share) {
      await navigator.share({ title: "Better Food", text, url: referralUrl });
    } else {
      handleCopy();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl p-4"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-chart-4/15 flex items-center justify-center">
          <Gift className="w-4 h-4 text-chart-4" />
        </div>
        <div>
          <p className="text-sm font-black text-foreground">Refer & Earn</p>
          <p className="text-[10px] text-muted-foreground">Get 4 free premium days per referral</p>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1 bg-secondary rounded-xl p-3 text-center">
          <p className="text-xl font-black text-foreground">{loading ? "—" : stats.count}</p>
          <p className="text-[9px] text-muted-foreground uppercase tracking-wide font-bold mt-0.5">Referred</p>
        </div>
        <div className="flex-1 bg-chart-4/10 border border-chart-4/20 rounded-xl p-3 text-center">
          <p className="text-xl font-black text-chart-4">{loading ? "—" : stats.totalDaysEarned}</p>
          <p className="text-[9px] text-muted-foreground uppercase tracking-wide font-bold mt-0.5">Days Earned</p>
        </div>
      </div>

      {/* Link row */}
      <div className="flex gap-2">
        <div className="flex-1 bg-secondary rounded-xl px-3 py-2.5 min-w-0">
          <p className="text-[10px] font-bold text-muted-foreground truncate">
            {loading ? "Generating link…" : referralUrl}
          </p>
        </div>
        <button
          onClick={handleCopy}
          className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center flex-shrink-0 active:scale-95 transition-transform"
        >
          {copied
            ? <Check className="w-4 h-4 text-white" />
            : <Copy className="w-4 h-4 text-white" />
          }
        </button>
        <button
          onClick={handleShare}
          className="w-10 h-10 rounded-xl bg-chart-4/15 border border-chart-4/25 flex items-center justify-center flex-shrink-0 active:scale-95 transition-transform"
        >
          <Share2 className="w-4 h-4 text-chart-4" />
        </button>
      </div>

      {copied && (
        <p className="text-[10px] text-chart-3 font-bold text-center mt-2">Link copied to clipboard ✓</p>
      )}
    </motion.div>
  );
}