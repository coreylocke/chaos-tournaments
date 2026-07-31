"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { createTeam } from "@/services/teamService";
import type { Platform } from "@/lib/rules/platformRules";
import { PLATFORMS } from "@/lib/rules/platformRules";

export async function createTeamAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/teams/create");
  }

  const teamName = String(formData.get("team_name") ?? "").trim();
  const platform = String(formData.get("platform") ?? "") as Platform;
  const gameUsername = String(formData.get("game_username") ?? "").trim();

  if (!teamName) {
    redirect("/teams/create?error=missing_team_name");
  }
  if (!PLATFORMS.includes(platform)) {
    redirect("/teams/create?error=invalid_platform");
  }

  const team = await createTeam({
    teamName,
    captainUserId: user.user_id,
    captainPlatform: platform,
    captainGameUsername: gameUsername || undefined,
  });

  redirect(`/teams/${team.team_id}`);
}
