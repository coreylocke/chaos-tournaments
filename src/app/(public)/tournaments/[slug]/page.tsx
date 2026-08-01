import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { registerForTournamentAction } from "../../teams/[id]/register/actions";

export default async function TournamentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { slug } = await params;
  const { error } = await searchParams;
  const supabase = await createClient();

  const { data: tournament } = await supabase
    .from("tournaments")
    .select(
      "tournament_id, name, division, status, entry_fee_per_starting_slot_cents, required_starting_players, check_in_open_at, check_in_close_at, starts_at"
    )
    .eq("slug", slug)
    .single();
  if (!tournament) notFound();

  const { data: rules } = await supabase
    .from("tournament_rules")
    .select("body")
    .eq("tournament_id", tournament.tournament_id)
    .maybeSingle();

  const user = await getCurrentUser();

  let myTeams: Array<{ team_id: string; team_name: string }> = [];
  let registeredTeamIds = new Set<string>();
  if (user) {
    const { data: teams } = await supabase
      .from("teams")
      .select("team_id, team_name")
      .eq("captain_user_id", user.user_id)
      .eq("division", tournament.division);
    myTeams = teams ?? [];

    const teamIds = myTeams.map((t) => t.team_id);
    if (teamIds.length) {
      const { data: existing } = await supabase
        .from("tournament_registrations")
        .select("team_id")
        .eq("tournament_id", tournament.tournament_id)
        .in("team_id", teamIds);
      registeredTeamIds = new Set((existing ?? []).map((r) => r.team_id));
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-8 px-6 py-12">
      <div>
        <h1 className="text-2xl font-semibold">{tournament.name}</h1>
        <p className="text-sm text-zinc-500">
          {tournament.division} division &middot; {tournament.status} &middot;{" "}
          {tournament.required_starting_players}
          {" "}starters &middot; $
          {(tournament.entry_fee_per_starting_slot_cents / 100).toFixed(2)} per entry
        </p>
        <Link
          href={`/tournaments/${slug}/bracket`}
          className="mt-2 inline-block text-sm font-medium underline"
        >
          View Bracket
        </Link>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      <div>
        <h2 className="mb-2 text-lg font-medium">Register</h2>
        {tournament.status !== "open" ? (
          <p className="text-sm text-zinc-500">
            This tournament isn&apos;t open for registration yet.
          </p>
        ) : !user ? (
          <Link
            href={`/login?next=/tournaments/${slug}`}
            className="flex h-11 w-fit items-center rounded-full bg-foreground px-5 text-sm font-medium text-background"
          >
            Log in to register
          </Link>
        ) : myTeams.length === 0 ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-zinc-500">
              You don&apos;t captain a {tournament.division} team yet.
            </p>
            <Link
              href="/teams/create"
              className="flex h-11 w-fit items-center rounded-full bg-foreground px-5 text-sm font-medium text-background"
            >
              Create a team
            </Link>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {myTeams.map((team) => (
              <li
                key={team.team_id}
                className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 px-4 py-3 dark:border-zinc-800"
              >
                <span>{team.team_name}</span>
                {registeredTeamIds.has(team.team_id) ? (
                  <span className="text-xs text-zinc-500">Registered</span>
                ) : (
                  <form action={registerForTournamentAction}>
                    <input type="hidden" name="team_id" value={team.team_id} />
                    <input
                      type="hidden"
                      name="tournament_id"
                      value={tournament.tournament_id}
                    />
                    <input
                      type="hidden"
                      name="return_to"
                      value={`/tournaments/${slug}`}
                    />
                    <button
                      type="submit"
                      className="h-10 rounded-full bg-foreground px-4 text-sm font-medium text-background"
                    >
                      Register
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {rules?.body && (
        <div>
          <h2 className="mb-2 text-lg font-medium">Rules</h2>
          <p className="whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-400">
            {rules.body}
          </p>
        </div>
      )}
    </div>
  );
}
