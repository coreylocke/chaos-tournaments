"use client";

import { finalizeMatchAction } from "./actions";

export function EnterResultForm({
  tournamentId,
  matchId,
  team1,
  team2,
}: {
  tournamentId: string;
  matchId: string;
  team1: { id: string; name: string };
  team2: { id: string; name: string };
}) {
  return (
    <form action={finalizeMatchAction} className="flex items-center gap-2">
      <input type="hidden" name="tournament_id" value={tournamentId} />
      <input type="hidden" name="match_id" value={matchId} />
      <select
        name="winner_team_id"
        required
        className="h-9 rounded-lg border border-zinc-300 px-2 text-xs dark:border-zinc-700 dark:bg-zinc-900"
      >
        <option value="">Winner…</option>
        <option value={team1.id}>{team1.name}</option>
        <option value={team2.id}>{team2.name}</option>
      </select>
      <input
        name="series_score"
        placeholder="2-0"
        required
        className="h-9 w-16 rounded-lg border border-zinc-300 px-2 text-xs dark:border-zinc-700 dark:bg-zinc-900"
      />
      <button
        type="submit"
        className="h-9 rounded-full bg-foreground px-3 text-xs font-medium text-background"
      >
        Submit
      </button>
    </form>
  );
}
