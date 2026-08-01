import "server-only";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { parseAndValidateSeriesScore, requiredWins } from "@/lib/rules/bracketRules";
import { generatePayoutsForTournament } from "@/services/payoutService";

type ServiceClient = ReturnType<typeof createServiceRoleClient>;
type ResultType = "normal" | "bye" | "forfeit" | "double_forfeit" | "admin_score";

// Shared by completeMatch (real results) and bracketService's automatic bye
// advancement at bracket-generation time. Inserts the winner into its
// destination match's slot and marks that destination 'ready' once both
// slots are filled. No next_match_id means this was the final — mark the
// tournament completed (CLAUDE.md Section 16 / brief Section 32).
export async function advanceWinner(
  match: {
    tournament_id: string;
    next_match_id: string | null;
    next_match_slot: number | null;
  },
  winnerTeamId: string,
  supabase: ServiceClient
) {
  if (!match.next_match_id) {
    await supabase
      .from("tournaments")
      .update({ status: "completed" })
      .eq("tournament_id", match.tournament_id);

    const { data: bracket } = await supabase
      .from("brackets")
      .select("bracket_id")
      .eq("tournament_id", match.tournament_id)
      .single();
    if (bracket) {
      await supabase
        .from("brackets")
        .update({ status: "completed" })
        .eq("bracket_id", bracket.bracket_id);
    }

    // Brief Section 34: "when the championship match completes... create
    // payout records... place payouts into administrative review" — same
    // natural-trigger-point pattern as everything else in this build.
    await generatePayoutsForTournament(match.tournament_id, supabase);
    return;
  }

  await supabase
    .from("matches")
    .update(
      match.next_match_slot === 1
        ? { team_1_id: winnerTeamId }
        : { team_2_id: winnerTeamId }
    )
    .eq("match_id", match.next_match_id);

  const { data: destination } = await supabase
    .from("matches")
    .select("match_id, team_1_id, team_2_id, status")
    .eq("match_id", match.next_match_id)
    .single();

  if (
    destination &&
    destination.team_1_id &&
    destination.team_2_id &&
    destination.status === "pending"
  ) {
    await supabase
      .from("matches")
      .update({ status: "ready" })
      .eq("match_id", destination.match_id);
  }
}

// Best-effort, not perfectly race-free under concurrent writes for the same
// team (a read-then-write, same tradeoff already accepted elsewhere in this
// build, e.g. registration funding-status recalculation) — acceptable since
// a team is realistically only ever in one active match at a time.
async function bumpTeamStatistics(
  teamId: string,
  won: boolean,
  isForfeit: boolean,
  supabase: ServiceClient
) {
  await supabase
    .from("team_statistics")
    .upsert({ team_id: teamId }, { onConflict: "team_id", ignoreDuplicates: true });

  const { data: stats } = await supabase
    .from("team_statistics")
    .select("*")
    .eq("team_id", teamId)
    .single();
  if (!stats) return;

  const newStreak = won ? stats.current_win_streak + 1 : 0;
  await supabase
    .from("team_statistics")
    .update({
      matches_played: stats.matches_played + 1,
      matches_won: stats.matches_won + (won ? 1 : 0),
      matches_lost: stats.matches_lost + (won ? 0 : 1),
      forfeit_wins: stats.forfeit_wins + (won && isForfeit ? 1 : 0),
      forfeit_losses: stats.forfeit_losses + (!won && isForfeit ? 1 : 0),
      current_win_streak: newStreak,
      longest_win_streak: Math.max(stats.longest_win_streak, newStreak),
      updated_at: new Date().toISOString(),
    })
    .eq("team_id", teamId);
}

type MatchForCompletion = {
  match_id: string;
  tournament_id: string;
  team_1_id: string | null;
  team_2_id: string | null;
  next_match_id: string | null;
  next_match_slot: number | null;
};

