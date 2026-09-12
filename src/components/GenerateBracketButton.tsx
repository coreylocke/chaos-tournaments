"use client";

import { useState, useTransition } from "react";
import { generateBracket } from "@/lib/actions/bracket";

export default function GenerateBracketButton({
  tournamentId,
  tournamentSlug,
}: {
  tournamentId: string;
  tournamentSlug: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            try {
              await generateBracket(tournamentId, tournamentSlug);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Failed to generate bracket.");
            }
          })
        }
        className="touch-target rounded-md bg-chaos-gold px-6 py-2 text-sm font-bold text-chaos-black transition hover:shadow-gold-glow disabled:opacity-60"
      >
        {pending ? "Generating…" : "Generate bracket"}
      </button>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}
