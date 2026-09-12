"use client";

import { useActionState } from "react";
import { createTeam } from "@/lib/actions/teams";

const inputClass =
  "w-full rounded-md border border-chaos-white/20 bg-black/40 px-3 py-2 text-chaos-white placeholder:text-chaos-white/40 focus:border-chaos-gold focus:outline-none";

export default function CreateTeamForm() {
  const [state, formAction, pending] = useActionState(createTeam, undefined);

  return (
    <form action={formAction} className="mx-auto flex max-w-md flex-col gap-4">
      <div>
        <label htmlFor="team_name" className="mb-1 block text-sm font-semibold text-chaos-white/80">
          Team name
        </label>
        <input id="team_name" name="team_name" type="text" required maxLength={64} className={inputClass} />
      </div>

      <div>
        <label htmlFor="division" className="mb-1 block text-sm font-semibold text-chaos-white/80">
          Division
        </label>
        <select id="division" name="division" required defaultValue="" className={inputClass}>
          <option value="" disabled>
            Choose a division
          </option>
          <option value="pc">PC</option>
          <option value="console">Console</option>
        </select>
      </div>

      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="touch-target rounded-md bg-chaos-gold px-8 py-3 text-base font-bold text-chaos-black transition hover:shadow-gold-glow disabled:opacity-60"
      >
        {pending ? "Creating…" : "Create team"}
      </button>
    </form>
  );
}
