import "server-only";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { Platform } from "@/lib/rules/platformRules";

type ServiceClient = ReturnType<typeof createServiceRoleClient>;

const DISCORD_API_BASE = "https://discord.com/api/v10";

const PLATFORM_ROLE_ENV: Record<Platform, string | undefined> = {
  PC: process.env.DISCORD_ROLE_PC,
  PS5: process.env.DISCORD_ROLE_PS5,
  Xbox: process.env.DISCORD_ROLE_XBOX,
  PS4: process.env.DISCORD_ROLE_PS4,
};

// CLAUDE.md Section 1/18: role assignment goes through this dedicated
// service (reads/writes only via the app's own service layer), not through
// n8n — n8n is downstream *notifications* only. Best-effort throughout: a
// user with no linked Discord account, or any Discord API failure, must
// never break the calling transaction.
async function discordRequest(path: string, method: "PUT" | "DELETE") {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) return;
  try {
    await fetch(`${DISCORD_API_BASE}${path}`, {
      method,
      headers: { Authorization: `Bot ${token}` },
    });
  } catch (err) {
    console.error("Discord API request failed:", method, path, err);
  }
}

async function assignRole(discordUserId: string, roleId: string | undefined) {
  const guildId = process.env.DISCORD_GUILD_ID;
  if (!roleId || !guildId) return;
  await discordRequest(`/guilds/${guildId}/members/${discordUserId}/roles/${roleId}`, "PUT");
}

async function getDiscordUserId(userId: string, supabase: ServiceClient) {
  const { data } = await supabase
    .from("discord_accounts")
    .select("discord_user_id")
    .eq("user_id", userId)
    .maybeSingle();
  return data?.discord_user_id ?? null;
}

async function getDiscordUserIdsForTeam(teamId: string, supabase: ServiceClient) {
  const { data: members } = await supabase
    .from("team_members")
    .select("user_id")
    .eq("team_id", teamId)
    .eq("is_active", true);
  const userIds = (members ?? []).map((m) => m.user_id);
  if (!userIds.length) return [];

  const { data: accounts } = await supabase
    .from("discord_accounts")
    .select("discord_user_id")
    .in("user_id", userIds);
  return (accounts ?? []).map((a) => a.discord_user_id);
}

export async function getDiscordUserIdForUser(userId: string) {
  return getDiscordUserId(userId, createServiceRoleClient());
}

export async function assignPlatformRole(userId: string, platform: Platform) {
  const supabase = createServiceRoleClient();
  const discordUserId = await getDiscordUserId(userId, supabase);
  if (!discordUserId) return;
  await assignRole(discordUserId, PLATFORM_ROLE_ENV[platform]);
}

export async function assignTeamCaptainRole(userId: string) {
  const supabase = createServiceRoleClient();
  const discordUserId = await getDiscordUserId(userId, supabase);
  if (!discordUserId) return;
  await assignRole(discordUserId, process.env.DISCORD_ROLE_TEAM_CAPTAIN);
}

export async function assignCheckedInRoleToTeam(teamId: string) {
  const supabase = createServiceRoleClient();
  const discordUserIds = await getDiscordUserIdsForTeam(teamId, supabase);
  await Promise.all(
    discordUserIds.map((id) => assignRole(id, process.env.DISCORD_ROLE_CHECKED_IN))
  );
}

export async function assignTournamentWinnerRoleToTeam(teamId: string) {
  const supabase = createServiceRoleClient();
  const discordUserIds = await getDiscordUserIdsForTeam(teamId, supabase);
  await Promise.all(
    discordUserIds.map((id) => assignRole(id, process.env.DISCORD_ROLE_TOURNAMENT_WINNER))
  );
}

export async function assignTournamentRunnerUpRoleToTeam(teamId: string) {
  const supabase = createServiceRoleClient();
  const discordUserIds = await getDiscordUserIdsForTeam(teamId, supabase);
  await Promise.all(
    discordUserIds.map((id) => assignRole(id, process.env.DISCORD_ROLE_TOURNAMENT_RUNNER_UP))
  );
}
