import { createServiceRoleClient } from "@/lib/supabase/server";
import { ResolveDisputeForm } from "./ResolveDisputeForm";

export default async function AdminDisputesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = createServiceRoleClient();

  const { data: disputes } = await supabase
    .from("disputes")
    .select("dispute_id, reason, description, status, created_at, match_id")
    .eq("status", "open")
    .order("created_at", { ascending: true });

  const matchIds = Array.from(new Set((disputes ?? []).map((d) => d.match_id)));
  const { data: matches } = matchIds.length
    ? await supabase
        .from("matches")
        .select("match_id, round_name, team_1_id, team_2_id")
        .in("match_id", matchIds)
    : { data: [] as Array<{ match_id: string; round_name: string | null; team_1_id: string | null; team_2_id: string | null }> };
  const matchById = new Map((matches ?? []).map((m) => [m.match_id, m]));

  const teamIds = Array.from(
    new Set((matches ?? []).flatMap((m) => [m.team_1_id, m.team_2_id].filter(Boolean)))
  ) as string[];
  const { data: teams } = teamIds.length
    ? await supabase.from("teams").select("team_id, team_name").in("team_id", teamIds)
    : { data: [] as Array<{ team_id: string; team_name: string }> };
  const teamName = new Map((teams ?? []).map((t) => [t.team_id, t.team_name]));

  return (
    <div className="flex flex-1 flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-semibold">Disputes</h1>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      {!disputes?.length && <p className="text-sm text-zinc-500">No open disputes.</p>}

      <ul className="flex flex-col gap-3">
        {disputes?.map((d) => {
          const match = matchById.get(d.match_id);
          const team1 = match?.team_1_id
            ? { id: match.team_1_id, name: teamName.get(match.team_1_id) ?? "Team 1" }
            : { id: "", name: "Team 1" };
          const team2 = match?.team_2_id
            ? { id: match.team_2_id, name: teamName.get(match.team_2_id) ?? "Team 2" }
            : { id: "", name: "Team 2" };

          return (
            <li
              key={d.dispute_id}
              className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 text-sm dark:border-zinc-800 sm:flex-row sm:items-start sm:justify-between"
            >
              <div>
                <p className="font-medium">
                  {team1.name} vs {team2.name} — {match?.round_name}
                </p>
                <p className="text-zinc-600 dark:text-zinc-400">{d.reason}</p>
                {d.description && (
                  <p className="mt-1 text-xs text-zinc-500">{d.description}</p>
                )}
              </div>
              <div className="w-full sm:w-64">
                <ResolveDisputeForm disputeId={d.dispute_id} team1={team1} team2={team2} />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
