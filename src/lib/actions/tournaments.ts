"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { notifyDiscord } from "@/lib/discord";
import { getPlatformSettings } from "@/lib/actions/settings";
import { createEntryFeeCheckoutSession } from "@/lib/actions/payments";
import type { ActionState } from "@/lib/actions/teams";

/**
 * Registers a team for a tournament (Section 22 of the brief). Lands the registration in
 * `awaiting_roster` if the roster isn't full yet. Once the roster meets the tournament's
 * required starting-player count: if the platform's entry fee is $0, goes straight to
 * `pending_review`; otherwise lands in `awaiting_entry_funding` and the captain is redirected
 * to Stripe Checkout to pay before it reaches `pending_review` (handled by the webhook on
 * successful payment — see src/app/api/stripe/webhook/route.ts).
 */
export async function registerTeamForTournament(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in." };
  }

  const tournamentId = String(formData.get("tournament_id") ?? "");
  const tournamentSlug = String(formData.get("tournament_slug") ?? "");
  const teamId = String(formData.get("team_id") ?? "");

  if (!teamId) {
    return { error: "Choose a team to register." };
  }

  const [{ data: team }, { data: tournament }] = await Promise.all([
    supabase.from("teams").select("team_name, captain_user_id, division").eq("team_id", teamId).single(),
    supabase
      .from("tournaments")
      .select("name, required_starting_players, division, status")
      .eq("tournament_id", tournamentId)
      .single(),
  ]);

  if (!team || team.captain_user_id !== user.id) {
    return { error: "Only the team captain can register this team." };
  }
  if (!tournament) {
    return { error: "Tournament not found." };
  }
  if (tournament.status !== "open") {
    return { error: "Registration isn't open for this tournament." };
  }
  if (team.division !== tournament.division) {
    return { error: `This tournament is ${tournament.division}-only; your team is registered as ${team.division}.` };
  }

  const { count: starterCount } = await supabase
    .from("team_members")
    .select("team_member_id", { count: "exact", head: true })
    .eq("team_id", teamId)
    .eq("roster_role", "starter")
    .eq("is_active", true);

  const rosterFull = (starterCount ?? 0) >= tournament.required_starting_players;
  const { entry_fee_cents: entryFeeCents } = await getPlatformSettings();
  const feeRequired = rosterFull && entryFeeCents > 0;

  const status = !rosterFull ? "awaiting_roster" : feeRequired ? "awaiting_entry_funding" : "pending_review";

  const { data: registration, error } = await supabase
    .from("tournament_registrations")
    .insert({
      tournament_id: tournamentId,
      team_id: teamId,
      registered_by: user.id,
      registration_status: status,
    })
    .select("registration_id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: "This team is already registered for this tournament." };
    }
    return { error: error.message };
  }

  await notifyDiscord(
    `**${team.team_name}** registered for **${tournament.name}** — status: ${status.replace(/_/g, " ")}`
  );

  revalidatePath(`/tournaments/${tournamentSlug}`);

  if (feeRequired) {
    const checkoutUrl = await createEntryFeeCheckoutSession({
      registrationId: registration.registration_id,
      tournamentName: tournament.name,
      teamName: team.team_name,
      tournamentSlug,
      payerUserId: user.id,
      amountCents: entryFeeCents,
    });
    redirect(checkoutUrl);
  }

  return undefined;
}

/** Withdraws a team's registration. Captain-only, enforced via RLS. */
export async function withdrawRegistration(registrationId: string, tournamentSlug: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("tournament_registrations")
    .delete()
    .eq("registration_id", registrationId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/tournaments/${tournamentSlug}`);
}
