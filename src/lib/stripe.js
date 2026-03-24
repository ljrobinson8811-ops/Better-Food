import { loadStripe } from "@stripe/stripe-js";

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "";

let stripePromise = null;

export function getStripe() {
  if (!publishableKey) {
    throw new Error("Missing VITE_STRIPE_PUBLISHABLE_KEY.");
  }

  if (!stripePromise) {
    stripePromise = loadStripe(publishableKey);
  }

  return stripePromise;
}