import { createServiceRoleClient } from "@/lib/supabase/server";
import { setRegistrationStatusAction } from "./actions";

export default async function AdminRegistrationsPage() {
  const supabase = createServiceRoleClient();
  const { data: registrations } = await supabase
    .from("tournament_registrations")
    .select(
      "registration_id, status, funding_status, checked_in_at, rules_accepted_at, teams(team_name), tournaments(name)"
    )
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-1 flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-semibold">Registrations</h1>

      {!registrations?.length && (
        <p className="text-sm text-zinc-500">No registrations yet.</p>
      )}

      <ul className="flex flex-col gap-2">
        {registrations?.map((reg) => {
          const teamName = (reg.teams as unknown as { team_name: string } | null)?.team_name;
          const tournamentName = (reg.tournaments as unknown as { name: string } | null)?.name;
          return (
            <li
              key={reg.registration_id}
              className="flex flex-col gap-2 rounded-lg border border-zinc-200 px-4 py-3 text-sm dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium">
                  {teamName} &middot; {tournamentName}
                </p>
                <p className="text-xs text-zinc-500">
                  {reg.funding_status.replace(/_/g, " ")} &middot;{" "}
                  {reg.rules_accepted_at ? "rules accepted" : "rules pending"} &middot;{" "}
                  {reg.checked_in_at ? "checked in" : "not checked in"} &middot; status:{" "}
                  {reg.status.replace(/_/g, " ")}
                </p>
              </div>
              {reg.status === "pending" && (
                <div className="flex gap-2">
                  <form action={setRegistrationStatusAction}>
                    <input type="hidden" name="registration_id" value={reg.registration_id} />
                    <input type="hidden" name="status" value="approved" />
                    <button
                      type="submit"
                      className="h-9 rounded-full bg-foreground px-3 text-xs font-medium text-background"
                    >
                      Approve
                    </button>
                  </form>
                  <form action={setRegistrationStatusAction}>
                    <input type="hidden" name="registration_id" value={reg.registration_id} />
                    <input type="hidden" name="status" value="rejected" />
                    <button
                      type="submit"
                      className="h-9 rounded-full border border-zinc-300 px-3 text-xs font-medium dark:border-zinc-700"
                    >
                      Reject
                    </button>
                  </form>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
