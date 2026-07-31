import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { createClient } from "@/lib/supabase/server";
import { respondToInvitationAction } from "./actions";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/dashboard");
  }

  const supabase = await createClient();
  const { data: invitations } = await supabase
    .from("team_invitations")
    .select("invitation_id, roster_role, platform, teams(team_name)")
    .eq("invited_user_id", user!.user_id)
    .eq("status", "pending");

  return (
    <div className="flex flex-1 flex-col gap-8 px-6 py-12">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-zinc-500">
          Signed in as {user!.email ?? user!.user_id}. Player, captain,
          sponsor, payments, and payouts views arrive in later phases.
        </p>
      </div>

      {!!invitations?.length && (
        <div>
          <h2 className="mb-2 text-lg font-medium">Pending invitations</h2>
          <ul className="flex flex-col gap-2">
            {invitations.map((inv) => {
              const teamName = (
                inv.teams as unknown as { team_name: string } | null
              )?.team_name;
              return (
                <li
                  key={inv.invitation_id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 px-4 py-3 text-sm dark:border-zinc-800"
                >
                  <div>
                    <p className="font-medium">{teamName}</p>
                    <p className="capitalize text-zinc-500">
                      {inv.roster_role} &middot; {inv.platform}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <form action={respondToInvitationAction}>
                      <input type="hidden" name="invitation_id" value={inv.invitation_id} />
                      <input type="hidden" name="accept" value="true" />
                      <button
                        type="submit"
                        className="h-9 rounded-full bg-foreground px-3 text-xs font-medium text-background"
                      >
                        Accept
                      </button>
                    </form>
                    <form action={respondToInvitationAction}>
                      <input type="hidden" name="invitation_id" value={inv.invitation_id} />
                      <input type="hidden" name="accept" value="false" />
                      <button
                        type="submit"
                        className="h-9 rounded-full border border-zinc-300 px-3 text-xs font-medium dark:border-zinc-700"
                      >
                        Decline
                      </button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