// The core "a winner is now known" transition, shared by every path that
// can finalize a match: admin direct entry, opponent confirmation, dispute
// resolution, and forfeits. Idempotent via the atomic conditional UPDATE —
// see the bracket_engine migration for why a DB constraint couldn't be used
// instead. Byes don't call this (bracketService completes them directly at
// generation time) and so never touch team_statistics, matching Section 26
// ("a bye does not change ... prize-share count" — extended here to mean
// byes aren't a competitive result either).
async function completeMatch(
  match: MatchForCompletion,
  winnerTeamId: string,
  resultType: ResultType,
  supabase: ServiceClient
) {
  const loserTeamId =
    winnerTeamId === match.team_1_id ? match.team_2_id : match.team_1_id;

  const { data: updated, error } = await supabase
    .from("matches")
    .update({
      status: "completed",
      winner_team_id: winnerTeamId,
      loser_team_id: loserTeamId,
      result_type: resultType,
      dispute_status: null,
    })
    .eq("match_id", match.match_id)
    .in("status", ["pending", "ready", "in_progress", "awaiting_confirmation", "disputed"])
    .select()
    .single();
  if (error || !updated) {
    throw new Error("This match is already finalized.");
  }

  const isForfeit = resultType === "forfeit" || resultType === "double_forfeit";
  await bumpTeamStatistics(winnerTeamId, true, isForfeit, supabase);
  if (loserTeamId) await bumpTeamStatistics(loserTeamId, false, isForfeit, supabase);

  await advanceWinner(match, winnerTeamId, supabase);
  return updated;
}

export type FinalizeMatchInput = {
  matchId: string;
  winnerTeamId: string;
  seriesScore: string;
  actingAdminUserId: string;
};

// Admin direct result entry (Phase 5's original path — still available
// alongside Phase 6's captain-submit/opponent-confirm flow, e.g. for
// tournaments an admin wants to referee directly).
export async function finalizeMatch(input: FinalizeMatchInput) {
  const supabase = createServiceRoleClient();

  const { data: match, error } = await supabase
    .from("matches")
    .select(
      "match_id, tournament_id, team_1_id, team_2_id, status, dispute_status, next_match_id, next_match_slot, tournaments(best_of)"
    )
    .eq("match_id", input.matchId)
    .single();
  if (error) throw error;

  if (match.dispute_status) {
    throw new Error("This match has an open dispute and can't be finalized.");
  }
  if (!match.team_1_id || !match.team_2_id) {
    throw new Error("Both teams must be set before a result can be entered.");
  }
  if (input.winnerTeamId !== match.team_1_id && input.winnerTeamId !== match.team_2_id) {
    throw new Error("The winner must be one of the two teams in this match.");
  }

  const bestOf = (match.tournaments as unknown as { best_of: 1 | 3 | 5 }).best_of;
  parseAndValidateSeriesScore(input.seriesScore, bestOf);

  await supabase
    .from("match_results")
    .insert({
      match_id: input.matchId,
      submitted_by_user_id: input.actingAdminUserId,
      series_score: input.seriesScore,
    })
    .throwOnError();

  await supabase
    .from("match_confirmations")
    .insert({
      match_id: input.matchId,
      confirmed_by_user_id: input.actingAdminUserId,
      confirmation_type: "admin",
    })
    .throwOnError();

  return completeMatch(match, input.winnerTeamId, "normal", supabase);
}

async function loadMatchTeams(
  match: { team_1_id: string | null; team_2_id: string | null },
  supabase: ServiceClient
) {
  const { data: teams } = await supabase
    .from("teams")
    .select("team_id, captain_user_id")
    .in("team_id", [match.team_1_id, match.team_2_id].filter((v): v is string => !!v));
  return teams ?? [];
}

export type SubmitResultInput = {
  matchId: string;
  submittedByUserId: string;
  winnerTeamId: string;
  seriesScore: string;
  evidenceUrl?: string;
};

