"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { respondToInvitation } from "@/services/teamInvitationService";

export async function respondToInvitationAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/dashboard");

  const invitationId = String(formData.get("invitation_id") ?? "");
  const accept = formData.get("accept") === "true";

  await respondToInvitation({
    invitationId,
    respondingUserId: user!.user_id,
    accept,
  });

  redirect("/dashboard");
}
