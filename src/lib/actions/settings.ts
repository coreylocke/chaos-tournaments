"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/actions/teams";

/** Throws if the current session isn't an admin. */
async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not logged in.");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("is_admin")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!profile?.is_admin) throw new Error("Not an admin.");
}

export type PlatformSettings = {
  entry_fee_cents: number;
  platform_fee_percent: number;
  winner_share_percent: number;
};

/**
 * Reads the singleton platform_settings row. Public (readable by everyone via RLS) — used
 * to display the current entry fee on tournament pages.
 */
export async function getPlatformSettings(): Promise<PlatformSettings> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("platform_settings")
    .select("entry_fee_cents, platform_fee_percent, winner_share_percent")
    .eq("id", true)
    .single();

  return data ?? { entry_fee_cents: 500, platform_fee_percent: 20, winner_share_percent: 70 };
}

/**
 * Updates the global entry fee / prize-split settings. Admin-only. Takes effect immediately
 * for new registrations — doesn't retroactively change amounts already collected.
 */
export async function updatePlatformSettings(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await requireAdmin();
  } catch {
    return { error: "You don't have admin access." };
  }

  const entryFeeDollars = Number(formData.get("entry_fee_dollars") ?? 0);
  const platformFeePercent = Number(formData.get("platform_fee_percent") ?? 20);
  const winnerSharePercent = Number(formData.get("winner_share_percent") ?? 70);

  if (!Number.isFinite(entryFeeDollars) || entryFeeDollars < 0) {
    return { error: "Entry fee must be a non-negative number." };
  }
  if (!Number.isFinite(platformFeePercent) || platformFeePercent < 0 || platformFeePercent > 100) {
    return { error: "Platform fee % must be between 0 and 100." };
  }
  if (!Number.isFinite(winnerSharePercent) || winnerSharePercent < 0 || winnerSharePercent > 100) {
    return { error: "Winner share % must be between 0 and 100." };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("platform_settings")
    .update({
      entry_fee_cents: Math.round(entryFeeDollars * 100),
      platform_fee_percent: platformFeePercent,
      winner_share_percent: winnerSharePercent,
    })
    .eq("id", true);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/settings");
  revalidatePath("/tournaments");
  return undefined;
}
