import { notFound } from "next/navigation";
import GenerateBracketButton from "@/components/GenerateBracketButton";
import ReportMatchResultButtons from "@/components/ReportMatchResultButtons";
import { createClient } from "@/lib/supabase/server";

export default async function BracketPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: tournament } = await supabase
    .from("tournaments")
    .select("tournament_id, name, slug, status")
    .eq("slug", slug)
    .maybeSingle();

  if (!tournament) {
    notFound();
  }

  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("is_admin")
      .eq("user_id", user.id)
      .maybeSingle();
    isAdmin = Boolean(profile?.is_admin);
  }

  const { data: matches } = await supabase
    .from("matches")
    .select(
      `match_id, round_number, round_name, match_number, status, result_type,
       team_1_id, team_2_id, winner_team_id,
       team_1:teams!matches_team_1_id_fkey(team_name),
       team_2:teams!matches_team_2_id_fkey(team_name),
       winner:teams!matches_winner_team_id_fkey(team_name)`
    )
    .eq("tournament_id", tournament.tournament_id)
    .order("match_number", { ascending: true });

  const { count: approvedCount } = await supabase
    .from("tournament_registrations")
    .select("registration_id", { count: "exact", head: true })
    .eq("tournament_id", tournament.tournament_id)
    .eq("registration_status", "approved");

  const rounds = new Map<number, typeof matches>();
  for (const m of matches ?? []) {
    if (!rounds.has(m.round_number)) rounds.set(m.round_number, []);
    rounds.get(m.round_number)!.push(m);
  }
  const roundNumbers = Array.from(rounds.keys()).sort((a, b) => a - b);

  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <div className="mb-2 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight text-chaos-white md:text-4xl">
          {tournament.name}
        </h1>
        <span className="rounded-full border border-chaos-gold/40 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-chaos-gold">
          Bracket
        </span>
      </div>
      <p className="mb-10 text-sm text-chaos-white/50">/tournaments/{slug}</p>

      {(!matches || matches.length === 0) && (
        <div className="rounded-lg border border-chaos-white/10 bg-chaos-charcoal p-6">
          <p className="mb-4 text-chaos-white/60">
            No bracket yet — {approvedCount ?? 0} team{approvedCount === 1 ? "" : "s"} approved so far.
          </p>
          {isAdmin &&
            (approvedCount && approvedCount >= 2 ? (
              <GenerateBracketButton tournamentId={tournament.tournament_id} tournamentSlug={slug} />
            ) : (
              <p className="text-sm text-chaos-white/40">Need at least 2 approved teams to generate a bracket.</p>
            ))}
        </div>
      )}

      {matches && matches.length > 0 && (
        <div className="flex gap-6 overflow-x-auto pb-4">
          {roundNumbers.map((roundNum) => (
            <div key={roundNum} className="flex min-w-[240px] flex-1 flex-col gap-4">
              <h2 className="font-display text-sm font-bold uppercase tracking-wide text-chaos-gold">
                {rounds.get(roundNum)![0].round_name}
              </h2>
              {rounds.get(roundNum)!.map((m) => {
                const team1 = Array.isArray(m.team_1) ? m.team_1[0] : m.team_1;
                const team2 = Array.isArray(m.team_2) ? m.team_2[0] : m.team_2;
                const winner = Array.isArray(m.winner) ? m.winner[0] : m.winner;
                return (
                  <div key={m.match_id} className="rounded-lg border border-chaos-white/10 bg-chaos-charcoal p-3">
                    <p
                      className={`text-sm ${
                        m.winner_team_id === m.team_1_id ? "font-bold text-chaos-gold" : "text-chaos-white/80"
                      }`}
                    >
                      {team1?.team_name ?? "TBD"}
                    </p>
                    <p
                      className={`text-sm ${
                        m.winner_team_id === m.team_2_id ? "font-bold text-chaos-gold" : "text-chaos-white/80"
                      }`}
                    >
                      {team2?.team_name ?? "TBD"}
                    </p>
                    {m.status === "completed" && (
                      <p className="mt-1 text-xs text-chaos-white/40">
                        {m.result_type === "bye" ? "Bye" : `Winner: ${winner?.team_name}`}
                      </p>
                    )}
                    {isAdmin && m.status === "ready" && team1 && team2 && (
                      <ReportMatchResultButtons
                        matchId={m.match_id}
                        tournamentSlug={slug}
                        team1Id={m.team_1_id!}
                        team1Name={team1.team_name}
                        team2Id={m.team_2_id!}
                        team2Name={team2.team_name}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
