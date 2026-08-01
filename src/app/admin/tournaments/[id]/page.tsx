import { notFound } from "next/navigation";
import { createServiceRoleClient } from "@/lib/supabase/server";
import Link from "next/link";
import { generateBracketAction } from "./actions";
import { EnterResultForm } from "./EnterResultForm";
import { ForfeitForm } from "./ForfeitForm";

export default async function AdminTournamentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const supabase = createServiceRoleClient();

  const { data: tournament } = await supabase
    .from("tournaments")
    .select("tournament_id, name, status, minimum_teams")
    .eq("tournament_id", id)
    .single();
  if (!tournament) notFound();

  const { count: eligibleCount } = await supabase
    .from("tournament_registrations")
    .select("registration_id", { count: "exact", head: true })
    .eq("tournament_id", id)
    .eq("status", "approved")
    .eq("funding_status", "fully_funded")
    .not("checked_in_at", "is", null);

  const { data: bracket } = await supabase
    .from("brackets")
    .select("bracket_id, bracket_size, status")
    .eq("tournament_id", id)
    .maybeSingle();

  const { data: matches } = bracket
    ? await supabase
        .from("matches")
        .select(
          "match_id, round_number, round_name, bracket_position, team_1_id, team_2_id, winner_team_id, status, result_type"
        )
        .eq("bracket_id", bracket.bracket_id)
        .order("round_number")
        .order("bracket_position")
    : { data: null };

  const teamIds = Array.from(
    new Set(
      (matches ?? []).flatMap((m) => [m.team_1_id, m.team_2_id, m.winner_team_id].filter(Boolean))
    )
  ) as string[];
  const { data: teams } = teamIds.length
    ? await supabase.from("teams").select("team_id, team_name").in("team_id", teamIds)
    : { data: [] as Array<{ team_id: string; team_name: string }> };
  const teamName = new Map((teams ?? []).map((t) => [t.team_id, t.team_name]));

  const rounds = new Map<number, typeof matches>();
  for (const m of matches ?? []) {
    if (!rounds.has(m.round_number)) rounds.set(m.round_number, []);
    rounds.get(m.round_number)!.push(m);
  }

  return (
    <div className="flex flex-1 flex-col gap-8 px-6 py-12">
      <div>
        <h1 className="text-2xl font-semibold">{tournament.name}</h1>
        <p className="text-sm text-zinc-500">
          {tournament.status} &middot; {eligibleCount ?? 0} eligible teams
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      {!bracket ? (
        <form action={generateBracketAction}>
          <input type="hidden" name="tournament_id" value={tournament.tournament_id} />
          <button
            type="submit"
            className="h-11 rounded-full bg-foreground px-5 text-sm font-medium text-background"
          >
            Generate Bracket
          </button>
        </form>
      ) : (
        <div className="flex flex-col gap-8">
          {Array.from(rounds.entries()).map(([roundNumber, roundMatches]) => (
            <div key={roundNumber}>
              <h2 className="mb-2 text-lg font-medium">{roundMatches![0].round_name}</h2>
              <ul className="flex flex-col gap-2">
                {roundMatches!.map((m) => {
                  const t1 = m.team_1_id ? teamName.get(m.team_1_id) : null;
                  const t2 = m.team_2_id ? teamName.get(m.team_2_id) : null;
                  return (
                    <li
                      key={m.match_id}
                      className="flex flex-col gap-2 rounded-lg border border-zinc-200 px-4 py-3 text-sm dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <span>
                        {t1 ?? "TBD"} vs {t2 ?? "TBD"}
                        {m.status === "completed" && m.winner_team_id && (
                          <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                            {teamName.get(m.winner_team_id)} won
                            {m.result_type && m.result_type !== "normal" ? ` (${m.result_type})` : ""}
                          </span>
                        )}
                        {m.status === "awaiting_confirmation" && (
                          <span className="ml-2 text-xs text-zinc-500">awaiting confirmation</span>
                        )}
                        {m.status === "disputed" && (
                          <Link
                            href="/admin/disputes"
                            className="ml-2 text-xs font-medium text-red-600 dark:text-red-400"
                          >
                            disputed — resolve
                          </Link>
                        )}
                        {m.status === "voided" && (
                          <span className="ml-2 text-xs text-zinc-500">voided</span>
                        )}
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        {m.status === "ready" && m.team_1_id && m.team_2_id && (
                          <EnterResultForm
                            tournamentId={tournament.tournament_id}
                            matchId={m.match_id}
                            team1={{ id: m.team_1_id, name: t1 ?? "Team 1" }}
                            team2={{ id: m.team_2_id, name: t2 ?? "Team 2" }}
                          />
                        )}
                        {["ready", "awaiting_confirmation"].includes(m.status) &&
                          m.team_1_id &&
                          m.team_2_id && (
                            <ForfeitForm
                              tournamentId={tournament.tournament_id}
                              matchId={m.match_id}
                              team1={{ id: m.team_1_id, name: t1 ?? "Team 1" }}
                              team2={{ id: m.team_2_id, name: t2 ?? "Team 2" }}
                            />
                          )}
                        {m.status === "pending" && (
                          <span className="text-xs text-zinc-500">Awaiting teams</span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