// Brief Section 31: captain submission. Doesn't finalize the match — sets
// it to 'awaiting_confirmation' with a tentative winner_team_id, pending
// the opposing captain's confirmResult/disputeResult.
export async function submitResult(input: SubmitResultInput) {
  const supabase = createServiceRoleClient();

  const { data: match, error } = await supabase
    .from("matches")
    .select(
      "match_id, tournament_id, team_1_id, team_2_id, status, next_match_id, next_match_slot, tournaments(best_of)"
    )
    .eq("match_id", input.matchId)
    .single();
  if (error) throw error;

  if (match.status !== "ready") {
    throw new Error("This match isn't ready for a result to be submitted.");
  }

  const teams = await loadMatchTeams(match, supabase);
  const captainTeam = teams.find((t) => t.captain_user_id === input.submittedByUserId);
  if (!captainTeam) {
    throw new Error("Only a captain of one of the two teams can submit a result.");
  }
  if (input.winnerTeamId !== match.team_1_id && input.winnerTeamId !== match.team_2_id) {
    throw new Error("The winner must be one of the two teams in this match.");
  }

  const bestOf = (match.tournaments as unknown as { best_of: 1 | 3 | 5 }).best_of;
  parseAndValidateSeriesScore(input.seriesScore, bestOf);

  await supabase
    .from("match_results")
    .insert({
      match_id: input.matchId,
      submitted_by_user_id: input.submittedByUserId,
      series_score: input.seriesScore,
    })
    .throwOnError();

  if (input.evidenceUrl) {
    await supabase
      .from("match_evidence")
      .insert({
        match_id: input.matchId,
        uploaded_by_user_id: input.submittedByUserId,
        file_url: input.evidenceUrl,
      })
      .throwOnError();
  }

  const { error: updateError } = await supabase
    .from("matches")
    .update({ status: "awaiting_confirmation", winner_team_id: input.winnerTeamId })
    .eq("match_id", input.matchId)
    .eq("status", "ready");
  if (updateError) throw updateError;
}

export async function confirmResult(input: { matchId: string; confirmingUserId: string }) {
  const supabase = createServiceRoleClient();

  const { data: match, error } = await supabase
    .from("matches")
    .select(
      "match_id, tournament_id, team_1_id, team_2_id, winner_team_id, status, next_match_id, next_match_slot"
    )
    .eq("match_id", input.matchId)
    .single();
  if (error) throw error;

  if (match.status !== "awaiting_confirmation" || !match.winner_team_id) {
    throw new Error("This match isn't awaiting confirmation.");
  }

  const { data: latestResult } = await supabase
    .from("match_results")
    .select("submitted_by_user_id")
    .eq("match_id", input.matchId)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .single();

  const teams = await loadMatchTeams(match, supabase);
  const submitterTeam = teams.find((t) => t.captain_user_id === latestResult?.submitted_by_user_id);
  const confirmerTeam = teams.find((t) => t.captain_user_id === input.confirmingUserId);

  if (!confirmerTeam) {
    throw new Error("Only a captain of one of the two teams can confirm this result.");
  }
  if (submitterTeam && confirmerTeam.team_id === submitterTeam.team_id) {
    throw new Error(
      "The team that submitted the result can't also confirm it — the opposing captain needs to confirm."
    );
  }

  await supabase
    .from("match_confirmations")
    .insert({
      match_id: input.matchId,
      confirmed_by_user_id: input.confirmingUserId,
      confirmation_type: "manual",
    })
    .throwOnError();

  return completeMatch(match, match.winner_team_id, "normal", supabase);
}

export type DisputeResultInput = {
  matchId: string;
  submittedByUserId: string;
  reason: string;
  description?: string;
};

