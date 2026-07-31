"use client";

import { PLATFORMS } from "@/lib/rules/platformRules";
import { inviteMemberAction } from "./actions";

const ROSTER_ROLES = ["starter", "substitute", "reserve", "coach", "manager"] as const;

export function InviteForm({ teamId }: { teamId: string }) {
  return (
    <form action={inviteMemberAction} className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <input type="hidden" name="team_id" value={teamId} />

      <div className="flex flex-col gap-1">
        <label htmlFor="discord_username" className="text-sm font-medium">
          Discord username
        </label>
        <input
          id="discord_username"
          name="discord_username"
          required
          placeholder="e.g. chaos079133"
          className="h-11 rounded-lg border border-zinc-300 px-3 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <p className="text-xs text-zinc-500">
          They need to have logged in at least once before you can invite them.
        </p>
      </div>

      <div className="flex gap-3">
        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor="roster_role" className="text-sm font-medium">
            Role
          </label>
          <select
            id="roster_role"
            name="roster_role"
            required
            className="h-11 rounded-lg border border-zinc-300 px-3 dark:border-zinc-700 dark:bg-zinc-900"
          >
            {ROSTER_ROLES.map((role) => (
              <option key={role} value={role} className="capitalize">
                {role}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor="platform" className="text-sm font-medium">
            Platform
          </label>
          <select
            id="platform"
            name="platform"
            required
            className="h-11 rounded-lg border border-zinc-300 px-3 dark:border-zinc-700 dark:bg-zinc-900"
          >
            {PLATFORMS.map((platform) => (
              <option key={platform} value={platform}>
                {platform}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="submit"
        className="h-11 rounded-full bg-foreground px-4 text-sm font-medium text-background"
      >
        Send invite
      </button>
    </form>
  );
}
