"use server";

import { redirect } from "next/navigation";
import { getStripe } from "@/lib/stripe";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { notifyDiscord } from "@/lib/discord";

/**
 * Creates (or reuses) a Stripe Connect Express account for the current user and redirects
 * them into Stripe's hosted onboarding flow. Called from the "Set up payout" button on the
 * dashboard when a user has a prize payout waiting on them. Onboarding completion is picked
 * up via the `account.updated` webhook event, which then fires any pending transfers
 * automatically — no admin action required.
 */
export async function startConnectOnboarding() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not logged in.");

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("user_profiles")
    .select("stripe_connect_account_id, email")
    .eq("user_id", user.id)
    .single();

  const stripe = getStripe();
  let accountId = profile?.stripe_connect_account_id ?? null;

  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "express",
      email: profile?.email ?? user.email ?? undefined,
      capabilities: {
        transfers: { requested: true },
      },
      business_type: "individual",
    });
    accountId = account.id;

    await admin.from("user_profiles").update({ stripe_connect_account_id: accountId }).eq("user_id", user.id);
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${siteUrl}/dashboard?connect=refresh`,
    return_url: `${siteUrl}/dashboard?connect=return`,
    type: "account_onboarding",
  });

  redirect(accountLink.url);
}

/**
 * Transfers any `awaiting_onboarding`/`ready` payouts owed to a user once their Connect
 * account can accept transfers. Called from the `account.updated` webhook (automatic,
 * hands-off) and defensively right after a payout row is created in case the recipient was
 * already onboarded from a previous tournament win.
 */
export async function processReadyPayoutsForUser(userId: string) {
  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("user_profiles")
    .select("stripe_connect_account_id, stripe_connect_onboarded, discord_display_name, discord_username")
    .eq("user_id", userId)
    .single();

  if (!profile?.stripe_connect_account_id || !profile.stripe_connect_onboarded) {
    return;
  }

  const { data: payouts } = await admin
    .from("tournament_payouts")
    .select("payout_id, tournament_id, amount_cents, placement")
    .eq("recipient_user_id", userId)
    .in("status", ["awaiting_onboarding", "ready"]);

  if (!payouts || payouts.length === 0) return;

  const stripe = getStripe();

  for (const payout of payouts) {
    try {
      const transfer = await stripe.transfers.create({
        amount: payout.amount_cents,
        currency: "usd",
        destination: profile.stripe_connect_account_id,
        metadata: { payout_id: payout.payout_id },
      });

      await admin
        .from("tournament_payouts")
        .update({ status: "paid", stripe_transfer_id: transfer.id })
        .eq("payout_id", payout.payout_id);

      const { data: tournament } = await admin
        .from("tournaments")
        .select("name")
        .eq("tournament_id", payout.tournament_id)
        .maybeSingle();
      const tournamentName = tournament?.name;
      const recipientName = profile.discord_display_name ?? profile.discord_username ?? "a player";
      await notifyDiscord(
        `💸 Payout sent: $${(payout.amount_cents / 100).toFixed(2)} to ${recipientName} for ${
          payout.placement === "winner" ? "1st place" : "2nd place"
        } in **${tournamentName ?? "a tournament"}**.`
      );
    } catch (err) {
      console.error("[payouts] transfer failed:", err);
      await admin.from("tournament_payouts").update({ status: "failed" }).eq("payout_id", payout.payout_id);
    }
  }
}
