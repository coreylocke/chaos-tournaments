"use server";

import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * Creates a Stripe Checkout Session for a team's tournament entry fee and records a
 * `pending` registration_payments row. Returns the Checkout URL to redirect the captain to.
 * Called from registerTeamForTournament right after the registration row lands in
 * `awaiting_entry_funding`.
 */
export async function createEntryFeeCheckoutSession(params: {
  registrationId: string;
  tournamentName: string;
  teamName: string;
  tournamentSlug: string;
  payerUserId: string;
  amountCents: number;
}): Promise<string> {
  const { registrationId, tournamentName, teamName, tournamentSlug, payerUserId, amountCents } = params;

  const stripe = getStripe();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `Entry fee — ${teamName} for ${tournamentName}`,
          },
          unit_amount: amountCents,
        },
        quantity: 1,
      },
    ],
    metadata: {
      registration_id: registrationId,
      payer_user_id: payerUserId,
    },
    success_url: `${siteUrl}/tournaments/${tournamentSlug}?payment=success`,
    cancel_url: `${siteUrl}/tournaments/${tournamentSlug}?payment=cancelled`,
  });

  const admin = createAdminClient();
  const { error } = await admin.from("registration_payments").insert({
    registration_id: registrationId,
    paid_by: payerUserId,
    amount_cents: amountCents,
    stripe_checkout_session_id: session.id,
    status: "pending",
  });
  if (error) {
    throw new Error(`Failed to record pending payment: ${error.message}`);
  }

  if (!session.url) {
    throw new Error("Stripe did not return a Checkout URL.");
  }
  return session.url;
}
