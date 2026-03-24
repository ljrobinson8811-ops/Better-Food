/**
 * Growth Engine — referral system and premium-day rewards
 * Rules:
 *   - Referrer earns 4 premium days per successful referral
 *   - No self-referrals
 *   - No duplicate rewards (checked against Referral entity)
 *   - Simple device fingerprint via userAgent hash for abuse prevention
 */

import { base44 } from "@/api/base44Client";

function generateCode(email) {
  // Deterministic 8-char code from email
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = ((hash << 5) - hash + email.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(36).toUpperCase().padStart(6, "0").slice(0, 8);
}

function deviceFingerprint() {
  const parts = [
    navigator.userAgent,
    navigator.language,
    screen.width + "x" + screen.height,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  ].join("|");
  let h = 0;
  for (let i = 0; i < parts.length; i++) h = ((h << 5) - h + parts.charCodeAt(i)) | 0;
  return Math.abs(h).toString(36);
}

export const GrowthService = {
  /** Returns the user's referral code (deterministic from email) */
  getReferralCode(user) {
    return generateCode(user.email);
  },

  /** Returns the shareable referral URL */
  getReferralUrl(code) {
    return `${window.location.origin}?ref=${code}`;
  },

  /** Called on signup — applies referral reward if valid */
  async applyReferral(referredUser) {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode   = urlParams.get("ref") || sessionStorage.getItem("bf_ref");
    if (!refCode) return;

    // Persist ref code in case page reloads before signup completes
    sessionStorage.setItem("bf_ref", refCode);

    if (refCode === generateCode(referredUser.email)) {
      console.warn("[Growth] Self-referral blocked");
      return;
    }

    // Find referrer by code
    const allUsers = await base44.entities.User.list("email", 500).catch(() => []);
    const referrer = allUsers.find(u => generateCode(u.email) === refCode);
    if (!referrer) return;

    // Check for duplicate reward
    const existing = await base44.entities.Referral.filter({
      referred_email: referredUser.email,
    }).catch(() => []);
    if (existing.length > 0) {
      console.warn("[Growth] Duplicate referral blocked");
      return;
    }

    // Create referral record
    await base44.entities.Referral.create({
      referrer_email:    referrer.email,
      referred_email:    referredUser.email,
      referral_code:     refCode,
      status:            "completed",
      reward_days:       4,
      reward_applied:    false,
      device_fingerprint: deviceFingerprint(),
    });

    // Extend premium for referrer
    const referrerStats = await base44.entities.UserStats.filter({ created_by: referrer.email }).catch(() => []);
    if (referrerStats[0]) {
      const currentExpiry = referrerStats[0].premium_expiry
        ? new Date(referrerStats[0].premium_expiry)
        : new Date();
      if (currentExpiry < new Date()) currentExpiry.setTime(new Date().getTime());
      currentExpiry.setDate(currentExpiry.getDate() + 4);

      await base44.entities.UserStats.update(referrerStats[0].id, {
        is_premium:     true,
        premium_expiry: currentExpiry.toISOString().split("T")[0],
      });

      await base44.entities.Referral.update(
        (await base44.entities.Referral.filter({ referred_email: referredUser.email }))[0]?.id,
        { reward_applied: true }
      );
    }

    sessionStorage.removeItem("bf_ref");
  },

  /** Returns stats for the referral section UI */
  async getReferralStats(referrerEmail) {
    const refs = await base44.entities.Referral.filter({ referrer_email: referrerEmail }).catch(() => []);
    const completed = refs.filter(r => r.status === "completed");
    return {
      count:           completed.length,
      totalDaysEarned: completed.reduce((a, r) => a + (r.reward_days || 0), 0),
    };
  },
};