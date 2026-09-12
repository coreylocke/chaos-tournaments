/**
 * Fire-and-forget calls to the Discord bot's internal role-sync API (see bot/src/internalApi.ts).
 * Same "hands-off for owner" pattern as notifyDiscord() in src/lib/discord.ts — a failure here
 * should never break the user-facing action that triggered it, and it no-ops quietly if the
 * bot isn't configured (BOT_INTERNAL_URL unset), so the app works fine without the bot running.
 */
type RoleSyncEvent =
  | { event: "team_created"; teamId: string }
  | { event: "roster_member_added"; userId: string; rosterRole: string }
  | { event: "registration_approved"; teamId: string }
  | { event: "tournament_completed"; winnerTeamId: string; runnerUpTeamId: string | null };

export async function notifyBotRoleSync(payload: RoleSyncEvent): Promise<void> {
  const url = process.env.BOT_INTERNAL_URL;
  const secret = process.env.BOT_INTERNAL_SECRET;

  if (!url || !secret) {
    console.log("[bot] BOT_INTERNAL_URL/BOT_INTERNAL_SECRET not set, skipping role sync:", payload.event);
    return;
  }

  try {
    const res = await fetch(`${url}/internal/role-sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-bot-secret": secret },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error("[bot] role-sync request failed:", res.status, await res.text());
    }
  } catch (err) {
    console.error("[bot] role-sync request threw:", err);
  }
}
