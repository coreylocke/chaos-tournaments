import "server-only";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { CHECKOUT_LOCK_MINUTES, sumEntryFeesCents } from "@/lib/rules/moneyRules";
import type { Json } from "@/lib/supabase/types";

function randomLetters(length: number) {
  const alphabet = "abcdefghijklmnopqrstuvwxyz";
  return Array.from({ length }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
}

export type CreateCheckoutSessionInput = {
  entrySlotIds: string[];
  payerUserId: string;
};

// Section 12 (CLAUDE.md): locks the selected slots, then creates a Stripe
// Checkout Session with a server-calculated total. Nothing here ever marks
// an entry paid — only the webhook (paymentService.handleCheckoutCompleted)
// does that, per the "browser redirect never marks anything paid" rule.
export async function createCheckoutSession(input: CreateCheckoutSessionInput) {
  if (input.entrySlotIds.length === 0) {
    throw new Error("Select at least one entry to pay.");
  }

  const supabase = createServiceRoleClient();

  const { data: payer, error: payerError } = await supabase
    .from("users")
    .select("user_id, email")
    .eq("user_id", input.payerUserId)
    .single();
  if (payerError) throw payerError;

  const { data: discordAccount } = await supabase
    .from("discord_accounts")
    .select("discord_user_id")
    .eq("user_id", input.payerUserId)
    .maybeSingle();

  const { data: slots, error: slotsError } = await supabase
    .from("registration_entry_slots")
    .select(
      "entry_slot_id, slot_number, entry_fee_amount_cents, payment_status, registration_id, tournament_registrations(tournament_id, team_id, tournaments(division))"
    )
    .in("entry_slot_id", input.entrySlotIds);
  if (slotsError) throw slotsError;
  if (!slots || slots.length !== input.entrySlotIds.length) {
    throw new Error("One or more selected entries couldn't be found.");
  }
  if (slots.some((s) => s.payment_status !== "unpaid")) {
    throw new Error("One or more selected entries are no longer unpaid.");
  }

  const registrationIds = new Set(slots.map((s) => s.registration_id));
  if (registrationIds.size !== 1) {
    throw new Error("All selected entries must belong to the same registration.");
  }
  const registrationId = slots[0].registration_id;
  const registrationMeta = slots[0].tournament_registrations as unknown as {
    tournament_id: string;
    team_id: string;
    tournaments: { division: string } | null;
  };

  const now = new Date();
  const expiresAtDate = new Date(now.getTime() + CHECKOUT_LOCK_MINUTES * 60 * 1000);
  const nowIso = now.toISOString();

  const { data: lockedSlots, error: lockError } = await supabase
    .from("registration_entry_slots")
    .update({
      checkout_lock_status: "locked_for_checkout",
      checkout_lock_expires_at: expiresAtDate.toISOString(),
    })
    .in("entry_slot_id", input.entrySlotIds)
    .eq("payment_status", "unpaid")
    .or(`checkout_lock_status.eq.available,checkout_lock_expires_at.lt.${nowIso}`)
    .select("entry_slot_id");
  if (lockError) throw lockError;

  if (!lockedSlots || lockedSlots.length !== input.entrySlotIds.length) {
    // Partial claim — release whatever we did lock, then fail cleanly.
    if (lockedSlots?.length) {
      await supabase
        .from("registration_entry_slots")
        .update({ checkout_lock_status: "available", checkout_lock_expires_at: null })
        .in(
          "entry_slot_id",
          lockedSlots.map((s) => s.entry_slot_id)
        );
    }
    throw new Error(
      "One or more of these entries are already being paid for by someone else. Refresh and try again."
    );
  }

  const totalCents = sumEntryFeesCents(slots);

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: slots.map((slot) => ({
      quantity: 1,
      price_data: {
        currency: "usd",
        unit_amount: slot.entry_fee_amount_cents,
        product_data: { name: `Tournament entry — slot ${slot.slot_number}` },
      },
    })),
    customer_email: payer.email ?? undefined,
    success_url: `${process.env.APP_BASE_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.APP_BASE_URL}/payment/cancelled`,
    expires_at: Math.floor(expiresAtDate.getTime() / 1000),
    integration_identifier: `chaos-checkout-${randomLetters(8)}`,
    metadata: {
      tournament_id: registrationMeta.tournament_id,
      registration_id: registrationId,
      team_id: registrationMeta.team_id,
      payer_user_id: input.payerUserId,
      payer_discord_user_id: discordAccount?.discord_user_id ?? "",
      entry_slot_ids: JSON.stringify(input.entrySlotIds),
      entry_slot_count: String(input.entrySlotIds.length),
      checkout_total: String(totalCents),
      division: registrationMeta.tournaments?.division ?? "",
      registration_type: "tournament",
      currency: "usd",
    },
  });

  if (!session.url) throw new Error("Stripe did not return a checkout URL.");

  return session;
}

async function recordEventOnce(event: Stripe.Event, supabase: ReturnType<typeof createServiceRoleClient>) {
  const { error } = await supabase.from("payment_events").insert({
    stripe_event_id: event.id,
    event_type: event.type,
    payload: JSON.parse(JSON.stringify(event)) as Json,
  });
  // 23505 = unique_violation: we've already recorded (and presumably
  // processed or are processing) this event — Stripe retries deliveries,
  // so this is the idempotency guard, not an error.
  if (error && (error as { code?: string }).code === "23505") return false;
  if (error) throw error;
  return true;
}

async function markEventProcessed(eventId: string, supabase: ReturnType<typeof createServiceRoleClient>) {
  await supabase
    .from("payment_events")
    .update({ processed_at: new Date().toISOString() })
    .eq("stripe_event_id", eventId);
}

