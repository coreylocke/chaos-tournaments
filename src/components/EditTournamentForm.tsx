"use client";

import { useActionState } from "react";
import { updateTournament } from "@/lib/actions/admin";

const inputClass =
  "w-full rounded-md border border-chaos-white/20 bg-black/40 px-3 py-2 text-chaos-white placeholder:text-chaos-white/40 focus:border-chaos-gold focus:outline-none";
const labelClass = "mb-1 block text-sm font-semibold text-chaos-white/80";

type Tournament = {
  tournament_id: string;
  slug: string;
  description: string | null;
  required_starting_players: number;
  entry_fee_per_starting_slot: number;
  first_place_prize: number | null;
  second_place_prize: number | null;
  third_place_prize: number | null;
  starts_at: string | null;
  status: string;
};

function toLocalInputValue(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EditTournamentForm({ tournament }: { tournament: Tournament }) {
  const [state, formAction, pending] = useActionState(updateTournament, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-lg border border-chaos-white/10 bg-chaos-charcoal p-5">
      <input type="hidden" name="tournament_id" value={tournament.tournament_id} />
      <input type="hidden" name="tournament_slug" value={tournament.slug} />

      <div>
        <label htmlFor="status" className={labelClass}>
          Status
        </label>
        <select id="status" name="status" defaultValue={tournament.status} className={inputClass}>
          <option value="draft">Draft (hidden from registration)</option>
          <option value="open">Open (teams can register)</option>
          <option value="closed">Closed (registration ended)</option>
          <option value="in_progress">In progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div>
        <label htmlFor="description" className={labelClass}>
          Description
        </label>
        <textarea id="description" name="description" rows={3} defaultValue={tournament.description ?? ""} className={inputClass} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
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
            defaultValue={tournament.required_starting_players}
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
            defaultValue={tournament.entry_fee_per_starting_slot}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="first_place_prize" className={labelClass}>
            1st place prize ($)
          </label>
          <input
            id="first_place_prize"
            name="first_place_prize"
            type="number"
            min={0}
            step="0.01"
            defaultValue={tournament.first_place_prize ?? ""}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="second_place_prize" className={labelClass}>
            2nd place prize ($)
          </label>
          <input
            id="second_place_prize"
            name="second_place_prize"
            type="number"
            min={0}
            step="0.01"
            defaultValue={tournament.second_place_prize ?? ""}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="third_place_prize" className={labelClass}>
            3rd place prize ($)
          </label>
          <input
            id="third_place_prize"
            name="third_place_prize"
            type="number"
            min={0}
            step="0.01"
            defaultValue={tournament.third_place_prize ?? ""}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="starts_at" className={labelClass}>
            Start date
          </label>
          <input
            id="starts_at"
            name="starts_at"
            type="datetime-local"
            defaultValue={toLocalInputValue(tournament.starts_at)}
            className={inputClass}
          />
        </div>
      </div>

      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="touch-target self-start rounded-md bg-chaos-gold px-8 py-3 text-base font-bold text-chaos-black transition hover:shadow-gold-glow disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
