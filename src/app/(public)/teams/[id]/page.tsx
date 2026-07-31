import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/currentUser";

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const currentUser = await getCurrentUser();

  const { data: team } = await supabase
    .from("teams")
    .select("team_id, team_name, division, status, captain_user_id")
    .eq("team_id", id)
    .single();

  if (!team) notFound();

  const { data: members } = await supabase
    .from("team_members")
    .select("team_member_id, roster_role, platform, is_confirmed")
    .eq("team_id", id)
    .eq("is_active", true);

  const isCaptain = currentUser?.user_id === team.captain_user_id;

  return (
    <div className="flex flex-1 flex-col gap-6 px-6 py-12">
      <div>
        <h1 className="text-2xl font-semibold">{team.team_name}</h1>
        <p className="text-sm text-zinc-500">
          {team.division} division &middot; {team.status}
        </p>
      </div>

      {isCaptain && (
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/teams/${team.team_id}/roster`}
            className="flex h-10 items-center rounded-full bg-foreground px-4 text-sm font-medium text-background"
          >
            Manage Roster
          </Link>
          <Link
            href={`/teams/${team.team_id}/register`}
            className="flex h-10 items-center rounded-full border border-zinc-300 px-4 text-sm font-medium dark:border-zinc-700"
          >
            Register for a Tournament
          </Link>
          <Link
            href={`/teams/${team.team_id}/entries`}
            className="flex h-10 items-center rounded-full border border-zinc-300 px-4 text-sm font-medium dark:border-zinc-700"
          >
            View Entries
          </Link>
        </div>
      )}

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
