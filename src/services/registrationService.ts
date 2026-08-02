import "server-only";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { isPlatformValidForDivision } from "@/lib/rules/platformRules";
import type { Platform, TournamentDivision } from "@/lib/rules/platformRules";
import { notifyN8n } from "@/services/n8nNotifyService";
import { assignCheckedInRoleToTeam } from "@/services/discordService";

type TeamMemberRow = {
  team_member_id: string;
  user_id: string;
  roster_role: "starter" | "substitute" | "reserve" | "coach" | "manager";
  platform: Platform;
};

export type RegisterTeamInput = {
  tournamentId: string;
  teamId: string;
  actingUserId: string;
};

// The "minimal registration trigger" decided for Phase 2 (CLAUDE.md Section
// 0/25a): validates division/roster/platform per the brief's Section 19
// pseudocode, then creates the registration, snapshots the roster, and
// generates one unpaid entry slot per required starter. No Stripe/checkout
// code — that's Phase 3. Sequential inserts, not a single DB transaction,
// matching the pattern already used (and reviewed) in teamService/
// tournamentService from Phase 1.
export async function registerTeamForTournament(input: RegisterTeamInput) {
  const supabase = createServiceRoleClient();

  const { data: team, error: teamError } = await supabase
    .from("teams")
    .select("team_id, team_name, division, captain_user_id")
    .eq("team_id", input.teamId)
    .single();
  if (teamError) throw teamError;
  if (team.captain_user_id !== input.actingUserId) {
    throw new Error("Only the team captain can register this team.");
  }

  const { data: tournament, error: tournamentError } = await supabase
    .from("tournaments")
    .select(
      "tournament_id, name, division, required_starting_players, maximum_substitutes, maximum_reserves, maximum_coaches, maximum_managers, entry_fee_per_starting_slot_cents, status"
    )
    .eq("tournament_id", input.tournamentId)
    .single();
  if (tournamentError) throw tournamentError;
  const tournamentDivision = tournament.division as TournamentDivision;

  if (team.division !== tournament.division) {
    throw new Error(
      `This team is in the ${team.division} division and can't register for a ${tournament.division} tournament.`
    );
  }
  if (tournament.status !== "open") {
    throw new Error("This tournament isn't open for registration.");
  }

  const { data: existingRegistration } = await supabase
    .from("tournament_registrations")
    .select("registration_id")
    .eq("tournament_id", input.tournamentId)
    .eq("team_id", input.teamId)
    .maybeSingle();
  if (existingRegistration) {
    throw new Error("This team is already registered for this tournament.");
  }

  const { data: members, error: membersError } = await supabase
    .from("team_members")
    .select("team_member_id, user_id, roster_role, platform")
    .eq("team_id", input.teamId)
    .eq("is_active", true);
  if (membersError) throw membersError;

  const byRole = (role: TeamMemberRow["roster_role"]) =>
    (members as TeamMemberRow[]).filter((m) => m.roster_role === role);

  const starters = byRole("starter");
  const substitutes = byRole("substitute");
  const reserves = byRole("reserve");
  const coaches = byRole("coach");
  const managers = byRole("manager");

  if (starters.length < tournament.required_starting_players) {
    throw new Error(
      `This team needs ${tournament.required_starting_players} starters to register, but only has ${starters.length}. Add more starters to the roster first.`
    );
  }
  if (starters.length > tournament.required_starting_players) {
    throw new Error(
      `This team has ${starters.length} starters, but this tournament requires exactly ${tournament.required_starting_players}. Redesignate the extra starters as substitutes or reserves first.`
    );
  }
  if (substitutes.length > tournament.maximum_substitutes) {
    throw new Error(
      `This team has ${substitutes.length} substitutes, but this tournament allows at most ${tournament.maximum_substitutes}.`
    );
  }
  if (reserves.length > tournament.maximum_reserves) {
    throw new Error(
      `This team has ${reserves.length} reserves, but this tournament allows at most ${tournament.maximum_reserves}.`
    );
  }
  if (coaches.length > tournament.maximum_coaches) {
    throw new Error(
      `This team has ${coaches.length} coaches, but this tournament allows at most ${tournament.maximum_coaches}.`
    );
  }
  if (managers.length > tournament.maximum_managers) {
    throw new Error(
      `This team has ${managers.length} managers, but this tournament allows at most ${tournament.maximum_managers}.`
    );
  }

  const platformValidated = [...starters, ...substitutes, ...reserves];
  const invalidPlatformMember = platformValidated.find(
    (m) => !isPlatformValidForDivision(m.platform, tournamentDivision)
  );
  if (invalidPlatformMember) {
    throw new Error(
      `A roster member's platform (${invalidPlatformMember.platform}) isn't compatible with this tournament's ${tournament.division} division.`
    );
  }

  // Brief Section 41: "a player may represent only one team in the same
  // tournament." Check every active roster member (not just starters —
  // coaches/managers count as representing the team too) against every
  // other team they belong to for a conflicting registration.
  const memberUserIds = (members as TeamMemberRow[]).map((m) => m.user_id);
  const { data: otherMemberships } = await supabase
    .from("team_members")
    .select("user_id, team_id")
    .in("user_id", memberUserIds)
    .neq("team_id", input.teamId)
    .eq("is_active", true);
  const otherTeamIds = [...new Set((otherMemberships ?? []).map((m) => m.team_id))];
  if (otherTeamIds.length) {
    const { data: conflictingRegs } = await supabase
      .from("tournament_registrations")
      .select("team_id")
      .eq("tournament_id", input.tournamentId)
      .in("team_id", otherTeamIds);
    if (conflictingRegs?.length) {
      throw new Error(
        "One or more of this team's members are already registered for this tournament on another team."
      );
    }
  }

  const { data: registration, error: registrationError } = await supabase
    .from("tournament_registrations")
    .insert({ tournament_id: input.tournamentId, team_id: input.teamId })
    .select()
    .single();
  if (registrationError) throw registrationError;

  const rosterRows = (members as TeamMemberRow[]).map((m) => ({
    registration_id: registration.registration_id,
    team_member_id: m.team_member_id,
    assigned_role: m.roster_role,
    starter_slot_number:
      m.roster_role === "starter"
        ? starters.findIndex((s) => s.team_member_id === m.team_member_id) + 1
        : null,
  }));
  const { error: rosterError } = await supabase
    .from("registration_rosters")
    .insert(rosterRows);
  if (rosterError) throw rosterError;

  const entrySlotRows = starters.map((starter, index) => ({
    registration_id: registration.registration_id,
    slot_number: index + 1,
    assigned_starter_user_id: starter.user_id,
    entry_fee_amount_cents: tournament.entry_fee_per_starting_slot_cents,
  }));
  const { error: slotsError } = await supabase
    .from("registration_entry_slots")
    .insert(entrySlotRows);
  if (slotsError) throw slotsError;

  await notifyN8n("registration_created", {
    team_name: team.team_name,
    tournament_name: tournament.name,
  });

  return registration;
}

