import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { createClient } from "@/lib/supabase/server";

export default async function TeamEntriesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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
    .select("registration_id, funding_status, tournaments(name)")
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

  return (
    <div className="flex flex-1 flex-col gap-8 px-6 py-12">
      <div>
        <h1 className="text-2xl font-semibold">{team.team_name} — Entries</h1>
        <p className="text-sm text-zinc-500">
          Entry funding status per tournament registration. Payment isn&apos;t available yet.
        </p>
      </div>

      {!registrations?.length && (
        <p className="text-sm text-zinc-500">No tournament registrations yet.</p>
      )}

      {registrations?.map((reg) => {
        const tournamentName = (
          reg.tournaments as unknown as { name: string } | null
        )?.name;
        const regSlots = (slots ?? []).filter(
          (s) => s.registration_id === reg.registration_id
        );

        return (
          <div key={reg.registration_id}>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-lg font-medium">{tournamentName}</h2>
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
                    {slot.payment_status}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
