"use client";

import { PLATFORMS } from "@/lib/rules/platformRules";
import { createTeamAction } from "./actions";

export function TeamCreateForm() {
  return (
    <form action={createTeamAction} className="flex w-full max-w-sm flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="team_name" className="text-sm font-medium">
          Team name
        </label>
        <input
          id="team_name"
          name="team_name"
          required
          className="h-12 rounded-lg border border-zinc-300 px-4 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="platform" className="text-sm font-medium">
          Your platform
        </label>
        <select
          id="platform"
          name="platform"
          required
          className="h-12 rounded-lg border border-zinc-300 px-4 dark:border-zinc-700 dark:bg-zinc-900"
        >
          {PLATFORMS.map((platform) => (
            <option key={platform} value={platform}>
              {platform}
            </option>
          ))}
        </select>
        <p className="text-xs text-zinc-500">
          PC teams play in the PC division. PS5/Xbox/PS4 all play together in
          the Console division.
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="game_username" className="text-sm font-medium">
          In-game username (optional)
        </label>
        <input
          id="game_username"
          name="game_username"
          className="h-12 rounded-lg border border-zinc-300 px-4 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>

      <button
        type="submit"
        className="h-12 rounded-full bg-foreground px-5 font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
      >
        Create team
      </button>
    </form>
  );
}
