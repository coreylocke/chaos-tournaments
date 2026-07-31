// Centralizes the platform/division rule from CLAUDE.md Section 0, so it's
// never hard-coded inline: in tournament play, PC is isolated and PS5/Xbox/PS4
// cross-play as one "Console" division. Grudge matches have no such
// restriction (not modeled here — this file only covers tournament division).

export const PLATFORMS = ["PC", "PS5", "Xbox", "PS4"] as const;
export type Platform = (typeof PLATFORMS)[number];

export const TOURNAMENT_DIVISIONS = ["PC", "Console"] as const;
export type TournamentDivision = (typeof TOURNAMENT_DIVISIONS)[number];

export function platformToTournamentDivision(
  platform: Platform
): TournamentDivision {
  return platform === "PC" ? "PC" : "Console";
}

export function isPlatformValidForDivision(
  platform: Platform,
  division: TournamentDivision
): boolean {
  return platformToTournamentDivision(platform) === division;
}

// Every starter/sub/reserve must match the tournament's division; coaches
// and managers don't compete, so they're exempt (Authentication and Roles
// page, Section 5 of the master brief).
export const ROSTER_ROLES_REQUIRING_PLATFORM_VALIDATION = [
  "starter",
  "substitute",
  "reserve",
] as const;
