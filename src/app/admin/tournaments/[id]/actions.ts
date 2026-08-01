"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { generateBracket } from "@/services/bracketService";
import { finalizeMatch, forfeitMatch } from "@/services/matchAdvancementService";

export async function generateBracketAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user?.is_admin) redirect("/");

  const tournamentId = String(formData.get("tournament_id") ?? "");

  try {
    await generateBracket(tournamentId);
  } catch (err) {
    redirect(
      `/admin/tournaments/${tournamentId}?error=${encodeURIComponent((err as Error).message)}`
    );
  }

  redirect(`/admin/tournaments/${tournamentId}`);
}

export async function finalizeMatchAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user?.is_admin) redirect("/");

  const tournamentId = String(formData.get("tournament_id") ?? "");
  const matchId = String(formData.get("match_id") ?? "");
  const winnerTeamId = String(formData.get("winner_team_id") ?? "");
  const seriesScore = String(formData.get("series_score") ?? "");

  try {
    await finalizeMatch({
      matchId,
      winnerTeamId,
      seriesScore,
      actingAdminUserId: user!.user_id,
    });
  } catch (err) {
    redirect(
      `/admin/tournaments/${tournamentId}?error=${encodeURIComponent((err as Error).message)}`
    );
  }

  redirect(`/admin/tournaments/${tournamentId}`);
}

export async function forfeitMatchAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user?.is_admin) redirect("/");

  const tournamentId = String(formData.get("tournament_id") ?? "");
  const matchId = String(formData.get("match_id") ?? "");
  const forfeitingTeamId = String(formData.get("forfeiting_team_id") ?? "");
  const doubleForfeit = forfeitingTeamId === "__double__";

  try {
    await forfeitMatch({
      matchId,
      adminUserId: user!.user_id,
      forfeitingTeamId: doubleForfeit ? undefined : forfeitingTeamId,
      doubleForfeit,
    });
  } catch (err) {
    redirect(
      `/admin/tournaments/${tournamentId}?error=${encodeURIComponent((err as Error).message)}`
    );
  }

  redirect(`/admin/tournaments/${tournamentId}`);
}
