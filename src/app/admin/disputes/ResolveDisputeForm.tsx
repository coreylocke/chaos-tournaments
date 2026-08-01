"use client";

import { useState } from "react";
import { resolveDisputeAction } from "./actions";

const RESOLUTIONS = [
  "original_result_upheld",
  "result_reversed",
  "admin_score",
  "team_disqualified",
  "double_forfeit",
  "match_replay",
  "partial_replay",
  "match_voided",
] as const;

export function ResolveDisputeForm({
  disputeId,
  team1,
  team2,
}: {
  disputeId: string;
  team1: { id: string; name: string };
  team2: { id: string; name: string };
}) {
  const [resolution, setResolution] = useState<string>("");

  return (
    <form action={resolveDisputeAction} className="flex flex-col gap-2 text-xs">
      <input type="hidden" name="dispute_id" value={disputeId} />

      <select
        name="resolution"
        required
        value={resolution}
        onChange={(e) => setResolution(e.target.value)}
        className="h-9 rounded-lg border border-zinc-300 px-2 dark:border-zinc-700 dark:bg-zinc-900"
      >
        <option value="">Resolution…</option>
        {RESOLUTIONS.map((r) => (
          <option key={r} value={r}>
            {r.replace(/_/g, " ")}
          </option>
        ))}
      </select>

      {resolution === "admin_score" && (
        <div className="flex gap-2">
          <select
            name="admin_winner_team_id"
            required
            className="h-9 flex-1 rounded-lg border border-zinc-300 px-2 dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value="">Winner…</option>
            <option value={team1.id}>{team1.name}</option>
            <option value={team2.id}>{team2.name}</option>
          </select>
          <input
            name="admin_series_score"
            placeholder="2-0"
            required
            className="h-9 w-16 rounded-lg border border-zinc-300 px-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
      )}

      {resolution === "team_disqualified" && (
        <select
          name="disqualified_team_id"
          required
          className="h-9 rounded-lg border border-zinc-300 px-2 dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="">Disqualified team…</option>
          <option value={team1.id}>{team1.name}</option>
          <option value={team2.id}>{team2.name}</option>
        </select>
      )}

      <input
        name="resolution_notes"
        placeholder="Notes (optional)"
        className="h-9 rounded-lg border border-zinc-300 px-2 dark:border-zinc-700 dark:bg-zinc-900"
      />

      <button
        type="submit"
        className="h-9 rounded-full bg-foreground px-3 font-medium text-background"
      >
        Resolve
      </button>
    </form>
  );
}
