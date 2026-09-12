import Stripe from "stripe";

/**
 * Server-only Stripe client. Never import this from a Client Component — STRIPE_SECRET_KEY
 * must stay server-side. Uses the account's default API version.
 */
let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not set.");
  }
  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripeClient;
}

/** Formats integer cents as a "$X.XX" string for display. */
export function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
