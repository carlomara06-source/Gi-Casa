import Stripe from "stripe";
import type { PlanId } from "@/lib/plans";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", {
  apiVersion: "2026-08-26.dahlia",
});

export function stripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

/** Maps a paid plan to its Stripe test-mode weekly recurring Price ID. */
export function priceIdForPlan(plan: PlanId): string | undefined {
  switch (plan) {
    case "VISIBILITY_BOOST":
      return process.env.STRIPE_PRICE_VISIBILITY_BOOST || undefined;
    case "SMART_AGENT":
      return process.env.STRIPE_PRICE_SMART_AGENT || undefined;
    case "CONCIERGE_LUXURY":
      return process.env.STRIPE_PRICE_CONCIERGE_LUXURY || undefined;
    default:
      return undefined;
  }
}
