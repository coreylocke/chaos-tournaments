import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/server";
import { notifyDiscord } from "@/lib/discord";
import { processReadyPayoutsForUser } from "@/lib/actions/payouts";

/**
 * Stripe webhook receiver. Configure in the Stripe Dashboard (Developers > Webhooks) pointed
 * at https://chaostournaments.com/api/stripe/webhook, subscribed to:
 *   - checkout.session.completed  (entry fee paid)
 *   - account.updated             (Connect onboarding status changed)
 *
 * Signature verification requires the RAW request body — this route reads it via
 * request.text() before any JSON parsing, which is required for Stripe's signature check to
 * pass. Set STRIPE_WEBHOOK_SECRET from the webhook's "Signing secret" in the Stripe Dashboard.
 */
export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Webhook not configured." }, { status: 400 });
  }

  const rawBody = await request.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("[stripe webhook] signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  const admin = createAdminClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        const { data: payment } = await admin
          .from("registration_payments")
          .select("payment_id, registration_id, status")
          .eq("stripe_checkout_session_id", session.id)
          .maybeSingle();

        if (!payment) {
          console.error("[stripe webhook] no registration_payments row for session", session.id);
          break;
        }
        if (payment.status === "paid") {
          break; // Already processed (Stripe can send duplicate events).
        }

        await admin
          .from("registration_payments")
          .update({
            status: "paid",
            stripe_payment_intent_id:
              typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null,
          })
          .eq("payment_id", payment.payment_id);

        const { data: registration } = await admin
          .from("tournament_registrations")
          .update({ registration_status: "pending_review" })
          .eq("registration_id", payment.registration_id)
          .eq("registration_status", "awaiting_entry_funding")
          .select("teams(team_name), tournaments(name, slug)")
          .maybeSingle();

        const team = Array.isArray(registration?.teams) ? registration.teams[0] : registration?.teams;
        const tournament = Array.isArray(registration?.tournaments) ? registration.tournaments[0] : registration?.tournaments;

        await notifyDiscord(
          `💰 Entry fee paid — **${team?.team_name ?? "A team"}** for **${
            tournament?.name ?? "a tournament"
          }** is now pending review.`
        );
        break;
      }

      case "account.updated": {
        const account = event.data.object as Stripe.Account;
        const onboarded = Boolean(account.charges_enabled && account.payouts_enabled && account.details_submitted);

        const { data: profile } = await admin
          .from("user_profiles")
          .update({ stripe_connect_onboarded: onboarded })
          .eq("stripe_connect_account_id", account.id)
          .select("user_id")
          .maybeSingle();

        if (profile && onboarded) {
          await processReadyPayoutsForUser(profile.user_id);
        }
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error("[stripe webhook] handler error:", err);
    return NextResponse.json({ error: "Webhook handler failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