async function loadRegistrationForCaptainAction(
  registrationId: string,
  actingUserId: string,
  supabase: ReturnType<typeof createServiceRoleClient>
) {
  const { data: registration, error } = await supabase
    .from("tournament_registrations")
    .select(
      "registration_id, tournament_id, team_id, funding_status, rules_accepted_at, checked_in_at, teams(captain_user_id), tournaments(check_in_open_at, check_in_close_at)"
    )
    .eq("registration_id", registrationId)
    .single();
  if (error) throw error;

  const captainUserId = (
    registration.teams as unknown as { captain_user_id: string } | null
  )?.captain_user_id;
  if (captainUserId !== actingUserId) {
    throw new Error("Only the team captain can do this.");
  }

  return registration;
}

// Business rule 17 (master brief): the captain accepts tournament rules.
export async function acceptRegistrationRules(input: {
  registrationId: string;
  actingUserId: string;
}) {
  const supabase = createServiceRoleClient();
  const registration = await loadRegistrationForCaptainAction(
    input.registrationId,
    input.actingUserId,
    supabase
  );

  if (registration.rules_accepted_at) return registration;

  const { error } = await supabase
    .from("tournament_registrations")
    .update({ rules_accepted_at: new Date().toISOString() })
    .eq("registration_id", input.registrationId);
  if (error) throw error;
}

// Business rule 18 (master brief): team completes check-in. Gated on the
// stepper order from Section 20 — funding and rules acceptance must already
// be done — and on the tournament's check-in window, if configured.
export async function checkInRegistration(input: {
  registrationId: string;
  actingUserId: string;
}) {
  const supabase = createServiceRoleClient();
  const registration = await loadRegistrationForCaptainAction(
    input.registrationId,
    input.actingUserId,
    supabase
  );

  if (registration.checked_in_at) return registration;
  if (registration.funding_status !== "fully_funded") {
    throw new Error("All required entries must be paid before check-in.");
  }
  if (!registration.rules_accepted_at) {
    throw new Error("Accept the tournament rules before checking in.");
  }

  const tournament = registration.tournaments as unknown as {
    check_in_open_at: string | null;
    check_in_close_at: string | null;
  } | null;
  const now = new Date();
  if (tournament?.check_in_open_at && now < new Date(tournament.check_in_open_at)) {
    throw new Error("Check-in hasn't opened yet.");
  }
  if (tournament?.check_in_close_at && now > new Date(tournament.check_in_close_at)) {
    throw new Error("Check-in has closed.");
  }

  const { error } = await supabase
    .from("tournament_registrations")
    .update({ checked_in_at: now.toISOString() })
    .eq("registration_id", input.registrationId);
  if (error) throw error;

  await assignCheckedInRoleToTeam(registration.team_id);
}

// Admin-only. Authorization happens in the caller, same as the rest of the
// service layer.
export async function setRegistrationStatus(input: {
  registrationId: string;
  status: "approved" | "rejected";
}) {
  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from("tournament_registrations")
    .update({ status: input.status })
    .eq("registration_id", input.registrationId);
  if (error) throw error;
}
