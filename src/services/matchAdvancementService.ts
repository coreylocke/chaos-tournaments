import "server-only";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { parseAndValidateSeriesScore } from "@/lib/rules/bracketRules";

type ServiceClient = ReturnType<typeof createServiceRoleClient>;

// Shared by finalizeMatch (real results) and bracketService's automatic bye
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

export type FinalizeMatchInput = {
  matchId: string;
  winnerTeamId: string;
  seriesScore: string;
  actingAdminUserId: string;
};

// CLAUDE.md Section 16's finalizeMatch. Admin-only for Phase 5 — the
// two-party captain-submits/opponent-confirms flow is explicitly Phase 6
// ("Results & Disputes"). Idempotency comes from the atomic conditional
// UPDATE below, not a DB constraint (see the bracket_engine migration for
// why the brief's originally-proposed constraint couldn't be shipped as-is).
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

  const loserTeamId =
    input.winnerTeamId === match.team_1_id ? match.team_2_id : match.team_1_id;

  const { data: updated, error: updateError } = await supabase
    .from("matches")
    .update({
      status: "completed",
      winner_team_id: input.winnerTeamId,
      loser_team_id: loserTeamId,
      result_type: "normal",
    })
    .eq("match_id", input.matchId)
    .in("status", ["pending", "ready", "in_progress", "awaiting_confirmation"])
    .select()
    .single();
  if (updateError || !updated) {
    throw new Error("This match is already finalized.");
  }

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

  await advanceWinner(match, input.winnerTeamId, supabase);

  return updated;
}
