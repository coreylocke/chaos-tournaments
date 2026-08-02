"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { linkQualification } from "@/services/qualificationService";

export async function linkQualificationAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user?.is_admin) redirect("/");

  const sourceBracketId = String(formData.get("source_bracket_id") ?? "");
  const [destinationBracketId, destinationMatchId, destinationSlotRaw] = String(
    formData.get("destination_match") ?? ""
  ).split("|");
  const destinationSlot = Number(destinationSlotRaw) as 1 | 2;
  const qualificationRule = String(formData.get("qualification_rule") ?? "bracket_winner") as
    | "bracket_winner"
    | "bracket_runner_up";

  try {
    await linkQualification({
      sourceBracketId,
      destinationBracketId,
      destinationMatchId,
      destinationSlot,
      qualificationRule,
    });
  } catch (err) {
    redirect(`/admin/qualifications?error=${encodeURIComponent((err as Error).message)}`);
  }

  redirect("/admin/qualifications");
}
