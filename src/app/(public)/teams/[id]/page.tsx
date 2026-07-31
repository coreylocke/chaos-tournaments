import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: team } = await supabase
    .from("teams")
    .select("team_id, team_name, division, status")
    .eq("team_id", id)
    .single();

  if (!team) notFound();

  const { data: members } = await supabase
    .from("team_members")
    .select("team_member_id, roster_role, platform, is_confirmed")
    .eq("team_id", id);

  return (
    <div className="flex flex-1 flex-col gap-6 px-6 py-12">
      <div>
        <h1 className="text-2xl font-semibold">{team.team_name}</h1>
        <p className="text-sm text-zinc-500">
          {team.division} division &middot; {team.status}
        </p>
      </div>

      <div>
        <h2 className="mb-2 text-lg font-medium">Roster</h2>
        <ul className="flex flex-col gap-2">
          {members?.map((member) => (
            <li
              key={member.team_member_id}
              className="flex items-center justify-between rounded-lg border border-zinc-200 px-4 py-3 text-sm dark:border-zinc-800"
            >
              <span className="capitalize">{member.roster_role}</span>
              <span className="text-zinc-500">{member.platform}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
