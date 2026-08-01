import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function TournamentBracketPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: tournament } = await supabase
    .from("tournaments")
    .select("tournament_id, name")
    .eq("slug", slug)
    .single();
  if (!tournament) notFound();

  const { data: bracket } = await supabase
    .from("brackets")
    .select("bracket_id")
    .eq("tournament_id", tournament.tournament_id)
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
      (matches ?? []).flatMap((m) => [m.team_1_id, m.team_2_id].filter(Boolean))
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
      <h1 className="text-2xl font-semibold">{tournament.name} — Bracket</h1>

      {!bracket && (
        <p className="text-sm text-zinc-500">
          The bracket hasn&apos;t been generated yet.
        </p>
      )}

      <div className="flex gap-8 overflow-x-auto">
        {Array.from(rounds.entries()).map(([roundNumber, roundMatches]) => (
          <div key={roundNumber} className="flex min-w-[220px] flex-col gap-3">
            <h2 className="text-sm font-medium text-zinc-500">
              {roundMatches![0].round_name}
            </h2>
            {roundMatches!.map((m) => {
              const t1 = m.team_1_id ? teamName.get(m.team_1_id) : "TBD";
              const t2 = m.team_2_id ? teamName.get(m.team_2_id) : "TBD";
              return (
                <div
                  key={m.match_id}
                  className="rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800"
                >
                  <p
                    className={
                      m.winner_team_id && m.winner_team_id === m.team_1_id
                        ? "font-medium text-green-600 dark:text-green-400"
                        : ""
                    }
                  >
                    {t1}
                  </p>
                  <p
                    className={
                      m.winner_team_id && m.winner_team_id === m.team_2_id
                        ? "font-medium text-green-600 dark:text-green-400"
                        : ""
                    }
                  >
                    {t2}
                  </p>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
