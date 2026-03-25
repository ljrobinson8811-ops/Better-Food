import { base44 } from "@/api/base44Client";
import { clearPremiumCache } from "@/components/infra/premiumGate";

export const BILLING_INTERVALS = Object.freeze({
  MONTHLY: "monthly",
  YEARLY: "yearly",
});

/**
 * Creates a Stripe checkout session via Base44 backend function and returns { url }.
 * The caller should redirect to session.url to start checkout.
 */
export async function createCheckoutSession({ email, interval }) {
  const response = await base44.functions.invoke("createCheckoutSession", {
    interval,
    successUrl: `${window.location.origin}/Profile?checkout=success`,
    cancelUrl: `${window.location.origin}/Profile?checkout=cancel`,
  });

  const data = response?.data;
  if (!data?.url) {
    throw new Error(data?.error || "Failed to create checkout session.");
  }

  return data; // { url }
}

/**
 * Redirects the browser to the Stripe-hosted checkout page.
 */
export function openCheckoutSession(session) {
  if (!session?.url) {
    throw new Error("Missing checkout URL.");
  }
  window.location.href = session.url;
}

/**
 * Syncs premium status from Stripe to UserStats via backend function.
 */
export async function syncPremiumFromBilling(email) {
  const response = await base44.functions.invoke("syncSubscription", {});

  const data = response?.data;
  if (data?.error) {
    throw new Error(data.error);
  }

  clearPremiumCache();
  return data?.subscription || null;
}