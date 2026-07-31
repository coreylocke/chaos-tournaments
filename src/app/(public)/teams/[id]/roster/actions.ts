"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { createInvitation } from "@/services/teamInvitationService";
import { updateTeamMember } from "@/services/teamService";
import { PLATFORMS } from "@/lib/rules/platformRules";
import type { Platform } from "@/lib/rules/platformRules";

const ROSTER_ROLES = [
  "starter",
  "substitute",
  "reserve",
  "coach",
  "manager",
] as const;

export async function inviteMemberAction(formData: FormData) {
  const user = await getCurrentUser();
  const teamId = String(formData.get("team_id") ?? "");
  if (!user) redirect(`/login?next=/teams/${teamId}/roster`);

  const discordUsername = String(formData.get("discord_username") ?? "").trim();
  const rosterRole = String(formData.get("roster_role") ?? "") as (typeof ROSTER_ROLES)[number];
  const platform = String(formData.get("platform") ?? "") as Platform;

  if (!discordUsername || !ROSTER_ROLES.includes(rosterRole) || !PLATFORMS.includes(platform)) {
    redirect(`/teams/${teamId}/roster?error=invalid_input`);
  }

  try {
    await createInvitation({
      teamId,
      invitedByUserId: user!.user_id,
      invitedDiscordUsername: discordUsername,
      rosterRole,
      platform,
    });
  } catch (err) {
    redirect(
      `/teams/${teamId}/roster?error=${encodeURIComponent((err as Error).message)}`
    );
  }

  redirect(`/teams/${teamId}/roster`);
}

export async function updateMemberAction(formData: FormData) {
  const user = await getCurrentUser();
  const teamId = String(formData.get("team_id") ?? "");
  if (!user) redirect(`/login?next=/teams/${teamId}/roster`);

  const teamMemberId = String(formData.get("team_member_id") ?? "");
  const rosterRole = formData.get("roster_role")
    ? (String(formData.get("roster_role")) as (typeof ROSTER_ROLES)[number])
    : undefined;
  const remove = formData.get("remove") === "true";

  try {
    await updateTeamMember({
      teamMemberId,
      actingUserId: user!.user_id,
      rosterRole,
      isActive: remove ? false : undefined,
    });
  } catch (err) {
    redirect(
      `/teams/${teamId}/roster?error=${encodeURIComponent((err as Error).message)}`
    );
  }

  redirect(`/teams/${teamId}/roster`);
}
