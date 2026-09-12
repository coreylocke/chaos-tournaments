/**
 * Pure bracket-construction logic (Sections 25-27, 29 of the master brief) — no I/O, so
 * it's easy to reason about and unit-test independently of Supabase. Used by
 * src/lib/actions/bracket.ts.
 */

export type SeedTeam = { team_id: string };

export type BracketMatch = {
  match_id: string;
  round_number: number;
  round_name: string;
  match_number: number;
  team_1_id: string | null;
  team_2_id: string | null;
  next_match_id: string | null;
  next_match_slot: 1 | 2 | null;
  winner_team_id: string | null;
  loser_team_id: string | null;
  status: "pending" | "ready" | "completed";
  result_type: "normal" | "bye" | "admin_decision" | null;
};

/**
 * Standard power-of-two bracket seeding order (Section 27: "top seeds should be separated
 * across the bracket"). For size 8 this returns [1,8,4,5,2,7,3,6] — the well-known seeding
 * where 1 plays 8, 4 plays 5, etc. in round 1, and 1/2 can only meet in the final.
 */
function standardSeedOrder(size: number): number[] {
  let seeds = [1];
  while (seeds.length < size) {
    const n = seeds.length * 2;
    const next: number[] = [];
    for (const s of seeds) {
      next.push(s, n + 1 - s);
    }
    seeds = next;
  }
  return seeds;
}

function roundName(roundIndex: number, totalRounds: number): string {
  const fromEnd = totalRounds - roundIndex;
  if (fromEnd === 0) return "Championship";
  if (fromEnd === 1) return "Semifinals";
  if (fromEnd === 2) return "Quarterfinals";
  if (fromEnd === 3) return "Round of 16";
  if (fromEnd === 4) return "Round of 32";
  return `Round ${roundIndex}`;
}

/**
 * Builds a full single-elimination bracket (Section 25) from seeded teams (best seed
 * first). Creates every round's matches upfront with next_match_id/next_match_slot
 * linking (Section 28/29), assigns byes to the top seeds first (Section 26), and
 * propagates bye winners forward — including cascading byes — until every match's state
 * is as resolved as it can be without a real result. `genId` is injected so the caller
 * (a server action) supplies crypto.randomUUID() rather than this module depending on a
 * specific runtime.
 */
export function buildBracket(seededTeams: SeedTeam[], genId: () => string): BracketMatch[] {
  const teamCount = seededTeams.length;
  let bracketSize = 2;
  while (bracketSize < teamCount) bracketSize *= 2;
  const totalRounds = Math.log2(bracketSize);

  const order = standardSeedOrder(bracketSize);
  const slots: (SeedTeam | null)[] = order.map((seedNum) =>
    seedNum <= teamCount ? seededTeams[seedNum - 1] : null
  );

  const rounds: BracketMatch[][] = [];
  let matchCounter = 1;
  let prevRoundMatches: BracketMatch[] | null = null;

  for (let r = 1; r <= totalRounds; r++) {
    const numMatches = bracketSize / Math.pow(2, r);
    const roundMatches: BracketMatch[] = [];
    for (let i = 0; i < numMatches; i++) {
      const team1 = r === 1 ? slots[i * 2] : null;
      const team2 = r === 1 ? slots[i * 2 + 1] : null;
      roundMatches.push({
        match_id: genId(),
        round_number: r,
        round_name: roundName(r, totalRounds),
        match_number: matchCounter++,
        team_1_id: team1?.team_id ?? null,
        team_2_id: team2?.team_id ?? null,
        next_match_id: null,
        next_match_slot: null,
        winner_team_id: null,
        loser_team_id: null,
        status: "pending",
        result_type: null,
      });
    }
    if (prevRoundMatches) {
      for (let i = 0; i < prevRoundMatches.length; i++) {
        const target = roundMatches[Math.floor(i / 2)];
        prevRoundMatches[i].next_match_id = target.match_id;
        prevRoundMatches[i].next_match_slot = i % 2 === 0 ? 1 : 2;
      }
    }
    rounds.push(roundMatches);
    prevRoundMatches = roundMatches;
  }

  const allMatches = rounds.flat();

  // Round 1: resolve byes and mark real matches ready.
  for (const m of rounds[0]) {
    if (m.team_1_id && !m.team_2_id) {
      m.status = "completed";
      m.result_type = "bye";
      m.winner_team_id = m.team_1_id;
    } else if (!m.team_1_id && m.team_2_id) {
      m.status = "completed";
      m.result_type = "bye";
      m.winner_team_id = m.team_2_id;
    } else if (m.team_1_id && m.team_2_id) {
      m.status = "ready";
    }
  }

  // Propagate bye winners forward (and any resulting cascades) until nothing changes.
  const byId = new Map(allMatches.map((m) => [m.match_id, m]));
  let changed = true;
  while (changed) {
    changed = false;
    for (const m of allMatches) {
      if (m.status === "completed" && m.winner_team_id && m.next_match_id) {
        const next = byId.get(m.next_match_id)!;
        const slotKey = m.next_match_slot === 1 ? "team_1_id" : "team_2_id";
        if (!next[slotKey]) {
          next[slotKey] = m.winner_team_id;
          changed = true;
        }
      }
    }
    for (const m of allMatches) {
      if (m.status === "pending" && m.team_1_id && m.team_2_id) {
        m.status = "ready";
      }
    }
  }

  return allMatches;
}
