"use client";

import { useState, useTransition } from "react";
import { reportMatchResult } from "@/lib/actions/bracket";

export default function ReportMatchResultButtons({
  matchId,
  tournamentSlug,
  team1Id,
  team1Name,
  team2Id,
  team2Name,
}: {
  matchId: string;
  tournamentSlug: string;
  team1Id: string;
  team1Name: string;
  team2Id: string;
  team2Name: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function report(winnerId: string) {
    startTransition(async () => {
      setError(null);
      try {
        await reportMatchResult(matchId, tournamentSlug, winnerId);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to report result.");
      }
    });
  }

  return (
    <div className="mt-2">
      <p className="mb-1 text-xs uppercase tracking-wide text-chaos-white/50">Report winner</p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => report(team1Id)}
          className="rounded-md border border-chaos-gold/40 px-3 py-1 text-xs font-semibold text-chaos-gold transition hover:bg-chaos-gold hover:text-chaos-black disabled:opacity-50"
        >
          {team1Name} wins
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => report(team2Id)}
          className="rounded-md border border-chaos-gold/40 px-3 py-1 text-xs font-semibold text-chaos-gold transition hover:bg-chaos-gold hover:text-chaos-black disabled:opacity-50"
        >
          {team2Name} wins
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}
