import "server-only";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { TournamentDivision } from "@/lib/rules/platformRules";

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export type CreateTournamentInput = {
  name: string;
  division: TournamentDivision;
  entryFeePerStartingSlotCents: number;
  requiredStartingPlayers: number;
  maximumSubstitutes: number;
  maximumReserves: number;
};

// Admin-only privileged write. Authorization (is_admin check) happens in the
// caller (the admin route's server action) before this is ever invoked —
// this function trusts its caller, same as the rest of the service layer.
export async function createTournament(input: CreateTournamentInput) {
  const supabase = createServiceRoleClient();
  const slug = slugify(input.name);

  const { data: tournament, error } = await supabase
    .from("tournaments")
    .insert({
      name: input.name,
      slug,
      division: input.division,
      entry_fee_per_starting_slot_cents: input.entryFeePerStartingSlotCents,
      required_starting_players: input.requiredStartingPlayers,
      maximum_substitutes: input.maximumSubstitutes,
      maximum_reserves: input.maximumReserves,
    })
    .select()
    .single();

  if (error) throw error;

  const { error: settingsError } = await supabase
    .from("tournament_settings")
    .insert({ tournament_id: tournament.tournament_id });

  if (settingsError) throw settingsError;

  return tournament;
}
