import { createServiceRoleClient } from "@/lib/supabase/server";
import { approvePayoutAction, markPayoutPaidAction } from "./actions";

export default async function AdminPayoutsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = createServiceRoleClient();

  const { data: payouts } = await supabase
    .from("payouts")
    .select(
      "payout_id, total_amount_cents, status, created_at, users!payouts_recipient_user_id_fkey(email), prize_allocations(placement, tournaments(name))"
    )
    .in("status", ["pending_review", "approved"])
    .order("created_at", { ascending: true });

  return (
    <div className="flex flex-1 flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-semibold">Payouts</h1>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      {!payouts?.length && <p className="text-sm text-zinc-500">No payouts awaiting review.</p>}

      <ul className="flex flex-col gap-2">
        {payouts?.map((payout) => {
          const recipientEmail = (payout.users as unknown as { email: string | null } | null)?.email;
          const allocation = payout.prize_allocations as unknown as {
            placement: number;
            tournaments: { name: string } | null;
          } | null;
          const placementLabel = allocation?.placement === 1 ? "1st place" : "2nd place";

          return (
            <li
              key={payout.payout_id}
              className="flex flex-col gap-2 rounded-lg border border-zinc-200 px-4 py-3 text-sm dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium">
                  {recipientEmail ?? "Unknown recipient"} &middot; $
                  {(payout.total_amount_cents / 100).toFixed(2)}
                </p>
                <p className="text-xs text-zinc-500">
                  {allocation?.tournaments?.name} &middot; {placementLabel} &middot; status:{" "}
                  {payout.status.replace(/_/g, " ")}
                </p>
              </div>
              <div className="flex gap-2">
                {payout.status === "pending_review" && (
                  <form action={approvePayoutAction}>
                    <input type="hidden" name="payout_id" value={payout.payout_id} />
                    <button
                      type="submit"
                      className="h-9 rounded-full bg-foreground px-3 text-xs font-medium text-background"
                    >
                      Approve
                    </button>
                  </form>
                )}
                {payout.status === "approved" && (
                  <form action={markPayoutPaidAction}>
                    <input type="hidden" name="payout_id" value={payout.payout_id} />
                    <button
                      type="submit"
                      className="h-9 rounded-full border border-zinc-300 px-3 text-xs font-medium dark:border-zinc-700"
                    >
                      Mark paid
                    </button>
                  </form>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
