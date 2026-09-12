"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { notifyDiscord } from "@/lib/discord";
import { buildBracket } from "@/lib/bracket";
import { getPlatformSettings } from "@/lib/actions/settings";
import { processReadyPayoutsForUser } from "@/lib/actions/payouts";
import { notifyBotRoleSync } from "@/lib/bot";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not logged in.");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("is_admin")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!profile?.is_admin) throw new Error("Not an admin.");
}

/**
 * Generates the full single-elimination bracket for a tournament (Section 25) from its
 * `approved` registrations, seeded by registration order (the only ordering signal that
 * exists without a points/ranking system — Section 27 supports richer seeding methods,
 * this implements the `registration_order` one). Admin-only.
 *
 * Sets every included registration to `active`, and any that won a Round 1 bye stays
 * `active` too (a bye isn't elimination). Tournament status moves to `in_progress`.
 */
export async function generateBracket(tournamentId: string, tournamentSlug: string) {
  await requireAdmin();

  const admin = createAdminClient();

  const { data: tournament } = await admin
    .from("tournaments")
    .select("name, status")
    .eq("tournament_id", tournamentId)
    .single();
  if (!tournament) throw new Error("Tournament not found.");

  const { count: matchCount } = await admin
    .from("matches")
    .select("match_id", { count: "exact", head: true })
    .eq("tournament_id", tournamentId);
  if (matchCount && matchCount > 0) {
    throw new Error("A bracket already exists for this tournament.");
  }

  const { data: registrations } = await admin
    .from("tournament_registrations")
    .select("registration_id, team_id, created_at, teams(team_name)")
    .eq("tournament_id", tournamentId)
    .eq("registration_status", "approved")
    .order("created_at", { ascending: true });

  if (!registrations || registrations.length < 2) {
    throw new Error("Need at least 2 approved teams to generate a bracket.");
  }

  const seededTeams = registrations.map((r) => ({ team_id: r.team_id }));
  const matches = buildBracket(seededTeams, randomUUID);

  const { error: insertError } = await admin.from("matches").insert(
    matches.map((m) => ({
      match_id: m.match_id,
      tournament_id: tournamentId,
      round_number: m.round_number,
      round_name: m.round_name,
      match_number: m.match_number,
      team_1_id: m.team_1_id,
      team_2_id: m.team_2_id,
      next_match_id: m.next_match_id,
      next_match_slot: m.next_match_slot,
      winner_team_id: m.winner_team_id,
      loser_team_id: m.loser_team_id,
      status: m.status,
      result_type: m.result_type,
    }))
  );
  if (insertError) throw new Error(insertError.message);

  const { error: regError } = await admin
    .from("tournament_registrations")
    .update({ registration_status: "active" })
    .eq("tournament_id", tournamentId)
    .eq("registration_status", "approved");
  if (regError) throw new Error(regError.message);

  const { error: tourneyError } = await admin
    .from("tournaments")
    .update({ status: "in_progress" })
    .eq("tournament_id", tournamentId);
  if (tourneyError) throw new Error(tourneyError.message);

  await notifyDiscord(
    `**Bracket generated for ${tournament.name}** — ${registrations.length} teams, single elimination.\nhttps://chaostournaments.com/tournaments/${tournamentSlug}/bracket`
  );

  revalidatePath(`/admin/tournaments/${tournamentSlug}/edit`);
  revalidatePath(`/tournaments/${tournamentSlug}`);
  revalidatePath(`/tournaments/${tournamentSlug}/bracket`);
}

/**
 * Records a match result and advances the winner (Section 32's finalize_match, simplified:
 * admin reports the winner directly — no best-of score, no two-party confirmation, no
 * disputes; result_type is always `admin_decision`). Admin-only.
 */
