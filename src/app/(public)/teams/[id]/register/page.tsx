import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { createClient } from "@/lib/supabase/server";
import { registerForTournamentAction } from "./actions";

export default async function RegisterTeamPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/teams/${id}/register`);

  const supabase = await createClient();

  const { data: team } = await supabase
    .from("teams")
    .select("team_id, team_name, division, captain_user_id")
    .eq("team_id", id)
    .single();
  if (!team) notFound();
  if (team.captain_user_id !== user!.user_id) redirect(`/teams/${id}`);

  const { data: tournaments } = await supabase
    .from("tournaments")
    .select("tournament_id, name, entry_fee_per_starting_slot_cents, required_starting_players")
    .eq("division", team.division)
    .eq("status", "open");

  const { data: existingRegistrations } = await supabase
    .from("tournament_registrations")
    .select("tournament_id")
    .eq("team_id", id);
  const registeredIds = new Set((existingRegistrations ?? []).map((r) => r.tournament_id));

  return (
    <div className="flex flex-1 flex-col gap-6 px-6 py-12">
      <div>
        <h1 className="text-2xl font-semibold">Register {team.team_name}</h1>
        <p className="text-sm text-zinc-500">{team.division} division tournaments open for registration</p>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      {!tournaments?.length && (
        <p className="text-sm text-zinc-500">No open tournaments in this division right now.</p>
      )}

      <ul className="flex flex-col gap-3">
        {tournaments?.map((t) => {
          const alreadyRegistered = registeredIds.has(t.tournament_id);
          return (
            <li
              key={t.tournament_id}
              className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 px-4 py-3 dark:border-zinc-800"
            >
              <div>
                <p className="font-medium">{t.name}</p>
                <p className="text-xs text-zinc-500">
                  {t.required_starting_players} starters &middot; $
                  {(t.entry_fee_per_starting_slot_cents / 100).toFixed(2)} per entry
                </p>
              </div>
              {alreadyRegistered ? (
                <span className="text-xs text-zinc-500">Registered</span>
              ) : (
                <form action={registerForTournamentAction}>
                  <input type="hidden" name="team_id" value={id} />
                  <input type="hidden" name="tournament_id" value={t.tournament_id} />
                  <button
                    type="submit"
                    className="h-10 rounded-full bg-foreground px-4 text-sm font-medium text-background"
                  >
                    Register
                  </button>
                </form>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
