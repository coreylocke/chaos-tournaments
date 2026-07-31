import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { InviteForm } from "./InviteForm";
import { updateMemberAction } from "./actions";

export default async function TeamRosterPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/teams/${id}/roster`);

  const supabase = createServiceRoleClient();

  const { data: team } = await supabase
    .from("teams")
    .select("team_id, team_name, division, captain_user_id")
    .eq("team_id", id)
    .single();
  if (!team) notFound();
  if (team.captain_user_id !== user!.user_id) redirect(`/teams/${id}`);

  const { data: members } = await supabase
    .from("team_members")
    .select("team_member_id, roster_role, platform, is_confirmed")
    .eq("team_id", id)
    .eq("is_active", true)
    .order("roster_role");

  const { data: invitations } = await supabase
    .from("team_invitations")
    .select("invitation_id, roster_role, platform, status, invited_user_id")
    .eq("team_id", id)
    .eq("status", "pending");

  const invitedUserIds = (invitations ?? []).map((i) => i.invited_user_id);
  const { data: invitedAccounts } = invitedUserIds.length
    ? await supabase
        .from("discord_accounts")
        .select("user_id, discord_username")
        .in("user_id", invitedUserIds)
    : { data: [] as { user_id: string; discord_username: string }[] };

  const usernameByUserId = new Map(
    (invitedAccounts ?? []).map((a) => [a.user_id, a.discord_username])
  );

  return (
    <div className="flex flex-1 flex-col gap-8 px-6 py-12">
      <div>
        <h1 className="text-2xl font-semibold">{team.team_name} — Roster</h1>
        <p className="text-sm text-zinc-500">{team.division} division</p>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      <div>
        <h2 className="mb-2 text-lg font-medium">Current roster</h2>
        <ul className="flex flex-col gap-2">
          {members?.map((member) => (
            <li
              key={member.team_member_id}
              className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 px-4 py-3 text-sm dark:border-zinc-800"
            >
              <span className="capitalize">{member.roster_role}</span>
              <span className="text-zinc-500">{member.platform}</span>
              <form action={updateMemberAction}>
                <input type="hidden" name="team_id" value={id} />
                <input type="hidden" name="team_member_id" value={member.team_member_id} />
                <input type="hidden" name="remove" value="true" />
                <button
                  type="submit"
                  className="text-xs font-medium text-red-600 dark:text-red-400"
                >
                  Remove
                </button>
              </form>
            </li>
          ))}
        </ul>
      </div>

      {!!invitations?.length && (
        <div>
          <h2 className="mb-2 text-lg font-medium">Pending invitations</h2>
          <ul className="flex flex-col gap-2">
            {invitations.map((inv) => (
              <li
                key={inv.invitation_id}
                className="flex items-center justify-between rounded-lg border border-zinc-200 px-4 py-3 text-sm dark:border-zinc-800"
              >
                <span>
                  {usernameByUserId.get(inv.invited_user_id) ?? "Unknown user"}
                </span>
                <span className="capitalize text-zinc-500">
                  {inv.roster_role} &middot; {inv.platform}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <h2 className="mb-2 text-lg font-medium">Invite a player</h2>
        <InviteForm teamId={id} />
      </div>
    </div>
  );
}