export async function reportMatchResult(matchId: string, tournamentSlug: string, winnerTeamId: string) {
  await requireAdmin();

  const admin = createAdminClient();

  const { data: match } = await admin
    .from("matches")
    .select("match_id, tournament_id, status, team_1_id, team_2_id, next_match_id, next_match_slot, round_name")
    .eq("match_id", matchId)
    .single();
  if (!match) throw new Error("Match not found.");
  if (match.status === "completed") throw new Error("This match already has a result.");
  if (match.status !== "ready") throw new Error("This match isn't ready yet (still waiting on a feeder match).");
  if (winnerTeamId !== match.team_1_id && winnerTeamId !== match.team_2_id) {
    throw new Error("Winner must be one of the two teams in this match.");
  }

  const loserTeamId = winnerTeamId === match.team_1_id ? match.team_2_id : match.team_1_id;

  const { error: matchError } = await admin
    .from("matches")
    .update({
      status: "completed",
      result_type: "admin_decision",
      winner_team_id: winnerTeamId,
      loser_team_id: loserTeamId,
    })
    .eq("match_id", matchId);
  if (matchError) throw new Error(matchError.message);

  if (loserTeamId) {
    await admin
      .from("tournament_registrations")
      .update({ registration_status: "eliminated" })
      .eq("tournament_id", match.tournament_id)
      .eq("team_id", loserTeamId);
  }

  const [{ data: winnerTeam }, { data: loserTeam }] = await Promise.all([
    admin.from("teams").select("team_name").eq("team_id", winnerTeamId).single(),
    loserTeamId ? admin.from("teams").select("team_name").eq("team_id", loserTeamId).single() : Promise.resolve({ data: null }),
  ]);

  if (match.next_match_id) {
    const slotKey = match.next_match_slot === 1 ? "team_1_id" : "team_2_id";
    const { data: nextMatch } = await admin
      .from("matches")
      .select("team_1_id, team_2_id")
      .eq("match_id", match.next_match_id)
      .single();

    const updated = { ...nextMatch, [slotKey]: winnerTeamId };
    const bothPresent = Boolean(updated.team_1_id && updated.team_2_id);

    await admin
      .from("matches")
      .update({ [slotKey]: winnerTeamId, ...(bothPresent ? { status: "ready" } : {}) })
      .eq("match_id", match.next_match_id);

    await notifyDiscord(`**${winnerTeam?.team_name}** won ${match.round_name} and advances.`);
  } else {
    // Championship match — crown the winner, close out the tournament.
    const { data: winnerRegistration } = await admin
      .from("tournament_registrations")
      .update({ registration_status: "winner" })
      .eq("tournament_id", match.tournament_id)
      .eq("team_id", winnerTeamId)
      .select("registration_id")
      .single();

    let runnerUpRegistration: { registration_id: string } | null = null;
    if (loserTeamId) {
      const { data } = await admin
        .from("tournament_registrations")
        .update({ registration_status: "runner_up" })
        .eq("tournament_id", match.tournament_id)
        .eq("team_id", loserTeamId)
        .select("registration_id")
        .single();
      runnerUpRegistration = data;
    }

    const { data: tournament } = await admin
      .from("tournaments")
      .update({ status: "completed" })
      .eq("tournament_id", match.tournament_id)
      .select("name")
      .single();

    await notifyDiscord(
      `🏆 **${winnerTeam?.team_name} wins ${tournament?.name}!**${loserTeam ? ` Runner-up: ${loserTeam.team_name}.` : ""}`
    );

    await createTournamentPayouts({
      tournamentId: match.tournament_id,
      winnerRegistrationId: winnerRegistration?.registration_id ?? null,
      runnerUpRegistrationId: runnerUpRegistration?.registration_id ?? null,
    });

    await notifyBotRoleSync({
      event: "tournament_completed",
      winnerTeamId: winnerTeamId,
      runnerUpTeamId: loserTeamId ?? null,
    });
  }

  revalidatePath(`/tournaments/${tournamentSlug}/bracket`);
  revalidatePath(`/tournaments/${tournamentSlug}`);
  revalidatePath(`/admin/tournaments/${tournamentSlug}/edit`);
}

/**
 * Builds the prize pool from every paid entry fee in the tournament, takes the platform's
 * cut, splits the remainder winner/runner-up per platform_settings, and writes
 * tournament_payouts rows. Recipient is whoever paid the entry fee for that placement's team
 * (falls back to whoever registered the team if it never had a paid entry fee, e.g. a free
 * tournament). No-ops if nothing was collected. Fires an immediate transfer attempt for any
 * recipient who's already completed Connect onboarding from a previous win.
 */
async function createTournamentPayouts(params: {
  tournamentId: string;
  winnerRegistrationId: string | null;
  runnerUpRegistrationId: string | null;
}) {
  const { tournamentId, winnerRegistrationId, runnerUpRegistrationId } = params;
  if (!winnerRegistrationId) return;

  const admin = createAdminClient();
  const settings = await getPlatformSettings();

  const { data: allRegistrationIds } = await admin
    .from("tournament_registrations")
    .select("registration_id")
    .eq("tournament_id", tournamentId);

  const { data: payments } = await admin
    .from("registration_payments")
    .select("registration_id, paid_by, amount_cents")
    .eq("status", "paid")
    .in("registration_id", (allRegistrationIds ?? []).map((r) => r.registration_id));

  const totalCents = (payments ?? []).reduce((sum, p) => sum + p.amount_cents, 0);
  if (totalCents <= 0) return; // Free tournament — nothing to pay out.

  const netCents = Math.round(totalCents * (1 - Number(settings.platform_fee_percent) / 100));
  const winnerShare = Number(settings.winner_share_percent) / 100;

  const paymentsByRegistration = new Map((payments ?? []).map((p) => [p.registration_id, p]));

  async function recipientFor(registrationId: string): Promise<string | null> {
    const payment = paymentsByRegistration.get(registrationId);
    if (payment) return payment.paid_by;
    const { data: registration } = await admin
      .from("tournament_registrations")
      .select("registered_by")
      .eq("registration_id", registrationId)
      .single();
    return registration?.registered_by ?? null;
  }

  const placements: { registrationId: string; placement: "winner" | "runner_up"; amountCents: number }[] = [
    { registrationId: winnerRegistrationId, placement: "winner", amountCents: Math.round(netCents * winnerShare) },
  ];
  if (runnerUpRegistrationId) {
    placements.push({
      registrationId: runnerUpRegistrationId,
      placement: "runner_up",
      amountCents: netCents - Math.round(netCents * winnerShare),
    });
  }

  for (const p of placements) {
    if (p.amountCents <= 0) continue;
    const recipientUserId = await recipientFor(p.registrationId);
    if (!recipientUserId) continue;

    const { error } = await admin.from("tournament_payouts").insert({
      tournament_id: tournamentId,
      registration_id: p.registrationId,
      recipient_user_id: recipientUserId,
      placement: p.placement,
      amount_cents: p.amountCents,
      status: "awaiting_onboarding",
    });
    if (error && error.code !== "23505") {
      console.error("[payouts] failed to create payout row:", error.message);
      continue;
    }

    await notifyDiscord(
      `🏅 $${(p.amountCents / 100).toFixed(2)} prize payout is waiting on Connect onboarding for the ${
        p.placement === "winner" ? "1st place" : "2nd place"
      } team's payer. They'll be paid automatically once they set it up on their dashboard.`
    );

    await processReadyPayoutsForUser(recipientUserId);
  }
}