// Section 13 (CLAUDE.md): the only place an entry slot ever becomes 'paid'.
export async function handleCheckoutSessionCompleted(event: Stripe.Event) {
  const supabase = createServiceRoleClient();
  const isNewEvent = await recordEventOnce(event, supabase);
  if (!isNewEvent) return;

  const session = event.data.object as Stripe.Checkout.Session;
  const metadata = session.metadata ?? {};
  const entrySlotIds: string[] = metadata.entry_slot_ids
    ? JSON.parse(metadata.entry_slot_ids)
    : [];
  const payerUserId = metadata.payer_user_id;
  const registrationId = metadata.registration_id;

  const { data: slots } = await supabase
    .from("registration_entry_slots")
    .select("entry_slot_id, slot_number, entry_fee_amount_cents, payment_status, checkout_lock_status, registration_id")
    .in("entry_slot_id", entrySlotIds);

  const slotsStillEligible =
    !!slots &&
    slots.length === entrySlotIds.length &&
    slots.every(
      (s) => s.payment_status === "unpaid" && s.checkout_lock_status === "locked_for_checkout"
    );
  const recomputedTotal = slots ? sumEntryFeesCents(slots) : 0;
  const amountMatches = recomputedTotal === (session.amount_total ?? -1);

  if (!slotsStillEligible || !amountMatches || !payerUserId) {
    await supabase
      .from("payments")
      .insert({
        payer_user_id: payerUserId ?? null,
        stripe_checkout_session_id: session.id,
        stripe_payment_intent_id:
          typeof session.payment_intent === "string" ? session.payment_intent : null,
        amount_cents: session.amount_total ?? 0,
        status: "payment_mismatch",
      })
      .throwOnError();

    if (entrySlotIds.length) {
      await supabase
        .from("registration_entry_slots")
        .update({ payment_status: "admin_review" })
        .in("entry_slot_id", entrySlotIds);
    }
    if (registrationId) {
      await supabase
        .from("tournament_registrations")
        .update({ status: "payment_review" })
        .eq("registration_id", registrationId);
    }

    await markEventProcessed(event.id, supabase);
    return;
  }

  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .insert({
      payer_user_id: payerUserId,
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id:
        typeof session.payment_intent === "string" ? session.payment_intent : null,
      amount_cents: session.amount_total ?? recomputedTotal,
      status: "succeeded",
    })
    .select()
    .single();
  if (paymentError) throw paymentError;

  await supabase
    .from("payment_entry_allocations")
    .insert(
      slots!.map((slot) => ({
        payment_id: payment.payment_id,
        entry_slot_id: slot.entry_slot_id,
        amount_cents: slot.entry_fee_amount_cents,
      }))
    )
    .throwOnError();

  await supabase
    .from("registration_entry_slots")
    .update({
      payment_status: "paid",
      payer_user_id: payerUserId,
      payment_id: payment.payment_id,
      payout_entitlement_user_id: payerUserId,
      entitlement_status: "active",
      checkout_lock_status: "paid",
      checkout_lock_expires_at: null,
    })
    .in("entry_slot_id", entrySlotIds)
    .throwOnError();

  // payout_entitlements is the authoritative entitlement record as of
  // Phase 7 (CLAUDE.md Section 0); the entry_slot columns above remain a
  // denormalized read cache, same treatment as payment_id. Brief Section 11
  // steps 10-11: "set payout entitlement to the payer, mark it active."
  await supabase
    .from("payout_entitlements")
    .upsert(
      entrySlotIds.map((entrySlotId) => ({
        entry_slot_id: entrySlotId,
        holder_user_id: payerUserId,
        status: "active",
      })),
      { onConflict: "entry_slot_id" }
    )
    .throwOnError();

  await recalculateFundingStatus(registrationId, supabase);
  await markEventProcessed(event.id, supabase);
}

export async function handleCheckoutSessionExpired(event: Stripe.Event) {
  const supabase = createServiceRoleClient();
  const isNewEvent = await recordEventOnce(event, supabase);
  if (!isNewEvent) return;

  const session = event.data.object as Stripe.Checkout.Session;
  const metadata = session.metadata ?? {};
  const entrySlotIds: string[] = metadata.entry_slot_ids
    ? JSON.parse(metadata.entry_slot_ids)
    : [];

  if (entrySlotIds.length) {
    await supabase
      .from("registration_entry_slots")
      .update({ checkout_lock_status: "available", checkout_lock_expires_at: null })
      .in("entry_slot_id", entrySlotIds)
      .eq("checkout_lock_status", "locked_for_checkout");
  }

  await markEventProcessed(event.id, supabase);
}

async function recalculateFundingStatus(
  registrationId: string,
  supabase: ReturnType<typeof createServiceRoleClient>
) {
  const { data: registration } = await supabase
    .from("tournament_registrations")
    .select("tournament_id, tournaments(required_starting_players)")
    .eq("registration_id", registrationId)
    .single();
  const required =
    (registration?.tournaments as unknown as { required_starting_players: number } | null)
      ?.required_starting_players ?? 0;

  const { data: paidSlots } = await supabase
    .from("registration_entry_slots")
    .select("entry_slot_id")
    .eq("registration_id", registrationId)
    .eq("payment_status", "paid");

  const fundingStatus =
    required > 0 && (paidSlots?.length ?? 0) >= required
      ? "fully_funded"
      : (paidSlots?.length ?? 0) > 0
        ? "partially_funded"
        : "unfunded";

  await supabase
    .from("tournament_registrations")
    .update({ funding_status: fundingStatus })
    .eq("registration_id", registrationId);
}
