"use client";

import { submitResultAction } from "./actions";

export function SubmitResultForm({
  teamId,
  matchId,
  myTeam,
  opponentTeam,
}: {
  teamId: string;
  matchId: string;
  myTeam: { id: string; name: string };
  opponentTeam: { id: string; name: string };
}) {
  return (
    <form
      action={submitResultAction}
      encType="multipart/form-data"
      className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
    >
      <input type="hidden" name="team_id" value={teamId} />
      <input type="hidden" name="match_id" value={matchId} />

      <div className="flex flex-col gap-1">
        <label htmlFor="winner_team_id" className="text-sm font-medium">
          Winner
        </label>
        <select
          id="winner_team_id"
          name="winner_team_id"
          required
          className="h-11 rounded-lg border border-zinc-300 px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="">Select winner…</option>
          <option value={myTeam.id}>{myTeam.name}</option>
          <option value={opponentTeam.id}>{opponentTeam.name}</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="series_score" className="text-sm font-medium">
          Series score
        </label>
        <input
          id="series_score"
          name="series_score"
          placeholder="2-0"
          required
          className="h-11 rounded-lg border border-zinc-300 px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="evidence" className="text-sm font-medium">
          Scoreboard screenshot (optional)
        </label>
        <input
          id="evidence"
          name="evidence"
          type="file"
          accept="image/*"
          className="text-sm"
        />
      </div>

      <button
        type="submit"
        className="h-11 rounded-full bg-foreground px-5 text-sm font-medium text-background"
      >
        Submit result
      </button>
    </form>
  );
}
