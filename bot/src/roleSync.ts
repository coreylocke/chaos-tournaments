import type { Guild } from "discord.js";
import { supabase } from "./supabase.js";
import { assignRole } from "./roles.js";

/** Looks up a user's Discord ID from their Supabase user_id. Null if not found or unset. */
async function getDiscordId(userId: string): Promise<string | null> {
  const { data } = await supabase.from("user_profiles").select("discord_user_id").eq("user_id", userId).maybeSingle();
  return data?.discord_user_id ?? null;
}

/** Every user_id associated with a team: the captain plus all active roster members. */
async function getTeamUserIds(teamId: string): Promise<string[]> {
  const [{ data: team }, { data: members }] = await Promise.all([
    supabase.from("teams").select("captain_user_id").eq("team_id", teamId).maybeSingle(),
    supabase.from("team_members").select("user_id").eq("team_id", teamId).eq("is_active", true),
  ]);

  const ids = new Set<string>();
  if (team?.captain_user_id) ids.add(team.captain_user_id);
  for (const m of members ?? []) ids.add(m.user_id);
  return [...ids];
}

export async function handleTeamCreated(guild: Guild, teamId: string) {
  const { data: team } = await supabase.from("teams").select("captain_user_id").eq("team_id", teamId).maybeSingle();
  if (!team) return;
  const discordId = await getDiscordId(team.captain_user_id);
  if (discordId) await assignRole(guild, discordId, "teamCaptain");
}

export async function handleRosterMemberAdded(guild: Guild, userId: string, rosterRole: string) {
  if (rosterRole !== "starter") return;
  const discordId = await getDiscordId(userId);
  if (discordId) await assignRole(guild, discordId, "starter");
}

export async function handleRegistrationApproved(guild: Guild, teamId: string) {
  const userIds = await getTeamUserIds(teamId);
  await Promise.all(
    userIds.map(async (userId) => {
      const discordId = await getDiscordId(userId);
      if (discordId) await assignRole(guild, discordId, "registered");
    })
  );
}

export async function handleTournamentCompleted(guild: Guild, winnerTeamId: string, runnerUpTeamId: string | null) {
  const winnerUserIds = await getTeamUserIds(winnerTeamId);
  await Promise.all(
    winnerUserIds.map(async (userId) => {
      const discordId = await getDiscordId(userId);
      if (discordId) await assignRole(guild, discordId, "tournamentWinner");
    })
  );

  if (runnerUpTeamId) {
    const runnerUpUserIds = await getTeamUserIds(runnerUpTeamId);
    await Promise.all(
      runnerUpUserIds.map(async (userId) => {
        const discordId = await getDiscordId(userId);
        if (discordId) await assignRole(guild, discordId, "tournamentRunnerUp");
      })
    );
  }
}
