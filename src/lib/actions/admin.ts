"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { notifyDiscord } from "@/lib/discord";
import { notifyBotRoleSync } from "@/lib/bot";
import type { ActionState } from "@/lib/actions/teams";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Throws if the current session isn't an admin. Returns the user for convenience. */
async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not logged in.");
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("is_admin")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile?.is_admin) {
    throw new Error("Not an admin.");
  }

  return user;
}

/** Non-throwing admin check for gating page renders. */
export async function isCurrentUserAdmin(): Promise<boolean> {
  try {
    await requireAdmin();
    return true;
  } catch {
    return false;
  }
}

/**
 * Creates a tournament. Admin-only — checked here in application code (not RLS) since
 * there's no admin RLS policy on `tournaments` yet; the actual insert uses the service-role
 * client to bypass RLS once the is_admin check passes.
 */
export async function createTournament(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await requireAdmin();
  } catch {
    return { error: "You don't have admin access." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const division = String(formData.get("division") ?? "");
  const format = String(formData.get("format") ?? "single_elimination");
  const description = String(formData.get("description") ?? "").trim() || null;
  const requiredStartingPlayers = Number(formData.get("required_starting_players") ?? 5);
  const entryFee = Number(formData.get("entry_fee_per_starting_slot") ?? 0);
  const firstPlacePrize = formData.get("first_place_prize") ? Number(formData.get("first_place_prize")) : null;
  const secondPlacePrize = formData.get("second_place_prize") ? Number(formData.get("second_place_prize")) : null;
  const thirdPlacePrize = formData.get("third_place_prize") ? Number(formData.get("third_place_prize")) : null;
  const startsAt = formData.get("starts_at") ? new Date(String(formData.get("starts_at"))).toISOString() : null;
  const status = String(formData.get("status") ?? "draft");

  if (!name) {
    return { error: "Tournament name is required." };
  }
  if (division !== "pc" && division !== "console") {
    return { error: "Choose a division." };
  }
  if (!Number.isFinite(requiredStartingPlayers) || requiredStartingPlayers < 1) {
    return { error: "Required starting players must be a positive number." };
  }
  if (!["draft", "open"].includes(status)) {
    return { error: "Invalid status." };
  }

  const admin = createAdminClient();
  const baseSlug = slugify(name);
  if (!baseSlug) {
    return { error: "Tournament name must contain at least one letter or number." };
  }

  let slug = baseSlug;
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: existing } = await admin.from("tournaments").select("tournament_id").eq("slug", slug).maybeSingle();
    if (!existing) break;
    slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;
  }

  const { error, data: created } = await admin
    .from("tournaments")
    .insert({
      name,
      slug,
      description,
      division,
      format,
      required_starting_players: requiredStartingPlayers,
      entry_fee_per_starting_slot: entryFee,
      first_place_prize: firstPlacePrize,
      second_place_prize: secondPlacePrize,
      third_place_prize: thirdPlacePrize,
      starts_at: startsAt,
      status,
    })
    .select("name, slug")
    .single();

  if (error) {
    return { error: error.message };
  }

  await notifyDiscord(
    `**New tournament created:** ${created.name}\n${division.toUpperCase()} · ${format.replace(/_/g, " ")}${
      status === "open" ? " · registration is open" : " (draft, not yet open)"
    }\nhttps://chaostournaments.com/tournaments/${created.slug}`
  );

  redirect(`/tournaments/${slug}`);
}

const TOURNAMENT_STATUSES = ["draft", "open", "closed", "in_progress", "completed", "cancelled"];

/**
 * Updates an existing tournament's editable fields (not name/slug — those stay stable so
 * existing links don't break). Admin-only, same pattern as createTournament.
 */
export async function updateTournament(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await requireAdmin();
  } catch {
    return { error: "You don't have admin access." };
  }

  const tournamentId = String(formData.get("tournament_id") ?? "");
  const tournamentSlug = String(formData.get("tournament_slug") ?? "");
  const description = String(formData.get("description") ?? "").trim() || null;
  const requiredStartingPlayers = Number(formData.get("required_starting_players") ?? 5);
  const entryFee = Number(formData.get("entry_fee_per_starting_slot") ?? 0);
  const firstPlacePrize = formData.get("first_place_prize") ? Number(formData.get("first_place_prize")) : null;
  const secondPlacePrize = formData.get("second_place_prize") ? Number(formData.get("second_place_prize")) : null;
  const thirdPlacePrize = formData.get("third_place_prize") ? Number(formData.get("third_place_prize")) : null;
  const startsAt = formData.get("starts_at") ? new Date(String(formData.get("starts_at"))).toISOString() : null;
  const status = String(formData.get("status") ?? "draft");

  if (!tournamentId) {
    return { error: "Missing tournament." };
  }
  if (!Number.isFinite(requiredStartingPlayers) || requiredStartingPlayers < 1) {
    return { error: "Required starting players must be a positive number." };
  }
  if (!TOURNAMENT_STATUSES.includes(status)) {
    return { error: "Invalid status." };
  }

  const admin = createAdminClient();
  const { data: previous } = await admin
    .from("tournaments")
    .select("name, status")
    .eq("tournament_id", tournamentId)
    .single();

  const { error } = await admin
    .from("tournaments")
    .update({
      description,
      required_starting_players: requiredStartingPlayers,
      entry_fee_per_starting_slot: entryFee,
      first_place_prize: firstPlacePrize,
      second_place_prize: secondPlacePrize,
      third_place_prize: thirdPlacePrize,
      starts_at: startsAt,
      status,
    })
    .eq("tournament_id", tournamentId);

  if (error) {
    return { error: error.message };
  }

  if (previous && previous.status !== status && status === "open") {
    await notifyDiscord(
      `**Registration is now open:** ${previous.name}\nhttps://chaostournaments.com/tournaments/${tournamentSlug}`
    );
  }

  revalidatePath(`/admin/tournaments/${tournamentSlug}/edit`);
  revalidatePath(`/tournaments/${tournamentSlug}`);
  revalidatePath("/admin");
  return undefined;
}

/**
 * Approves or rejects a pending team registration. Admin-only. "Rejected" is stored as
 * `withdrawn` rather than a dedicated status — there's no separate admin-rejected state in
 * the Section 22 enum, and withdrawn conveys the same practical outcome (not competing).
 */
export async function setRegistrationStatus(
  registrationId: string,
  tournamentSlug: string,
  status: "approved" | "withdrawn"
) {
  await requireAdmin();

  const admin = createAdminClient();
  const { data: updated, error } = await admin
    .from("tournament_registrations")
    .update({ registration_status: status })
    .eq("registration_id", registrationId)
    .select("team_id, teams(team_name), tournaments(name)")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const team = Array.isArray(updated.teams) ? updated.teams[0] : updated.teams;
  const tournament = Array.isArray(updated.tournaments) ? updated.tournaments[0] : updated.tournaments;
  await notifyDiscord(
    status === "approved"
      ? `**${team?.team_name}** was approved for **${tournament?.name}**`
      : `**${team?.team_name}**'s registration for **${tournament?.name}** was rejected`
  );

  if (status === "approved") {
    await notifyBotRoleSync({ event: "registration_approved", teamId: updated.team_id });
  }

  revalidatePath(`/admin/tournaments/${tournamentSlug}/edit`);
  revalidatePath(`/tournaments/${tournamentSlug}`);
}
