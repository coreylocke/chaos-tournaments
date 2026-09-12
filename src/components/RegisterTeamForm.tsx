"use client";

import { useActionState } from "react";
import { registerTeamForTournament } from "@/lib/actions/tournaments";

type Team = { team_id: string; team_name: string };

export default function RegisterTeamForm({
  tournamentId,
  tournamentSlug,
  teams,
}: {
  tournamentId: string;
  tournamentSlug: string;
  teams: Team[];
}) {
  const [state, formAction, pending] = useActionState(registerTeamForTournament, undefined);

  if (teams.length === 0) {
    return (
      <p className="text-sm text-chaos-white/60">
        None of the teams you captain match this tournament&apos;s division.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="tournament_id" value={tournamentId} />
      <input type="hidden" name="tournament_slug" value={tournamentSlug} />

      <div>
        <label htmlFor="team_id" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-chaos-white/60">
          Register team
        </label>
        <select
          id="team_id"
          name="team_id"
          required
          defaultValue=""
          className="rounded-md border border-chaos-white/20 bg-black/40 px-3 py-2 text-sm text-chaos-white focus:border-chaos-gold focus:outline-none"
        >
          <option value="" disabled>
            Choose a team
          </option>
          {teams.map((team) => (
            <option key={team.team_id} value={team.team_id}>
              {team.team_name}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="touch-target rounded-md bg-chaos-gold px-6 py-2 text-sm font-bold text-chaos-black transition hover:shadow-gold-glow disabled:opacity-60"
      >
        {pending ? "Registering…" : "Register"}
      </button>
      <p className="w-full text-xs text-chaos-white/50">
        If your roster is full and there&apos;s an entry fee, you&apos;ll be redirected to Stripe to pay before this
        goes to review.
      </p>

      {state?.error && <p className="w-full text-sm text-red-400">{state.error}</p>}
    </form>
  );
}
