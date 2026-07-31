"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { registerTeamForTournament } from "@/services/registrationService";

export async function registerForTournamentAction(formData: FormData) {
  const teamId = String(formData.get("team_id") ?? "");
  const tournamentId = String(formData.get("tournament_id") ?? "");

  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/teams/${teamId}/register`);

  try {
    await registerTeamForTournament({
      tournamentId,
      teamId,
      actingUserId: user!.user_id,
    });
  } catch (err) {
    redirect(
      `/teams/${teamId}/register?error=${encodeURIComponent((err as Error).message)}`
    );
  }

  redirect(`/teams/${teamId}/entries`);
}
