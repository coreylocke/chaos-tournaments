"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { notifyDiscord } from "@/lib/discord";
import { notifyBotRoleSync } from "@/lib/bot";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export type ActionState = { error?: string } | undefined;

/**
 * Creates a team with the current user as captain. Redirects to the new team's page on
 * success (Server Actions can't return + redirect in the same call cleanly with useFormState,
 * so errors are returned and success just redirects).
 */
export async function createTeam(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to create a team." };
  }

  const teamName = String(formData.get("team_name") ?? "").trim();
  const division = String(formData.get("division") ?? "");

  if (!teamName) {
    return { error: "Team name is required." };
  }
  if (division !== "pc" && division !== "console") {
    return { error: "Choose a division." };
  }

  const baseSlug = slugify(teamName);
  if (!baseSlug) {
    return { error: "Team name must contain at least one letter or number." };
  }

  // Try the base slug, then fall back to a short random suffix on collision.
  let slug = baseSlug;
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: existing } = await supabase
      .from("teams")
      .select("team_id")
      .eq("team_slug", slug)
      .maybeSingle();
    if (!existing) break;
    slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;
  }

  const { data: team, error } = await supabase
    .from("teams")
    .insert({
      team_name: teamName,
      team_slug: slug,
      captain_user_id: user.id,
      division,
    })
    .select("team_id")
    .single();

  if (error) {
    return { error: error.message };
  }

  await notifyDiscord(`**New team created:** ${teamName} (${division === "pc" ? "PC" : "Console"})`);
  await notifyBotRoleSync({ event: "team_created", teamId: team.team_id });

  revalidatePath("/teams");
  redirect(`/teams/${slug}`);
}

/**
 * Adds a member to a team's roster by their Discord username. Only the team's captain can
 * call this — enforced both by the RLS policy on team_members and a check here for a
 * friendlier error message.
 */
export async function addTeamMember(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in." };
  }

  const teamId = String(formData.get("team_id") ?? "");
  const teamSlug = String(formData.get("team_slug") ?? "");
  const discordUsername = String(formData.get("discord_username") ?? "").trim();
  const rosterRole = String(formData.get("roster_role") ?? "");
  const platform = String(formData.get("platform") ?? "");
  const gameUsername = String(formData.get("game_username") ?? "").trim() || null;

  if (!discordUsername) {
    return { error: "Enter the Discord username to add." };
  }
  if (!["starter", "substitute", "reserve", "coach", "manager"].includes(rosterRole)) {
    return { error: "Choose a roster role." };
  }
  if (!["pc", "ps5", "xbox"].includes(platform)) {
    return { error: "Choose a platform." };
  }

  const { data: team } = await supabase
    .from("teams")
    .select("captain_user_id")
    .eq("team_id", teamId)
    .single();

  if (!team || team.captain_user_id !== user.id) {
    return { error: "Only the team captain can add members." };
  }

  // Match either the unique Discord username or the (often more familiar) display name,
  // case-insensitively — Discord's newer username system means people don't always know
  // which one is on file. Two separate queries (rather than a single .or() filter) avoid
  // any risk of special characters in the input breaking PostgREST's filter syntax.
  const [byUsername, byDisplayName] = await Promise.all([
    supabase.from("user_profiles").select("user_id").ilike("discord_username", discordUsername),
    supabase.from("user_profiles").select("user_id").ilike("discord_display_name", discordUsername),
  ]);
  const matchedIds = new Set(
    [...(byUsername.data ?? []), ...(byDisplayName.data ?? [])].map((row) => row.user_id)
  );
  const matches = Array.from(matchedIds).map((user_id) => ({ user_id }));

  if (matches.length === 0) {
    return {
      error: `No Chaos Tournaments account found for "${discordUsername}". They need to log in with Discord at least once first.`,
    };
  }
  if (matches.length > 1) {
    return {
      error: `Multiple accounts match "${discordUsername}" — ask them for their exact Discord username instead of display name.`,
    };
  }
  const profile = matches[0];

  const { error } = await supabase.from("team_members").insert({
    team_id: teamId,
    user_id: profile.user_id,
    roster_role: rosterRole,
    platform,
    game_username: gameUsername,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "That player is already on this team's roster." };
    }
    return { error: error.message };
  }

  await notifyBotRoleSync({ event: "roster_member_added", userId: profile.user_id, rosterRole });

  revalidatePath(`/teams/${teamSlug}`);
  return undefined;
}

/** Removes a member from a team's roster. Captain-only, enforced via RLS. */
export async function removeTeamMember(teamMemberId: string, teamSlug: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("team_members").delete().eq("team_member_id", teamMemberId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/teams/${teamSlug}`);
}
