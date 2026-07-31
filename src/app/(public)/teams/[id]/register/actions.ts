"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { registerTeamForTournament } from "@/services/registrationService";

export async function registerForTournamentAction(formData: FormData) {
  const teamId = String(formData.get("team_id") ?? "");
  const tournamentId = String(formData.get("tournament_id") ?? "");
  const returnTo = String(formData.get("return_to") ?? `/teams/${teamId}/register`);

  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(returnTo)}`);

  try {
    await registerTeamForTournament({
      tournamentId,
      teamId,
      actingUserId: user!.user_id,
    });
  } catch (err) {
    redirect(
      `${returnTo}?error=${encodeURIComponent((err as Error).message)}`
    );
  }

  redirect(
    `/registration/success?team_id=${teamId}&tournament_id=${tournamentId}`
  );
}