// Brief Section 44: opening a dispute pauses automatic advancement.
export async function disputeResult(input: DisputeResultInput) {
  const supabase = createServiceRoleClient();

  const { data: match, error } = await supabase
    .from("matches")
    .select("match_id, team_1_id, team_2_id, status")
    .eq("match_id", input.matchId)
    .single();
  if (error) throw error;

  if (match.status !== "awaiting_confirmation") {
    throw new Error("This match isn't awaiting confirmation.");
  }

  const { data: latestResult } = await supabase
    .from("match_results")
    .select("submitted_by_user_id")
    .eq("match_id", input.matchId)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .single();

  const teams = await loadMatchTeams(match, supabase);
  const submitterTeam = teams.find((t) => t.captain_user_id === latestResult?.submitted_by_user_id);
  const disputerTeam = teams.find((t) => t.captain_user_id === input.submittedByUserId);

  if (!disputerTeam) {
    throw new Error("Only a captain of one of the two teams can raise a dispute.");
  }
  if (submitterTeam && disputerTeam.team_id === submitterTeam.team_id) {
    throw new Error(
      "The team that submitted the result can't dispute its own submission — the opposing captain needs to raise the dispute."
    );
  }

  await supabase
    .from("disputes")
    .insert({
      match_id: input.matchId,
      submitted_by_user_id: input.submittedByUserId,
      reason: input.reason,
      description: input.description ?? null,
    })
    .throwOnError();

  await supabase
    .from("matches")
    .update({ status: "disputed", dispute_status: "open" })
    .eq("match_id", input.matchId);
}

// Brief Section 39: three of the five double_no_show_policy options don't
// have a fully-specified bracket-tree consequence beyond "the match doesn't
// produce a normal winner" — advance_neither, award_bye_to_next_opponent,
// and void_match all collapse to voiding the match here, since properly
// implementing "give the bye to whoever's left" requires bracket-repair
// tooling this build doesn't have yet (Section 45's admin action list
// includes "repair bracket" as its own separate, unbuilt capability).
// reschedule_match resets to 'ready' since there's no scheduling system to
// reschedule *to*. advance_designated_team needs an explicit team from the
// caller since "designated" isn't otherwise defined.
async function applyDoubleForfeit(
  match: MatchForCompletion,
  supabase: ServiceClient,
  designatedWinnerTeamId?: string
) {
  const { data: tournament } = await supabase
    .from("tournaments")
    .select("tournament_settings(double_no_show_policy)")
    .eq("tournament_id", match.tournament_id)
    .single();
  const policy =
    (tournament?.tournament_settings as unknown as { double_no_show_policy: string } | null)
      ?.double_no_show_policy ?? "void_match";

  if (policy === "advance_designated_team") {
    if (!designatedWinnerTeamId) {
      throw new Error(
        "This tournament's double no-show policy requires designating which team advances."
      );
    }
    return completeMatch(match, designatedWinnerTeamId, "double_forfeit", supabase);
  }

  if (policy === "reschedule_match") {
    await supabase.from("matches").update({ status: "ready" }).eq("match_id", match.match_id);
    return;
  }

  await supabase
    .from("matches")
    .update({ status: "voided", result_type: "double_forfeit", dispute_status: null })
    .eq("match_id", match.match_id);
}

export type ForfeitMatchInput = {
  matchId: string;
  adminUserId: string;
  forfeitingTeamId?: string;
  doubleForfeit?: boolean;
  designatedWinnerTeamId?: string;
};

