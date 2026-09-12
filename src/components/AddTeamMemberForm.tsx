"use client";

import { useActionState } from "react";
import { addTeamMember } from "@/lib/actions/teams";

const inputClass =
  "w-full rounded-md border border-chaos-white/20 bg-black/40 px-3 py-2 text-sm text-chaos-white placeholder:text-chaos-white/40 focus:border-chaos-gold focus:outline-none";

export default function AddTeamMemberForm({ teamId, teamSlug }: { teamId: string; teamSlug: string }) {
  const [state, formAction, pending] = useActionState(addTeamMember, undefined);

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-2">
      <input type="hidden" name="team_id" value={teamId} />
      <input type="hidden" name="team_slug" value={teamSlug} />

      <div>
        <label htmlFor="discord_username" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-chaos-white/60">
          Discord username
        </label>
        <input
          id="discord_username"
          name="discord_username"
          type="text"
          required
          placeholder="e.g. chaos079133"
          className={inputClass}
        />
        <p className="mt-1 text-xs text-chaos-white/40">
          Discord username or display name — they must have logged in with Discord at least once.
        </p>
      </div>

      <div>
        <label htmlFor="roster_role" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-chaos-white/60">
          Roster role
        </label>
        <select id="roster_role" name="roster_role" required defaultValue="" className={inputClass}>
          <option value="" disabled>
            Choose a role
          </option>
          <option value="starter">Starter</option>
          <option value="substitute">Substitute</option>
          <option value="reserve">Reserve</option>
          <option value="coach">Coach</option>
          <option value="manager">Manager</option>
        </select>
      </div>

      <div>
        <label htmlFor="platform" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-chaos-white/60">
          Platform
        </label>
        <select id="platform" name="platform" required defaultValue="" className={inputClass}>
          <option value="" disabled>
            Choose a platform
          </option>
          <option value="pc">PC</option>
          <option value="ps5">PS5</option>
          <option value="xbox">Xbox</option>
        </select>
      </div>

      <div>
        <label htmlFor="game_username" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-chaos-white/60">
          In-game username <span className="text-chaos-white/30">(optional)</span>
        </label>
        <input id="game_username" name="game_username" type="text" className={inputClass} />
      </div>

      {state?.error && <p className="sm:col-span-2 text-sm text-red-400">{state.error}</p>}

      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md border border-chaos-gold px-6 py-2 text-sm font-bold text-chaos-gold transition hover:bg-chaos-gold hover:text-chaos-black disabled:opacity-60"
        >
          {pending ? "Adding…" : "Add to roster"}
        </button>
      </div>
    </form>
  );
}
