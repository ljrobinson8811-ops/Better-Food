import React, { useEffect, useMemo, useState } from "react";
import { Copy, Check, Gift, Share2 } from "lucide-react";
import { motion } from "framer-motion";

import { GrowthService } from "@/components/infra/growthService";

async function copyTextWithFallback(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through
  }

  try {
    const input = document.createElement("input");
    input.value = text;
    input.setAttribute("readonly", "true");
    input.style.position = "absolute";
    input.style.left = "-9999px";
    document.body.appendChild(input);
    input.select();
    document.execCommand("copy");
    document.body.removeChild(input);
    return true;
  } catch {
    return false;
  }
}

export default function ReferralSection({ user }) {
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState({ count: 0, totalDaysEarned: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    if (!user?.email) {
      setCode("");
      setStats({ count: 0, totalDaysEarned: 0 });
      setLoading(false);
      return () => {
        mounted = false;
      };
    }

    setLoading(true);

    Promise.all([
      Promise.resolve(GrowthService.getReferralCode(user)),
      GrowthService.getReferralStats(user.email),
    ])
      .then(([nextCode, nextStats]) => {
        if (!mounted) return;
        setCode(nextCode || "");
        setStats(
          nextStats || { count: 0, totalDaysEarned: 0 }
        );
        setLoading(false);
      })
      .catch(() => {
        if (!mounted) return;
        setCode("");
        setStats({ count: 0, totalDaysEarned: 0 });
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [user]);

  const referralUrl = useMemo(() => {
    return code ? GrowthService.getReferralUrl(code) : "";
  }, [code]);

  const handleCopy = async () => {
    if (!referralUrl) return;

    const success = await copyTextWithFallback(referralUrl);
    if (!success) return;

    setCopied(true);
    window.setTimeout(() => setCopied(false), 2500);
  };

  const handleShare = async () => {
    if (!referralUrl) return;

    const text =
      "Join me on Better Food — make healthier versions of your favorite fast food at home.";

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Better Food",
          text,
          url: referralUrl,
        });
        return;
      }
    } catch {
      // fall through to copy
    }

    await handleCopy();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card p-4"
    >
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-chart-4/15">
          <Gift className="h-4 w-4 text-chart-4" />
        </div>
        <div>
          <p className="text-sm font-black text-foreground">Refer & Earn</p>
          <p className="text-[10px] text-muted-foreground">
            Get 4 free premium days per referral
          </p>
        </div>
      </div>

      <div className="mb-4 flex gap-3">
        <div className="flex-1 rounded-xl bg-secondary p-3 text-center">
          <p className="text-xl font-black text-foreground">
            {loading ? "—" : stats.count}
          </p>
          <p className="mt-0.5 text-[9px] font-bold uppercase tracking-wide text-muted-foreground">
            Referred
          </p>
        </div>

        <div className="flex-1 rounded-xl border border-chart-4/20 bg-chart-4/10 p-3 text-center">
          <p className="text-xl font-black text-chart-4">
            {loading ? "—" : stats.totalDaysEarned}
          </p>
          <p className="mt-0.5 text-[9px] font-bold uppercase tracking-wide text-muted-foreground">
            Days Earned
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="min-w-0 flex-1 rounded-xl bg-secondary px-3 py-2.5">
          <p className="truncate text-[10px] font-bold text-muted-foreground">
            {loading ? "Generating link…" : referralUrl || "Referral unavailable"}
          </p>
        </div>

        <button
          onClick={handleCopy}
          disabled={!referralUrl}
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary transition-transform active:scale-95 disabled:opacity-50"
        >
          {copied ? (
            <Check className="h-4 w-4 text-white" />
          ) : (
            <Copy className="h-4 w-4 text-white" />
          )}
        </button>

        <button
          onClick={handleShare}
          disabled={!referralUrl}
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-chart-4/25 bg-chart-4/15 transition-transform active:scale-95 disabled:opacity-50"
        >
          <Share2 className="h-4 w-4 text-chart-4" />
        </button>
      </div>

      {copied ? (
        <p className="mt-2 text-center text-[10px] font-bold text-chart-3">
          Link copied to clipboard ✓
        </p>
      ) : null}
    </motion.div>
  );
}