// Brief Section 39: forfeit score is required_wins-0 (Bo1 1-0, Bo3 2-0,
// Bo5 3-0); the winner advances normally.
export async function forfeitMatch(input: ForfeitMatchInput) {
  const supabase = createServiceRoleClient();

  const { data: match, error } = await supabase
    .from("matches")
    .select(
      "match_id, tournament_id, team_1_id, team_2_id, status, next_match_id, next_match_slot, tournaments(best_of)"
    )
    .eq("match_id", input.matchId)
    .single();
  if (error) throw error;
  if (!match.team_1_id || !match.team_2_id) {
    throw new Error("Both teams must be set before a forfeit can be issued.");
  }

  if (input.doubleForfeit) {
    await applyDoubleForfeit(match, supabase, input.designatedWinnerTeamId);
    return;
  }

  if (
    !input.forfeitingTeamId ||
    (input.forfeitingTeamId !== match.team_1_id && input.forfeitingTeamId !== match.team_2_id)
  ) {
    throw new Error("The forfeiting team must be one of the two teams in this match.");
  }
  const winnerTeamId =
    input.forfeitingTeamId === match.team_1_id ? match.team_2_id : match.team_1_id;

  const bestOf = (match.tournaments as unknown as { best_of: 1 | 3 | 5 }).best_of;
  const forfeitScore = `${requiredWins(bestOf)}-0`;

  await supabase
    .from("match_results")
    .insert({
      match_id: input.matchId,
      submitted_by_user_id: input.adminUserId,
      series_score: forfeitScore,
    })
    .throwOnError();

  return completeMatch(match, winnerTeamId!, "forfeit", supabase);
}

export type ResolveDisputeInput = {
  disputeId: string;
  resolution:
    | "original_result_upheld"
    | "result_reversed"
    | "match_replay"
    | "partial_replay"
    | "team_disqualified"
    | "double_forfeit"
    | "admin_score"
    | "match_voided";
  resolutionNotes?: string;
  adminUserId: string;
  disqualifiedTeamId?: string;
  adminWinnerTeamId?: string;
  adminSeriesScore?: string;
};

// Brief Section 44's eight resolution types. `team_disqualified` completes
// the match with result_type='admin_score' rather than a dedicated
// disqualification result_type — CLAUDE.md's matches.result_type CHECK
// constraint only has ('normal','bye','forfeit','double_forfeit',
// 'admin_score'), and the dispute's own `resolution` column already
// records *why* ('team_disqualified') — result_type only needs to record
// *how* the score was decided.
export async function resolveDispute(input: ResolveDisputeInput) {
  const supabase = createServiceRoleClient();

  const { data: dispute, error } = await supabase
    .from("disputes")
    .select("dispute_id, match_id, status")
    .eq("dispute_id", input.disputeId)
    .single();
  if (error) throw error;
  if (dispute.status === "resolved") {
    throw new Error("This dispute is already resolved.");
  }

  const { data: match, error: matchError } = await supabase
    .from("matches")
    .select(
      "match_id, tournament_id, team_1_id, team_2_id, winner_team_id, next_match_id, next_match_slot, tournaments(best_of)"
    )
    .eq("match_id", dispute.match_id)
    .single();
  if (matchError) throw matchError;

  await supabase
    .from("disputes")
    .update({
      status: "resolved",
      resolution: input.resolution,
      resolution_notes: input.resolutionNotes ?? null,
      assigned_admin_id: input.adminUserId,
      resolved_at: new Date().toISOString(),
    })
    .eq("dispute_id", input.disputeId);

  switch (input.resolution) {
    case "original_result_upheld": {
      if (!match.winner_team_id) throw new Error("No original result to uphold.");
      await completeMatch(match, match.winner_team_id, "normal", supabase);
      break;
    }
    case "result_reversed": {
      const newWinner =
        match.winner_team_id === match.team_1_id ? match.team_2_id : match.team_1_id;
      if (!newWinner) throw new Error("Can't determine the reversed winner.");
      await completeMatch(match, newWinner, "admin_score", supabase);
      break;
    }
    case "admin_score": {
      if (!input.adminWinnerTeamId || !input.adminSeriesScore) {
        throw new Error("An admin score resolution needs a winner and series score.");
      }
      const bestOf = (match.tournaments as unknown as { best_of: 1 | 3 | 5 }).best_of;
      parseAndValidateSeriesScore(input.adminSeriesScore, bestOf);
      await supabase
        .from("match_results")
        .insert({
          match_id: match.match_id,
          submitted_by_user_id: input.adminUserId,
          series_score: input.adminSeriesScore,
        })
        .throwOnError();
      await completeMatch(match, input.adminWinnerTeamId, "admin_score", supabase);
      break;
    }
    case "team_disqualified": {
      if (!input.disqualifiedTeamId) {
        throw new Error("Which team is disqualified must be specified.");
      }
      const winner =
        input.disqualifiedTeamId === match.team_1_id ? match.team_2_id : match.team_1_id;
      if (!winner) throw new Error("Can't determine the winning team.");
      await completeMatch(match, winner, "admin_score", supabase);
      break;
    }
    case "double_forfeit": {
      await applyDoubleForfeit(match, supabase);
      break;
    }
    case "match_replay":
    case "partial_replay": {
      // Map-level partial replays aren't representable — this build only
      // tracks a series_score, not per-map results — so partial_replay is
      // treated the same as a full replay: reset to 'ready' for
      // resubmission.
      await supabase
        .from("matches")
        .update({
          status: "ready",
          winner_team_id: null,
          loser_team_id: null,
          result_type: null,
          dispute_status: null,
        })
        .eq("match_id", match.match_id);
      break;
    }
    case "match_voided": {
      await supabase
        .from("matches")
        .update({ status: "voided", dispute_status: null })
        .eq("match_id", match.match_id);
      break;
    }
  }
}

