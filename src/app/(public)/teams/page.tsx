import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function TeamsPage() {
  const supabase = await createClient();
  const { data: teams } = await supabase
    .from("teams")
    .select("team_id, team_name, division, status")
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-1 flex-col gap-6 px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Teams</h1>
        <Link
          href="/teams/create"
          className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          Create team
        </Link>
      </div>

      {!teams?.length && (
        <p className="text-sm text-zinc-500">No teams yet.</p>
      )}

      <ul className="flex flex-col gap-2">
        {teams?.map((team) => (
          <li key={team.team_id}>
            <Link
              href={`/teams/${team.team_id}`}
              className="flex items-center justify-between rounded-lg border border-zinc-200 px-4 py-3 dark:border-zinc-800"
            >
              <span>{team.team_name}</span>
              <span className="text-xs text-zinc-500">{team.division}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
