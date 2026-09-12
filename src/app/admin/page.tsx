import Link from "next/link";
import { redirect } from "next/navigation";
import { isCurrentUserAdmin } from "@/lib/actions/admin";
import { createAdminClient } from "@/lib/supabase/server";

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  open: "Open",
  closed: "Closed",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default async function AdminHubPage() {
  if (!(await isCurrentUserAdmin())) {
    redirect("/dashboard");
  }

  // Service-role read here — admins need to see draft tournaments too, which the public
  // RLS-scoped client would also return (tournaments are readable by everyone), but using
  // the admin client keeps this page consistent with the mutations below.
  const admin = createAdminClient();
  const { data: tournaments } = await admin
    .from("tournaments")
    .select("tournament_id, name, slug, status, division")
    .order("created_at", { ascending: false });

  const { data: pendingRegistrations } = await admin
    .from("tournament_registrations")
    .select("registration_id, tournaments(slug, name)")
    .eq("registration_status", "pending_review");

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight text-chaos-white md:text-4xl">
          Admin
        </h1>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/settings"
            className="touch-target rounded-md border border-chaos-white/20 px-6 py-2 text-sm font-bold text-chaos-white/80 transition hover:border-chaos-white/50 hover:text-chaos-white"
          >
            Payment settings
          </Link>
          <Link
            href="/admin/tournaments/new"
            className="touch-target rounded-md bg-chaos-gold px-6 py-2 text-sm font-bold text-chaos-black transition hover:shadow-gold-glow"
          >
            + New tournament
          </Link>
        </div>
      </div>

      {pendingRegistrations && pendingRegistrations.length > 0 && (
        <p className="mb-6 rounded-md border border-chaos-gold/40 bg-chaos-gold/10 px-4 py-3 text-sm text-chaos-gold">
          {pendingRegistrations.length} registration{pendingRegistrations.length === 1 ? "" : "s"} waiting on review.
        </p>
      )}

      <h2 className="mb-4 font-display text-xl font-bold uppercase tracking-tight text-chaos-white">Tournaments</h2>

      {!tournaments || tournaments.length === 0 ? (
        <p className="text-chaos-white/60">No tournaments yet.</p>
      ) : (
        <ul className="divide-y divide-chaos-white/10 rounded-lg border border-chaos-white/10 bg-chaos-charcoal">
          {tournaments.map((t) => (
            <li key={t.tournament_id}>
              <Link
                href={`/admin/tournaments/${t.slug}/edit`}
                className="flex items-center justify-between px-5 py-4 transition hover:bg-black/20"
              >
                <div>
                  <p className="text-sm font-semibold text-chaos-white">{t.name}</p>
                  <p className="text-xs uppercase tracking-wide text-chaos-white/50">
                    {t.division === "pc" ? "PC" : "Console"}
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
