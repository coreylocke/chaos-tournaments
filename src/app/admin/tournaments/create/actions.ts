"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { createTournament } from "@/services/tournamentService";
import { TOURNAMENT_DIVISIONS } from "@/lib/rules/platformRules";
import type { TournamentDivision } from "@/lib/rules/platformRules";

export async function createTournamentAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user?.is_admin) {
    redirect("/");
  }

  const name = String(formData.get("name") ?? "").trim();
  const division = String(formData.get("division") ?? "") as TournamentDivision;
  const entryFeeDollars = Number(formData.get("entry_fee_dollars") ?? 0);
  const requiredStartingPlayers = Number(
    formData.get("required_starting_players") ?? 5
  );
  const maximumSubstitutes = Number(formData.get("maximum_substitutes") ?? 2);
  const maximumReserves = Number(formData.get("maximum_reserves") ?? 2);

  if (!name || !TOURNAMENT_DIVISIONS.includes(division)) {
    redirect("/admin/tournaments/create?error=invalid_input");
  }

  await createTournament({
    name,
    division,
    entryFeePerStartingSlotCents: Math.round(entryFeeDollars * 100),
    requiredStartingPlayers,
    maximumSubstitutes,
    maximumReserves,
  });

  redirect("/admin/tournaments");
}
