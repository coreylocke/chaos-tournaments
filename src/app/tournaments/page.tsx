import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  open: "Open for registration",
  closed: "Registration closed",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default async function TournamentsPage() {
  const supabase = await createClient();
  const [{ data: tournaments }, { data: auth }] = await Promise.all([
    supabase
      .from("tournaments")
      .select("tournament_id, name, slug, division, status, entry_fee_per_starting_slot, starts_at")
      .order("starts_at", { ascending: true, nullsFirst: false }),
    supabase.auth.getUser(),
  ]);

  let isAdmin = false;
  if (auth.user) {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("is_admin")
      .eq("user_id", auth.user.id)
      .maybeSingle();
    isAdmin = Boolean(profile?.is_admin);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight text-chaos-white md:text-4xl">
          Tournaments
        </h1>
        {isAdmin && (
          <Link
            href="/admin/tournaments/new"
            className="touch-target rounded-md bg-chaos-gold px-6 py-2 text-sm font-bold text-chaos-black transition hover:shadow-gold-glow"
          >
            + Create tournament
          </Link>
        )}
      </div>

      {!tournaments || tournaments.length === 0 ? (
        <p className="text-chaos-white/60">No tournaments have been created yet.</p>
      ) : (
        <ul className="grid gap-3">
          {tournaments.map((t) => (
            <li key={t.tournament_id}>
              <Link
                href={`/tournaments/${t.slug}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-chaos-white/10 bg-chaos-charcoal px-5 py-4 transition hover:border-chaos-gold/50"
              >
                <div>
                  <p className="font-display text-lg font-bold text-chaos-white">{t.name}</p>
                  <p className="mt-1 text-xs uppercase tracking-wide text-chaos-white/50">
                    {t.division === "pc" ? "PC" : "Console"} ·{" "}
                    {t.entry_fee_per_starting_slot > 0 ? `$${t.entry_fee_per_starting_slot}/slot` : "Free entry"}
                  </p>
                </div>
                <span className="rounded-full border border-chaos-gold/40 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-chaos-gold">
                  {STATUS_LABELS[t.status] ?? t.status}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
