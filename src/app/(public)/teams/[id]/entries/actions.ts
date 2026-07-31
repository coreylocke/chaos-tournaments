"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { createCheckoutSession } from "@/services/paymentService";
import { acceptRegistrationRules, checkInRegistration } from "@/services/registrationService";

export async function payEntriesAction(formData: FormData) {
  const teamId = String(formData.get("team_id") ?? "");
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/teams/${teamId}/entries`);

  const entrySlotIds = formData.getAll("entry_slot_ids").map(String);
  if (!entrySlotIds.length) {
    redirect(`/teams/${teamId}/entries?error=${encodeURIComponent("Select at least one entry to pay.")}`);
  }

  let checkoutUrl: string | null = null;
  try {
    const session = await createCheckoutSession({
      entrySlotIds,
      payerUserId: user!.user_id,
    });
    checkoutUrl = session.url;
  } catch (err) {
    redirect(
      `/teams/${teamId}/entries?error=${encodeURIComponent((err as Error).message)}`
    );
  }

  redirect(checkoutUrl!);
}

export async function acceptRulesAction(formData: FormData) {
  const teamId = String(formData.get("team_id") ?? "");
  const registrationId = String(formData.get("registration_id") ?? "");
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/teams/${teamId}/entries`);

  try {
    await acceptRegistrationRules({ registrationId, actingUserId: user!.user_id });
  } catch (err) {
    redirect(
      `/teams/${teamId}/entries?error=${encodeURIComponent((err as Error).message)}`
    );
  }

  redirect(`/teams/${teamId}/entries`);
}

export async function checkInAction(formData: FormData) {
  const teamId = String(formData.get("team_id") ?? "");
  const registrationId = String(formData.get("registration_id") ?? "");
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/teams/${teamId}/entries`);

  try {
    await checkInRegistration({ registrationId, actingUserId: user!.user_id });
  } catch (err) {
    redirect(
      `/teams/${teamId}/entries?error=${encodeURIComponent((err as Error).message)}`
    );
  }

  redirect(`/teams/${teamId}/entries`);
}
