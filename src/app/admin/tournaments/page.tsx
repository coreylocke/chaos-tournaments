import Link from "next/link";
import { createServiceRoleClient } from "@/lib/supabase/server";

export default async function AdminTournamentsPage() {
  const supabase = createServiceRoleClient();
  const { data: tournaments } = await supabase
    .from("tournaments")
    .select("tournament_id, name, division, status")
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-1 flex-col gap-6 px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Tournaments</h1>
        <Link
          href="/admin/tournaments/create"
          className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          Create tournament
        </Link>
      </div>

      {!tournaments?.length && (
        <p className="text-sm text-zinc-500">No tournaments yet.</p>
      )}

      <ul className="flex flex-col gap-2">
        {tournaments?.map((t) => (
          <li key={t.tournament_id}>
            <Link
              href={`/admin/tournaments/${t.tournament_id}`}
              className="flex items-center justify-between rounded-lg border border-zinc-200 px-4 py-3 dark:border-zinc-800"
            >
              <span>{t.name}</span>
              <span className="text-xs text-zinc-500">
                {t.division} &middot; {t.status}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
