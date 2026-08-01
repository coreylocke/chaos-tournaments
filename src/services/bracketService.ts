import "server-only";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { computeSeedOrder, nextPowerOfTwo, roundName } from "@/lib/rules/bracketRules";
import { advanceWinner } from "@/services/matchAdvancementService";

type MatchPlan = {
  id: string;
  round: number;
  position: number;
  team1Id: string | null;
  team2Id: string | null;
  isBye: boolean;
  byeWinnerId: string | null;
  nextMatchId: string | null;
  nextMatchSlot: number | null;
};

// CLAUDE.md Section 15/25-27 (brief). Admin-only; authorization happens in
// the caller, same as the rest of the service layer. Eligibility gate
// matches the brief's exact bracket-entry condition: registration_status =
// approved, funding_status = fully_funded, check_in_status = checked_in.
export async function generateBracket(tournamentId: string) {
  const supabase = createServiceRoleClient();

  const { data: tournament, error: tournamentError } = await supabase
    .from("tournaments")
    .select("tournament_id, minimum_teams, status")
    .eq("tournament_id", tournamentId)
    .single();
  if (tournamentError) throw tournamentError;

  const { data: existingBracket } = await supabase
    .from("brackets")
    .select("bracket_id")
    .eq("tournament_id", tournamentId)
    .maybeSingle();
  if (existingBracket) {
    throw new Error("A bracket has already been generated for this tournament.");
  }

  const { data: eligible, error: eligibleError } = await supabase
    .from("tournament_registrations")
    .select("registration_id, team_id, created_at")
    .eq("tournament_id", tournamentId)
    .eq("status", "approved")
    .eq("funding_status", "fully_funded")
    .not("checked_in_at", "is", null)
    .order("created_at", { ascending: true });
  if (eligibleError) throw eligibleError;

  const teams = eligible ?? [];
  if (teams.length < tournament.minimum_teams) {
    throw new Error(
      `Need at least ${tournament.minimum_teams} approved, funded, checked-in teams to generate a bracket — only ${teams.length} qualify right now.`
    );
  }

  const bracketSize = nextPowerOfTwo(teams.length);
  const seedOrder = computeSeedOrder(bracketSize);
  const totalRounds = Math.log2(bracketSize);

  const { data: bracket, error: bracketError } = await supabase
    .from("brackets")
    .insert({ tournament_id: tournamentId, bracket_size: bracketSize, status: "active" })
    .select()
    .single();
  if (bracketError) throw bracketError;

  const slotTeamId: (string | null)[] = seedOrder.map((seed) =>
    seed <= teams.length ? teams[seed - 1].team_id : null
  );

  await supabase
    .from("bracket_slots")
    .insert(
      seedOrder.map((seed, i) => ({
        bracket_id: bracket.bracket_id,
        seed,
        team_id: slotTeamId[i],
        is_bye: seed > teams.length,
      }))
    )
    .throwOnError();

  // Build the full match tree in memory first (round -> position -> plan),
  // so every match's next_match_id/next_match_slot can be resolved before
  // any row is written — one batch insert, not per-round round-trips.
  const plans: MatchPlan[][] = [];
  for (let round = 1; round <= totalRounds; round++) {
    const matchesInRound = bracketSize / 2 ** round;
    plans[round] = Array.from({ length: matchesInRound }, (_, position) => ({
      id: crypto.randomUUID(),
      round,
      position,
      team1Id: null,
      team2Id: null,
      isBye: false,
      byeWinnerId: null,
      nextMatchId: null,
      nextMatchSlot: null,
    }));
  }

  for (let position = 0; position < plans[1].length; position++) {
    const team1 = slotTeamId[position * 2];
    const team2 = slotTeamId[position * 2 + 1];
    const plan = plans[1][position];
    plan.team1Id = team1;
    plan.team2Id = team2;
    if ((team1 && !team2) || (!team1 && team2)) {
      plan.isBye = true;
      plan.byeWinnerId = team1 ?? team2;
    }
  }

  const rows = [];
  for (let round = 1; round <= totalRounds; round++) {
    for (const plan of plans[round]) {
      const nextPlan =
        round < totalRounds ? plans[round + 1][Math.floor(plan.position / 2)] : null;
      plan.nextMatchId = nextPlan?.id ?? null;
      plan.nextMatchSlot = nextPlan ? (plan.position % 2 === 0 ? 1 : 2) : null;
      rows.push({
        match_id: plan.id,
        tournament_id: tournamentId,
        bracket_id: bracket.bracket_id,
        round_number: round,
        round_name: roundName(round, totalRounds, bracketSize),
        match_number: plan.position + 1,
        bracket_position: plan.position,
        team_1_id: plan.team1Id,
        team_2_id: plan.team2Id,
        status: plan.isBye
          ? "completed"
          : plan.team1Id && plan.team2Id
            ? "ready"
            : "pending",
        result_type: plan.isBye ? "bye" : null,
        winner_team_id: plan.isBye ? plan.byeWinnerId : null,
        next_match_id: plan.nextMatchId,
        next_match_slot: plan.nextMatchSlot,
      });
    }
  }

  await supabase.from("matches").insert(rows).throwOnError();

  // Cascade byes: a bye is already 'completed' as inserted above, but its
  // winner still needs to be placed into the next round (brief Section 26:
  // byes advance automatically, same as any other completed match).
  for (const plan of plans[1]) {
    if (plan.isBye && plan.byeWinnerId) {
      await advanceWinner(
        { tournament_id: tournamentId, next_match_id: plan.nextMatchId, next_match_slot: plan.nextMatchSlot },
        plan.byeWinnerId,
        supabase
      );
    }
  }

  await supabase
    .from("tournaments")
    .update({ status: "in_progress" })
    .eq("tournament_id", tournamentId);

  return bracket;
}
