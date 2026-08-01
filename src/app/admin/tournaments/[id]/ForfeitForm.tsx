"use client";

import { forfeitMatchAction } from "./actions";

export function ForfeitForm({
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
    <form action={forfeitMatchAction} className="flex items-center gap-2">
      <input type="hidden" name="tournament_id" value={tournamentId} />
      <input type="hidden" name="match_id" value={matchId} />
      <select
        name="forfeiting_team_id"
        required
        className="h-9 rounded-lg border border-zinc-300 px-2 text-xs dark:border-zinc-700 dark:bg-zinc-900"
      >
        <option value="">Forfeiting team…</option>
        <option value={team1.id}>{team1.name}</option>
        <option value={team2.id}>{team2.name}</option>
        <option value="__double__">Both (double forfeit)</option>
      </select>
      <button
        type="submit"
        className="h-9 rounded-full border border-red-300 px-3 text-xs font-medium text-red-600 dark:border-red-800 dark:text-red-400"
      >
        Forfeit
      </button>
    </form>
  );
}