// Brief Section 31: auto-confirmation, only when evidence is uploaded, no
// dispute is filed, and the confirmation window has expired; tournaments
// with a placement prize above auto_confirmation_value_threshold always
// require explicit/admin confirmation regardless of the window. There's no
// background job runner in this build (n8n integration is Phase 8), so
// this is evaluated lazily: called from the match page on load rather than
// on a timer. A match only auto-confirms once someone actually views it
// after the window has passed.
export async function maybeAutoConfirm(matchId: string) {
  const supabase = createServiceRoleClient();

  const { data: match } = await supabase
    .from("matches")
    .select(
      "match_id, tournament_id, team_1_id, team_2_id, winner_team_id, status, dispute_status, next_match_id, next_match_slot, tournaments(first_place_prize_cents, tournament_settings(auto_confirmation_enabled, auto_confirmation_window_minutes, auto_confirmation_value_threshold_cents))"
    )
    .eq("match_id", matchId)
    .single();

  if (!match || match.status !== "awaiting_confirmation" || !match.winner_team_id) return false;
  if (match.dispute_status) return false;

  const tournament = match.tournaments as unknown as {
    first_place_prize_cents: number | null;
    tournament_settings: {
      auto_confirmation_enabled: boolean;
      auto_confirmation_window_minutes: number;
      auto_confirmation_value_threshold_cents: number | null;
    } | null;
  } | null;
  const settings = tournament?.tournament_settings;
  if (!settings?.auto_confirmation_enabled) return false;

  const threshold = settings.auto_confirmation_value_threshold_cents;
  if (threshold != null && (tournament?.first_place_prize_cents ?? 0) > threshold) {
    return false;
  }

  const { data: evidence } = await supabase
    .from("match_evidence")
    .select("evidence_id")
    .eq("match_id", matchId)
    .limit(1);
  if (!evidence || evidence.length === 0) return false;

  const { data: latestResult } = await supabase
    .from("match_results")
    .select("submitted_at")
    .eq("match_id", matchId)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .single();
  if (!latestResult) return false;

  const windowMs = settings.auto_confirmation_window_minutes * 60 * 1000;
  const windowExpiresAt = new Date(latestResult.submitted_at).getTime() + windowMs;
  if (Date.now() < windowExpiresAt) return false;

  await supabase
    .from("match_confirmations")
    .insert({ match_id: matchId, confirmed_by_user_id: null, confirmation_type: "auto" })
    .throwOnError();

  await completeMatch(match, match.winner_team_id, "normal", supabase);
  return true;
}

export { completeMatch };
export type { MatchForCompletion, ResultType };
