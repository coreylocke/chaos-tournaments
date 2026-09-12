"use client";

import { useActionState } from "react";
import { createTournament } from "@/lib/actions/admin";

const inputClass =
  "w-full rounded-md border border-chaos-white/20 bg-black/40 px-3 py-2 text-chaos-white placeholder:text-chaos-white/40 focus:border-chaos-gold focus:outline-none";
const labelClass = "mb-1 block text-sm font-semibold text-chaos-white/80";

export default function CreateTournamentForm() {
  const [state, formAction, pending] = useActionState(createTournament, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <label htmlFor="name" className={labelClass}>
          Tournament name
        </label>
        <input id="name" name="name" type="text" required maxLength={80} className={inputClass} />
      </div>

      <div>
        <label htmlFor="description" className={labelClass}>
          Description <span className="text-chaos-white/40">(optional)</span>
        </label>
        <textarea id="description" name="description" rows={3} className={inputClass} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="division" className={labelClass}>
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

        <div>
          <label htmlFor="format" className={labelClass}>
            Format
          </label>
          <select id="format" name="format" defaultValue="single_elimination" className={inputClass}>
            <option value="single_elimination">Single elimination</option>
            <option value="double_elimination">Double elimination</option>
            <option value="round_robin">Round robin</option>
            <option value="group_stage_to_elimination">Group stage to elimination</option>
          </select>
        </div>

        <div>
          <label htmlFor="required_starting_players" className={labelClass}>
            Required starters
          </label>
          <input
            id="required_starting_players"
            name="required_starting_players"
            type="number"
            min={1}
            max={10}
            defaultValue={5}
            required
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="entry_fee_per_starting_slot" className={labelClass}>
            Entry fee / starter slot ($)
          </label>
          <input
            id="entry_fee_per_starting_slot"
            name="entry_fee_per_starting_slot"
            type="number"
            min={0}
            step="0.01"
            defaultValue={0}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="first_place_prize" className={labelClass}>
            1st place prize ($)
          </label>
          <input id="first_place_prize" name="first_place_prize" type="number" min={0} step="0.01" className={inputClass} />
        </div>

        <div>
          <label htmlFor="second_place_prize" className={labelClass}>
            2nd place prize ($)
          </label>
          <input id="second_place_prize" name="second_place_prize" type="number" min={0} step="0.01" className={inputClass} />
        </div>

        <div>
          <label htmlFor="third_place_prize" className={labelClass}>
            3rd place prize ($)
          </label>
          <input id="third_place_prize" name="third_place_prize" type="number" min={0} step="0.01" className={inputClass} />
        </div>

        <div>
          <label htmlFor="starts_at" className={labelClass}>
            Start date <span className="text-chaos-white/40">(optional)</span>
          </label>
          <input id="starts_at" name="starts_at" type="datetime-local" className={inputClass} />
        </div>
      </div>

      <div>
        <label htmlFor="status" className={labelClass}>
          Status
        </label>
        <select id="status" name="status" defaultValue="draft" className={inputClass}>
          <option value="draft">Draft (hidden from registration)</option>
          <option value="open">Open (teams can register now)</option>
        </select>
      </div>

      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="touch-target rounded-md bg-chaos-gold px-8 py-3 text-base font-bold text-chaos-black transition hover:shadow-gold-glow disabled:opacity-60"
      >
        {pending ? "Creating…" : "Create tournament"}
      </button>
    </form>
  );
}
