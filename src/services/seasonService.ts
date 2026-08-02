import "server-only";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { roundName } from "@/lib/rules/bracketRules";

type ServiceClient = ReturnType<typeof createServiceRoleClient>;

type PlacementTier =
  | "champion"
  | "runner_up"
  | "semifinalist"
  | "quarterfinalist"
  | "round_of_16"
  | "participation"
  | "forfeit_loss"
  | "disqualification";

// Brief Section 38's suggested values — the actual defaults live in the
// DB column default; this is only a fallback if tournament_settings is
// somehow missing (shouldn't happen, every tournament gets one row).
const DEFAULT_POINTS: Record<PlacementTier, number> = {
  champion: 100,
  runner_up: 70,
  semifinalist: 45,
  quarterfinalist: 25,
  round_of_16: 10,
  participation: 5,
  forfeit_loss: 0,
  disqualification: 0,
};

type MatchRow = {
  match_id: string;
  round_number: number;
  team_1_id: string | null;
  team_2_id: string | null;
  winner_team_id: string | null;
  loser_team_id: string | null;
  status: string;
  result_type: string | null;
};

// CLAUDE.md Section 0 (Phase 9) / brief Section 38: awards season ranking
// points once a tournament's championship match completes, alongside
// payoutService's own tournament-completion work. A tournament with no
// season_id never triggers this — seasons are opt-in per tournament.
// Idempotent: skips if season_points rows already exist for this
// tournament (same pattern as payoutService.generatePayoutsForTournament).
export async function awardSeasonPoints(tournamentId: string, supabase: ServiceClient) {
  const { data: tournament } = await supabase
    .from("tournaments")
    .select("season_id")
    .eq("tournament_id", tournamentId)
    .single();
  if (!tournament?.season_id) return;

  const { data: existing } = await supabase
    .from("season_points")
    .select("season_points_id")
    .eq("tournament_id", tournamentId)
    .limit(1)
    .maybeSingle();
  if (existing) return;

  const { data: settings } = await supabase
    .from("tournament_settings")
    .select("ranking_points_config")
    .eq("tournament_id", tournamentId)
    .single();
  const points: Record<PlacementTier, number> = {
    ...DEFAULT_POINTS,
    ...((settings?.ranking_points_config as Partial<Record<PlacementTier, number>>) ?? {}),
  };

  const { data: bracket } = await supabase
    .from("brackets")
    .select("bracket_id")
    .eq("tournament_id", tournamentId)
    .single();
  if (!bracket) return;

  const { data: matches } = await supabase
    .from("matches")
    .select("match_id, round_number, team_1_id, team_2_id, winner_team_id, loser_team_id, status, result_type, next_match_id")
    .eq("bracket_id", bracket.bracket_id);
  if (!matches?.length) return;

  const finalMatch = matches.find((m) => !m.next_match_id);
  if (!finalMatch || finalMatch.status !== "completed" || !finalMatch.winner_team_id) return;

  const totalRounds = Math.max(...matches.map((m) => m.round_number));
  const bracketSize = 2 ** totalRounds;

  const { data: eligibleRegs } = await supabase
    .from("tournament_registrations")
    .select("team_id")
    .eq("tournament_id", tournamentId)
    .eq("status", "approved")
    .eq("funding_status", "fully_funded")
    .not("checked_in_at", "is", null);
  const teamIds = [...new Set((eligibleRegs ?? []).map((r) => r.team_id))];
  if (!teamIds.length) return;

  const matchIds = matches.map((m) => m.match_id);
  const { data: dqDisputes } = await supabase
    .from("disputes")
    .select("match_id")
    .in("match_id", matchIds)
    .eq("resolution", "team_disqualified");
  const dqMatchIds = new Set((dqDisputes ?? []).map((d) => d.match_id));

  function classify(teamId: string): PlacementTier {
    if (teamId === finalMatch!.winner_team_id) return "champion";
    if (teamId === finalMatch!.loser_team_id) return "runner_up";

    // Highest-round match this team appears in at all — not just losses,
    // since a voided double-forfeit match leaves both winner_team_id and
    // loser_team_id null (see matchAdvancementService.applyDoubleForfeit's
    // void_match branch), which a loser-only search would miss entirely.
    const appearances = (matches as MatchRow[])
      .filter((m) => m.team_1_id === teamId || m.team_2_id === teamId)
      .sort((a, b) => b.round_number - a.round_number);
    const last = appearances[0];
    if (!last) return "participation";

    if (last.result_type === "forfeit" || last.result_type === "double_forfeit") {
      return "forfeit_loss";
    }
    if (dqMatchIds.has(last.match_id) && last.loser_team_id === teamId) {
      return "disqualification";
    }
    if (last.winner_team_id === teamId) {
      // Won their last known match but isn't the champion/runner-up —
      // shouldn't happen in a properly progressing bracket (a win always
      // advances into a real next match). Defensive fallback only.
      return "participation";
    }

    const label = roundName(last.round_number, totalRounds, bracketSize);
    if (label === "Semifinals") return "semifinalist";
    if (label === "Quarterfinals") return "quarterfinalist";
    if (label === "Round of 16") return "round_of_16";
    return "participation";
  }

  const rows = teamIds.map((teamId) => {
    const tier = classify(teamId);
    return {
      season_id: tournament.season_id as string,
      tournament_id: tournamentId,
      team_id: teamId,
      points: points[tier],
      placement_tier: tier,
    };
  });

  await supabase.from("season_points").insert(rows).throwOnError();
}
