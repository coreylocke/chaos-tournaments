import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function TeamsPage() {
  const supabase = await createClient();
  const { data: teams } = await supabase
    .from("teams")
    .select("team_id, team_name, team_slug, division, status, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight text-chaos-white md:text-4xl">
          Teams
        </h1>
        <Link
          href="/teams/new"
          className="touch-target rounded-md bg-chaos-gold px-6 py-2 text-sm font-bold text-chaos-black transition hover:shadow-gold-glow"
        >
          Create a team
        </Link>
      </div>

      {!teams || teams.length === 0 ? (
        <p className="text-chaos-white/60">No teams yet. Be the first to create one.</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {teams.map((team) => (
            <li key={team.team_id}>
              <Link
                href={`/teams/${team.team_slug}`}
                className="block rounded-lg border border-chaos-white/10 bg-chaos-charcoal px-5 py-4 transition hover:border-chaos-gold/50"
              >
                <p className="font-display text-lg font-bold text-chaos-white">{team.team_name}</p>
                <p className="mt-1 text-xs uppercase tracking-wide text-chaos-gold">
                  {team.division === "pc" ? "PC" : "Console"}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
