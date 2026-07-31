import "server-only";
import { createServiceRoleClient } from "@/lib/supabase/server";
import {
  isPlatformValidForDivision,
  type Platform,
  type TournamentDivision,
} from "@/lib/rules/platformRules";

export type CreateInvitationInput = {
  teamId: string;
  invitedByUserId: string;
  invitedDiscordUsername: string;
  rosterRole: "starter" | "substitute" | "reserve" | "coach" | "manager";
  platform: Platform;
};

// Privileged write, routed through the service-role client per CLAUDE.md
// Section 8 — invite creation needs to look up another user's account by
// Discord username, which RLS deliberately doesn't expose to regular users.
export async function createInvitation(input: CreateInvitationInput) {
  const supabase = createServiceRoleClient();

  const { data: team, error: teamError } = await supabase
    .from("teams")
    .select("team_id, division, captain_user_id")
    .eq("team_id", input.teamId)
    .single();

  if (teamError) throw teamError;
  if (team.captain_user_id !== input.invitedByUserId) {
    throw new Error("Only the team captain can send invitations.");
  }

  if (
    (input.rosterRole === "starter" ||
      input.rosterRole === "substitute" ||
      input.rosterRole === "reserve") &&
    !isPlatformValidForDivision(
      input.platform,
      team.division as TournamentDivision
    )
  ) {
    throw new Error(
      `${input.platform} isn't compatible with this team's ${team.division} division.`
    );
  }

  const { data: discordAccount, error: discordError } = await supabase
    .from("discord_accounts")
    .select("user_id")
    .ilike("discord_username", input.invitedDiscordUsername)
    .maybeSingle();

  if (discordError) throw discordError;
  if (!discordAccount) {
    throw new Error(
      `No Chaos Tournaments account found for Discord username "${input.invitedDiscordUsername}". They need to log in at least once before they can be invited.`
    );
  }

  const { data: existingMember } = await supabase
    .from("team_members")
    .select("team_member_id")
    .eq("team_id", input.teamId)
    .eq("user_id", discordAccount.user_id)
    .eq("is_active", true)
    .maybeSingle();

  if (existingMember) {
    throw new Error("That user is already on this team.");
  }

  const { data: invitation, error: invitationError } = await supabase
    .from("team_invitations")
    .insert({
      team_id: input.teamId,
      invited_user_id: discordAccount.user_id,
      invited_by_user_id: input.invitedByUserId,
      roster_role: input.rosterRole,
      platform: input.platform,
    })
    .select()
    .single();

  if (invitationError) throw invitationError;

  return invitation;
}

export async function respondToInvitation(input: {
  invitationId: string;
  respondingUserId: string;
  accept: boolean;
}) {
  const supabase = createServiceRoleClient();

  const { data: invitation, error: invitationError } = await supabase
    .from("team_invitations")
    .select("*")
    .eq("invitation_id", input.invitationId)
    .single();

  if (invitationError) throw invitationError;
  if (invitation.invited_user_id !== input.respondingUserId) {
    throw new Error("This invitation isn't addressed to you.");
  }
  if (invitation.status !== "pending") {
    throw new Error("This invitation has already been responded to.");
  }

  const { error: updateError } = await supabase
    .from("team_invitations")
    .update({
      status: input.accept ? "accepted" : "declined",
      responded_at: new Date().toISOString(),
    })
    .eq("invitation_id", input.invitationId);

  if (updateError) throw updateError;

  if (input.accept) {
    const { error: memberError } = await supabase.from("team_members").insert({
      team_id: invitation.team_id,
      user_id: invitation.invited_user_id,
      roster_role: invitation.roster_role,
      platform: invitation.platform,
      is_confirmed: true,
    });

    if (memberError) throw memberError;
  }
}
