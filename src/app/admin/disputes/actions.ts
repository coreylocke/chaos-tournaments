"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { resolveDispute } from "@/services/matchAdvancementService";
import type { ResolveDisputeInput } from "@/services/matchAdvancementService";

export async function resolveDisputeAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user?.is_admin) redirect("/");

  const disputeId = String(formData.get("dispute_id") ?? "");
  const resolution = String(formData.get("resolution") ?? "") as ResolveDisputeInput["resolution"];
  const resolutionNotes = String(formData.get("resolution_notes") ?? "");
  const disqualifiedTeamId = String(formData.get("disqualified_team_id") ?? "");
  const adminWinnerTeamId = String(formData.get("admin_winner_team_id") ?? "");
  const adminSeriesScore = String(formData.get("admin_series_score") ?? "");

  try {
    await resolveDispute({
      disputeId,
      resolution,
      resolutionNotes: resolutionNotes || undefined,
      adminUserId: user!.user_id,
      disqualifiedTeamId: disqualifiedTeamId || undefined,
      adminWinnerTeamId: adminWinnerTeamId || undefined,
      adminSeriesScore: adminSeriesScore || undefined,
    });
  } catch (err) {
    redirect(`/admin/disputes?error=${encodeURIComponent((err as Error).message)}`);
  }

  redirect("/admin/disputes");
}
