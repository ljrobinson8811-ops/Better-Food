import { getStripe } from "@/lib/stripe";
import { base44 } from "@/api/base44Client";
import { clearPremiumCache } from "@/infra/premiumGate";

export const BILLING_INTERVALS = Object.freeze({
  MONTHLY: "monthly",
  YEARLY: "yearly",
});

const PRICE_MAP = Object.freeze({
  [BILLING_INTERVALS.MONTHLY]: import.meta.env.VITE_STRIPE_PRICE_MONTHLY,
  [BILLING_INTERVALS.YEARLY]: import.meta.env.VITE_STRIPE_PRICE_YEARLY,
});

function getPriceId(interval) {
  const priceId = PRICE_MAP[interval];
  if (!priceId) {
    throw new Error(`Missing Stripe price ID for ${interval}.`);
  }
  return priceId;
}

export async function createCheckoutSession({ email, interval }) {
  const priceId = getPriceId(interval);

  const response = await fetch("/api/stripe/create-checkout-session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      priceId,
      interval,
      successUrl: `${window.location.origin}/Profile?checkout=success`,
      cancelUrl: `${window.location.origin}/Profile?checkout=cancel`,
    }),
  });

  if (!response.ok) {
    let payload = null;

    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    throw new Error(payload?.message || "Failed to create checkout session.");
  }

  return response.json();
}

export async function openCheckoutSession(session) {
  if (!session?.sessionId) {
    throw new Error("Missing Stripe session ID.");
  }

  const stripe = await getStripe();
  if (!stripe) {
    throw new Error("Stripe failed to initialize.");
  }

  const result = await stripe.redirectToCheckout({
    sessionId: session.sessionId,
  });

  if (result?.error) {
    throw new Error(result.error.message || "Stripe checkout failed.");
  }
}

export async function syncPremiumFromBilling(email) {
  const response = await fetch("/api/stripe/sync-subscription", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    let payload = null;

    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    throw new Error(payload?.message || "Failed to sync subscription.");
  }

  const payload = await response.json();
  const subscription = payload?.subscription || null;

  if (!subscription) {
    throw new Error("No subscription returned from sync.");
  }

  const statsList = await base44.entities.UserStats.filter({
    created_by: email,
  });

  const stats = statsList?.[0] || null;

  const updatePayload = {
    is_premium: ["active", "trialing"].includes(
      String(subscription.status || "").toLowerCase()
    ),
    premium_expiry: subscription.currentPeriodEnd || null,
    billing_status: subscription.status || "free",
    billing_interval: subscription.interval || null,
    stripe_customer_id: subscription.customerId || null,
    stripe_subscription_id: subscription.subscriptionId || null,
  };

  if (stats?.id) {
    await base44.entities.UserStats.update(stats.id, updatePayload);
  } else {
    await base44.entities.UserStats.create({
      cooking_skill_level: 1,
      pantry_items: [],
      estimated_calories_avoided: 0,
      estimated_money_saved: 0,
      saved_recipes_count: 0,
      saved_restaurants_count: 0,
      ...updatePayload,
    });
  }

  clearPremiumCache();

  return subscription;
}