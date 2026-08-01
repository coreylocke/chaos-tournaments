"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { submitResult, confirmResult, disputeResult } from "@/services/matchAdvancementService";
import { uploadMatchEvidence } from "@/services/evidenceService";

function matchUrl(teamId: string, matchId: string) {
  return `/teams/${teamId}/matches/${matchId}`;
}

export async function submitResultAction(formData: FormData) {
  const teamId = String(formData.get("team_id") ?? "");
  const matchId = String(formData.get("match_id") ?? "");
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${matchUrl(teamId, matchId)}`);

  const winnerTeamId = String(formData.get("winner_team_id") ?? "");
  const seriesScore = String(formData.get("series_score") ?? "");
  const evidenceFile = formData.get("evidence") as File | null;

  try {
    let evidenceUrl: string | undefined;
    if (evidenceFile && evidenceFile.size > 0) {
      evidenceUrl = await uploadMatchEvidence(matchId, evidenceFile);
    }
    await submitResult({
      matchId,
      submittedByUserId: user!.user_id,
      winnerTeamId,
      seriesScore,
      evidenceUrl,
    });
  } catch (err) {
    redirect(`${matchUrl(teamId, matchId)}?error=${encodeURIComponent((err as Error).message)}`);
  }

  redirect(matchUrl(teamId, matchId));
}

export async function confirmResultAction(formData: FormData) {
  const teamId = String(formData.get("team_id") ?? "");
  const matchId = String(formData.get("match_id") ?? "");
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${matchUrl(teamId, matchId)}`);

  try {
    await confirmResult({ matchId, confirmingUserId: user!.user_id });
  } catch (err) {
    redirect(`${matchUrl(teamId, matchId)}?error=${encodeURIComponent((err as Error).message)}`);
  }

  redirect(matchUrl(teamId, matchId));
}

export async function disputeResultAction(formData: FormData) {
  const teamId = String(formData.get("team_id") ?? "");
  const matchId = String(formData.get("match_id") ?? "");
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${matchUrl(teamId, matchId)}`);

  const reason = String(formData.get("reason") ?? "");
  const description = String(formData.get("description") ?? "");

  try {
    await disputeResult({
      matchId,
      submittedByUserId: user!.user_id,
      reason,
      description: description || undefined,
    });
  } catch (err) {
    redirect(`${matchUrl(teamId, matchId)}?error=${encodeURIComponent((err as Error).message)}`);
  }

  redirect(matchUrl(teamId, matchId));
}
