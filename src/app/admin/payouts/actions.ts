"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { approvePayout, markPayoutPaid } from "@/services/payoutService";

export async function approvePayoutAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user?.is_admin) redirect("/");

  const payoutId = String(formData.get("payout_id") ?? "");

  try {
    await approvePayout(payoutId, user!.user_id);
  } catch (err) {
    redirect(`/admin/payouts?error=${encodeURIComponent((err as Error).message)}`);
  }

  redirect("/admin/payouts");
}

export async function markPayoutPaidAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user?.is_admin) redirect("/");

  const payoutId = String(formData.get("payout_id") ?? "");

  try {
    await markPayoutPaid(payoutId);
  } catch (err) {
    redirect(`/admin/payouts?error=${encodeURIComponent((err as Error).message)}`);
  }

  redirect("/admin/payouts");
}
