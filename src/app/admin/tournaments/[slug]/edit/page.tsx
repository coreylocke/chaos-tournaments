import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import EditTournamentForm from "@/components/EditTournamentForm";
import GenerateBracketButton from "@/components/GenerateBracketButton";
import RegistrationReviewRow from "@/components/RegistrationReviewRow";
import { isCurrentUserAdmin } from "@/lib/actions/admin";
import { createAdminClient } from "@/lib/supabase/server";

const REGISTRATION_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  awaiting_roster: "Awaiting full roster",
  awaiting_entry_funding: "Awaiting entry funding",
  partially_funded: "Partially funded",
  fully_funded: "Fully funded",
  pending_review: "Pending review",
  approved: "Approved",
  checked_in: "Checked in",
  seeded: "Seeded",
  active: "Active",
  eliminated: "Eliminated",
  winner: "Winner",
  runner_up: "Runner-up",
  disqualified: "Disqualified",
  withdrawn: "Withdrawn / rejected",
  refund_pending: "Refund pending",
  refunded: "Refunded",
  payment_review: "Payment review",
};

export default async function EditTournamentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  if (!(await isCurrentUserAdmin())) {
    redirect("/dashboard");
  }

  const admin = createAdminClient();
  const { data: tournament } = await admin
    .from("tournaments")
    .select(
      "tournament_id, name, slug, description, division, required_starting_players, entry_fee_per_starting_slot, first_place_prize, second_place_prize, third_place_prize, starts_at, status, updated_at"
    )
    .eq("slug", slug)
    .maybeSingle();

  if (!tournament) {
    notFound();
  }

  const { data: registrations } = await admin
    .from("tournament_registrations")
    .select("registration_id, registration_status, teams(team_name, team_slug)")
    .eq("tournament_id", tournament.tournament_id)
    .order("created_at", { ascending: true });

  const { count: matchCount } = await admin
    .from("matches")
    .select("match_id", { count: "exact", head: true })
    .eq("tournament_id", tournament.tournament_id);

  const approvedCount = (registrations ?? []).filter((r) => r.registration_status === "approved").length;

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <div className="mb-2 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight text-chaos-white md:text-4xl">
          {tournament.name}
        </h1>
        <span className="rounded-full border border-chaos-gold/40 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-chaos-gold">
          {tournament.division === "pc" ? "PC" : "Console"}
        </span>
      </div>
      <p className="mb-10 text-sm text-chaos-white/50">/tournaments/{tournament.slug}</p>

      {/* Keyed on updated_at so the form remounts (and its uncontrolled inputs' defaultValue
          re-applies) after a successful save — otherwise a saved status change wouldn't
          visually reflect until a manual page reload, even though the DB write succeeded. */}
      <EditTournamentForm key={tournament.updated_at} tournament={tournament} />

      <h2 className="mb-4 mt-12 font-display text-xl font-bold uppercase tracking-tight text-chaos-white">
        Registrations ({registrations?.length ?? 0})
      </h2>

      {!registrations || registrations.length === 0 ? (
        <p className="text-chaos-white/60">No teams registered yet.</p>
      ) : (
        <ul className="divide-y divide-chaos-white/10 rounded-lg border border-chaos-white/10 bg-chaos-charcoal">
          {registrations.map((reg) => {
            const team = Array.isArray(reg.teams) ? reg.teams[0] : reg.teams;
            return (
              <RegistrationReviewRow
                key={reg.registration_id}
                registrationId={reg.registration_id}
                tournamentSlug={slug}
                teamName={team?.team_name ?? "Unknown team"}
                statusLabel={REGISTRATION_STATUS_LABELS[reg.registration_status] ?? reg.registration_status}
                canReview={reg.registration_status === "pending_review"}
              />
            );
          })}
        </ul>
      )}

      <h2 className="mb-4 mt-12 font-display text-xl font-bold uppercase tracking-tight text-chaos-white">
        Bracket
      </h2>

      {matchCount && matchCount > 0 ? (
        <p className="text-chaos-white/60">
          Bracket already generated —{" "}
          <Link href={`/tournaments/${slug}/bracket`} className="font-semibold text-chaos-gold hover:underline">
            view and report results
          </Link>
          .
        </p>
      ) : approvedCount >= 2 ? (
        <div className="rounded-lg border border-chaos-gold/20 bg-chaos-charcoal p-5">
          <p className="mb-4 text-sm text-chaos-white/60">
            {approvedCount} team{approvedCount === 1 ? "" : "s"} approved. Generating locks in seeding by
            registration order — do this once all approvals are done.
          </p>
          <GenerateBracketButton tournamentId={tournament.tournament_id} tournamentSlug={slug} />
        </div>
      ) : (
        <p className="text-chaos-white/60">
          Need at least 2 approved registrations before a bracket can be generated (currently {approvedCount}).
        </p>
      )}
    </div>
  );
}
