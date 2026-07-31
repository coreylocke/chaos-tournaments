import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function RegistrationSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ team_id?: string; tournament_id?: string }>;
}) {
  const { team_id, tournament_id } = await searchParams;
  const supabase = await createClient();

  const [{ data: team }, { data: tournament }] = await Promise.all([
    team_id
      ? supabase.from("teams").select("team_name").eq("team_id", team_id).maybeSingle()
      : Promise.resolve({ data: null }),
    tournament_id
      ? supabase
          .from("tournaments")
          .select("name, slug")
          .eq("tournament_id", tournament_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-24 text-center">
      <h1 className="text-2xl font-semibold">Registration submitted</h1>
      <p className="max-w-sm text-sm text-zinc-500">
        {team?.team_name ?? "Your team"} is registered for{" "}
        {tournament?.name ?? "the tournament"}. Next: fund your entries, accept
        the rules, and check in before the tournament starts.
      </p>

      <div className="flex w-full max-w-xs flex-col gap-3">
        {team_id && (
          <>
            <Link
              href={`/teams/${team_id}/entries`}
              className="flex h-11 items-center justify-center rounded-full bg-foreground px-5 text-sm font-medium text-background"
            >
              View Team Entries
            </Link>
            <Link
              href={`/teams/${team_id}/roster`}
              className="flex h-11 items-center justify-center rounded-full border border-zinc-300 px-5 text-sm font-medium dark:border-zinc-700"
            >
              Edit Roster
            </Link>
          </>
        )}
        {tournament?.slug && (
          <Link
            href={`/tournaments/${tournament.slug}`}
            className="flex h-11 items-center justify-center rounded-full border border-zinc-300 px-5 text-sm font-medium dark:border-zinc-700"
          >
            View Tournament &amp; Rules
          </Link>
        )}
      </div>
    </div>
  );
}
