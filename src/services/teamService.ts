import "server-only";
import { createServiceRoleClient } from "@/lib/supabase/server";
import {
  platformToTournamentDivision,
  type Platform,
} from "@/lib/rules/platformRules";

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export type CreateTeamInput = {
  teamName: string;
  captainUserId: string;
  captainPlatform: Platform;
  captainGameUsername?: string;
};

// Privileged write (creates a team + seats the captain as a confirmed
// starter) — routed through the service-role client per CLAUDE.md Section 8
// rather than relying on client-side RLS writes.
export async function createTeam(input: CreateTeamInput) {
  const supabase = createServiceRoleClient();
  const division = platformToTournamentDivision(input.captainPlatform);
  const baseSlug = slugify(input.teamName);

  let teamSlug = baseSlug;
  let attempt = 0;
  // Simple collision handling: append a short suffix on conflict.
  // Team creation is low-frequency, so a retry loop is fine here.
  for (;;) {
    const { data: team, error } = await supabase
      .from("teams")
      .insert({
        team_name: input.teamName,
        team_slug: teamSlug,
        captain_user_id: input.captainUserId,
        division,
      })
      .select()
      .single();

    if (!error) {
      const { error: memberError } = await supabase
        .from("team_members")
        .insert({
          team_id: team.team_id,
          user_id: input.captainUserId,
          roster_role: "starter",
          platform: input.captainPlatform,
          game_username: input.captainGameUsername,
          is_confirmed: true,
        });

      if (memberError) throw memberError;

      return team;
    }

    if (error.code === "23505" && attempt < 5) {
      attempt += 1;
      teamSlug = `${baseSlug}-${attempt + 1}`;
      continue;
    }

    throw error;
  }
}

export type UpdateTeamMemberInput = {
  teamMemberId: string;
  actingUserId: string;
  rosterRole?: "starter" | "substitute" | "reserve" | "coach" | "manager";
  isActive?: boolean;
};

// Captain-only roster edits (change role, deactivate/remove a member).
// Never touches payer/entitlement data — those live entirely on
// registration_entry_slots per CLAUDE.md Section 4/6.
export async function updateTeamMember(input: UpdateTeamMemberInput) {
  const supabase = createServiceRoleClient();

  const { data: member, error: memberError } = await supabase
    .from("team_members")
    .select("team_member_id, team_id, teams(captain_user_id)")
    .eq("team_member_id", input.teamMemberId)
    .single();

  if (memberError) throw memberError;
  const captainUserId = (
    member.teams as unknown as { captain_user_id: string } | null
  )?.captain_user_id;
  if (captainUserId !== input.actingUserId) {
    throw new Error("Only the team captain can edit the roster.");
  }

  const update: {
    roster_role?: UpdateTeamMemberInput["rosterRole"];
    is_active?: boolean;
    removed_at?: string | null;
  } = {};
  if (input.rosterRole) update.roster_role = input.rosterRole;
  if (input.isActive === false) {
    update.is_active = false;
    update.removed_at = new Date().toISOString();
  } else if (input.isActive === true) {
    update.is_active = true;
    update.removed_at = null;
  }

  const { error } = await supabase
    .from("team_members")
    .update(update)
    .eq("team_member_id", input.teamMemberId);

  if (error) throw error;
}
