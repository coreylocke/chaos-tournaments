import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { createClient } from "@/lib/supabase/server";
import { EntryPaymentForm } from "./EntryPaymentForm";
import { acceptRulesAction, checkInAction } from "./actions";

export default async function TeamEntriesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/teams/${id}/entries`);

  const supabase = await createClient();

  const { data: team } = await supabase
    .from("teams")
    .select("team_id, team_name, captain_user_id")
    .eq("team_id", id)
    .single();
  if (!team) notFound();
  if (team.captain_user_id !== user!.user_id) redirect(`/teams/${id}`);

  const { data: registrations } = await supabase
    .from("tournament_registrations")
    .select(
      "registration_id, funding_status, rules_accepted_at, checked_in_at, tournaments(tournament_id, name, check_in_open_at, check_in_close_at)"
    )
    .eq("team_id", id);

  const registrationIds = (registrations ?? []).map((r) => r.registration_id);
  const { data: slots } = registrationIds.length
    ? await supabase
        .from("registration_entry_slots")
        .select("entry_slot_id, registration_id, slot_number, payment_status, entry_fee_amount_cents")
        .in("registration_id", registrationIds)
        .order("slot_number")
    : { data: [] as Array<{
        entry_slot_id: string;
        registration_id: string;
        slot_number: number;
        payment_status: string;
        entry_fee_amount_cents: number;
      }> };

  const tournamentIds = (registrations ?? [])
    .map((r) => (r.tournaments as unknown as { tournament_id: string } | null)?.tournament_id)
    .filter((v): v is string => !!v);
  const { data: rulesRows } = tournamentIds.length
    ? await supabase
        .from("tournament_rules")
        .select("tournament_id, body")
        .in("tournament_id", tournamentIds)
    : { data: [] as Array<{ tournament_id: string; body: string }> };
  const rulesByTournamentId = new Map((rulesRows ?? []).map((r) => [r.tournament_id, r.body]));

  return (
    <div className="flex flex-1 flex-col gap-8 px-6 py-12">
      <div>
        <h1 className="text-2xl font-semibold">{team.team_name} — Entries</h1>
        <p className="text-sm text-zinc-500">
          Pay for unpaid entries below, for yourself or on behalf of teammates.
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      {!registrations?.length && (
        <p className="text-sm text-zinc-500">No tournament registrations yet.</p>
      )}

      {registrations?.map((reg) => {
        const tournament = reg.tournaments as unknown as {
          tournament_id: string;
          name: string;
        } | null;
        const regSlots = (slots ?? []).filter(
          (s) => s.registration_id === reg.registration_id
        );
        const unpaidSlots = regSlots.filter((s) => s.payment_status === "unpaid");
        const rulesBody = tournament ? rulesByTournamentId.get(tournament.tournament_id) : undefined;

        return (
          <div key={reg.registration_id} className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">{tournament?.name}</h2>
              <span className="text-xs capitalize text-zinc-500">
                {reg.funding_status.replace(/_/g, " ")}
              </span>
            </div>
            <ul className="flex flex-col gap-2">
              {regSlots.map((slot) => (
                <li
                  key={slot.entry_slot_id}
                  className="flex items-center justify-between rounded-lg border border-zinc-200 px-4 py-3 text-sm dark:border-zinc-800"
                >
                  <span>Entry {slot.slot_number}</span>
                  <span>${(slot.entry_fee_amount_cents / 100).toFixed(2)}</span>
                  <span
                    className={
                      slot.payment_status === "paid"
                        ? "font-medium text-green-600 dark:text-green-400"
                        : "text-zinc-500"
                    }
                  >
                    {slot.payment_status.replace(/_/g, " ")}
                  </span>
                </li>
              ))}
            </ul>

            {unpaidSlots.length > 0 && (
              <EntryPaymentForm teamId={id} unpaidSlots={unpaidSlots} />
            )}

            {reg.funding_status === "fully_funded" && (
              <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                <p className="text-sm font-medium">Rules &amp; check-in</p>
                {rulesBody && (
                  <p className="whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-400">
                    {rulesBody}
                  </p>
                )}
                {!reg.rules_accepted_at ? (
                  <form action={acceptRulesAction}>
                    <input type="hidden" name="team_id" value={id} />
                    <input type="hidden" name="registration_id" value={reg.registration_id} />
                    <button
                      type="submit"
                      className="h-10 rounded-full bg-foreground px-4 text-sm font-medium text-background"
                    >
                      Accept rules
                    </button>
                  </form>
                ) : !reg.checked_in_at ? (
                  <form action={checkInAction}>
                    <input type="hidden" name="team_id" value={id} />
                    <input type="hidden" name="registration_id" value={reg.registration_id} />
                    <button
                      type="submit"
                      className="h-10 rounded-full bg-foreground px-4 text-sm font-medium text-background"
                    >
                      Check in
                    </button>
                  </form>
                ) : (
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Checked in
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
