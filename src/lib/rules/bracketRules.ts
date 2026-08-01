// Centralizes single-elimination bracket math per the master brief's
// Sections 25-30, so it's never hard-coded inline.

export function nextPowerOfTwo(n: number): number {
  let size = 1;
  while (size < n) size *= 2;
  return size;
}

// Standard tournament-bracket seed placement: for a bracket of size N,
// returns the seed number occupying each slot (0-indexed) such that
// seed 1 and seed 2 land on opposite halves, seed 1 plays the lowest
// remaining seed, etc. — this is what "top seeds should be separated
// across the bracket" (brief Section 27) means in practice, and it also
// naturally distributes byes across the bracket rather than clustering
// them (brief Section 26), since phantom/bye seeds (> eligible team
// count) fall out of the same recursive placement as real seeds.
export function computeSeedOrder(bracketSize: number): number[] {
  let order = [1];
  while (order.length < bracketSize) {
    const n = order.length * 2;
    const next: number[] = [];
    for (const s of order) {
      next.push(s, n + 1 - s);
    }
    order = next;
  }
  return order;
}

// Brief Section 25: "Eight-team: Quarterfinals, Semifinals, Championship."
// "Sixteen-team: Round of 16, Quarterfinals, Semifinals, Championship."
// "Thirty-two-team: Round of 32, Round of 16, Quarterfinals, Semifinals,
// Championship." Verified this formula reproduces all three examples.
export function roundName(
  roundNumber: number,
  totalRounds: number,
  bracketSize: number
): string {
  const roundsFromFinal = totalRounds - roundNumber;
  if (roundsFromFinal === 0) return "Championship";
  if (roundsFromFinal === 1) return "Semifinals";
  if (roundsFromFinal === 2) return "Quarterfinals";
  const teamsEnteringRound = bracketSize / 2 ** (roundNumber - 1);
  return `Round of ${teamsEnteringRound}`;
}

// Brief Section 30: required_wins = floor(best_of / 2) + 1.
export function requiredWins(bestOf: 1 | 3 | 5): number {
  return Math.floor(bestOf / 2) + 1;
}

export type SeriesScore = { winnerScore: number; loserScore: number };

// Parses "W-L" and validates it against best_of. Bo3 2-0/2-1 valid;
// Bo3 1-1/3-1 invalid; Bo1 2-0 invalid — matches the brief's worked
// examples in Section 30 exactly.
export function parseAndValidateSeriesScore(
  raw: string,
  bestOf: 1 | 3 | 5
): SeriesScore {
  const match = raw.trim().match(/^(\d+)\s*-\s*(\d+)$/);
  if (!match) {
    throw new Error(`"${raw}" isn't a valid score format (expected "W-L").`);
  }
  const a = Number(match[1]);
  const b = Number(match[2]);
  const winnerScore = Math.max(a, b);
  const loserScore = Math.min(a, b);
  const needed = requiredWins(bestOf);

  if (a === b) {
    throw new Error(`"${raw}" can't be a tie — Best of ${bestOf} needs a winner.`);
  }
  if (winnerScore !== needed || loserScore >= needed) {
    throw new Error(
      `"${raw}" isn't a valid Best of ${bestOf} score. The winner must have exactly ${needed} map win${needed === 1 ? "" : "s"}.`
    );
  }

  return { winnerScore, loserScore };
}
