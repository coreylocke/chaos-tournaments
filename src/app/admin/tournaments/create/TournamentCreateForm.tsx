"use client";

import { TOURNAMENT_DIVISIONS } from "@/lib/rules/platformRules";
import { createTournamentAction } from "./actions";

export function TournamentCreateForm() {
  return (
    <form
      action={createTournamentAction}
      className="flex w-full max-w-sm flex-col gap-4"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm font-medium">
          Tournament name
        </label>
        <input
          id="name"
          name="name"
          required
          className="h-12 rounded-lg border border-zinc-300 px-4 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="division" className="text-sm font-medium">
          Division
        </label>
        <select
          id="division"
          name="division"
          required
          className="h-12 rounded-lg border border-zinc-300 px-4 dark:border-zinc-700 dark:bg-zinc-900"
        >
          {TOURNAMENT_DIVISIONS.map((division) => (
            <option key={division} value={division}>
              {division}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="entry_fee_dollars" className="text-sm font-medium">
          Entry fee per starting slot (USD)
        </label>
        <input
          id="entry_fee_dollars"
          name="entry_fee_dollars"
          type="number"
          min="0"
          step="0.01"
          required
          className="h-12 rounded-lg border border-zinc-300 px-4 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>

      <div className="flex gap-4">
        <div className="flex flex-1 flex-col gap-1">
          <label
            htmlFor="required_starting_players"
            className="text-sm font-medium"
          >
            Starters
          </label>
          <input
            id="required_starting_players"
            name="required_starting_players"
            type="number"
            min="1"
            defaultValue={5}
            className="h-12 rounded-lg border border-zinc-300 px-4 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <label
            htmlFor="maximum_substitutes"
            className="text-sm font-medium"
          >
            Max subs
          </label>
          <input
            id="maximum_substitutes"
            name="maximum_substitutes"
            type="number"
            min="0"
            defaultValue={2}
            className="h-12 rounded-lg border border-zinc-300 px-4 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor="maximum_reserves" className="text-sm font-medium">
            Max reserves
          </label>
          <input
            id="maximum_reserves"
            name="maximum_reserves"
            type="number"
            min="0"
            defaultValue={2}
            className="h-12 rounded-lg border border-zinc-300 px-4 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
      </div>

      <button
        type="submit"
        className="h-12 rounded-full bg-foreground px-5 font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
      >
        Create tournament
      </button>
    </form>
  );
}
