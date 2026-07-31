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
  status?: "draft" | "open";
  checkInOpenAt?: string;
  checkInCloseAt?: string;
  rulesBody?: string;
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
      status: input.status ?? "draft",
      check_in_open_at: input.checkInOpenAt ?? null,
      check_in_close_at: input.checkInCloseAt ?? null,
    })
    .select()
    .single();

  if (error) throw error;

  const { error: settingsError } = await supabase
    .from("tournament_settings")
    .insert({ tournament_id: tournament.tournament_id });

  if (settingsError) throw settingsError;

  if (input.rulesBody && input.rulesBody.trim()) {
    const { error: rulesError } = await supabase
      .from("tournament_rules")
      .insert({ tournament_id: tournament.tournament_id, body: input.rulesBody.trim() });
    if (rulesError) throw rulesError;
  }

  return tournament;
}
