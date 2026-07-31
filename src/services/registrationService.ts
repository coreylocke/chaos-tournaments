import "server-only";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { isPlatformValidForDivision } from "@/lib/rules/platformRules";
import type { Platform, TournamentDivision } from "@/lib/rules/platformRules";

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
    .select("team_id, division, captain_user_id")
    .eq("team_id", input.teamId)
    .single();
  if (teamError) throw teamError;
  if (team.captain_user_id !== input.actingUserId) {
    throw new Error("Only the team captain can register this team.");
  }

  const { data: tournament, error: tournamentError } = await supabase
    .from("tournaments")
    .select(
      "tournament_id, division, required_starting_players, maximum_substitutes, maximum_reserves, maximum_coaches, maximum_managers, entry_fee_per_starting_slot_cents, status"
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

  return registration;
}
