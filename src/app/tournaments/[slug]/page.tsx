import Link from "next/link";
import { notFound } from "next/navigation";
import RegisterTeamForm from "@/components/RegisterTeamForm";
import WithdrawRegistrationButton from "@/components/WithdrawRegistrationButton";
import { createClient } from "@/lib/supabase/server";
import { getPlatformSettings } from "@/lib/actions/settings";

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
  withdrawn: "Withdrawn",
  refund_pending: "Refund pending",
  refunded: "Refunded",
  payment_review: "Payment review",
};

export default async function TournamentDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: tournament } = await supabase
    .from("tournaments")
    .select(
      "tournament_id, name, slug, description, division, format, required_starting_players, entry_fee_per_starting_slot, first_place_prize, second_place_prize, third_place_prize, status, starts_at, registration_open_at, registration_close_at"
    )
    .eq("slug", slug)
    .maybeSingle();

  if (!tournament) {
    notFound();
  }

  const { entry_fee_cents: entryFeeCents } = await getPlatformSettings();

  const { data: registrations } = await supabase
    .from("tournament_registrations")
    .select("registration_id, registration_status, team_id, teams(team_name, team_slug, captain_user_id)")
    .eq("tournament_id", tournament.tournament_id);

  let myTeams: { team_id: string; team_name: string }[] = [];
  if (user) {
    const registeredTeamIds = new Set((registrations ?? []).map((r) => r.team_id));
    const { data: captainedTeams } = await supabase
      .from("teams")
      .select("team_id, team_name, division")
      .eq("captain_user_id", user.id)
      .eq("division", tournament.division);
    myTeams = (captainedTeams ?? []).filter((t) => !registeredTeamIds.has(t.team_id));
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <div className="mb-2 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight text-chaos-white md:text-4xl">
          {tournament.name}
        </h1>
        <span className="rounded-full border border-chaos-gold/40 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-chaos-gold">
          {tournament.division === "pc" ? "PC" : "Console"}
        </span>
        <Link href={`/tournaments/${slug}/bracket`} className="text-sm font-semibold text-chaos-gold hover:underline">
          View bracket →
        </Link>
      </div>

      {tournament.description && <p className="mb-6 text-chaos-white/70">{tournament.description}</p>}

      <dl className="mb-10 grid grid-cols-2 gap-4 rounded-lg border border-chaos-white/10 bg-chaos-charcoal p-5 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-chaos-white/50">Format</dt>
          <dd className="text-chaos-white">{tournament.format.replace(/_/g, " ")}</dd>
        </div>
        <div>
          <dt className="text-chaos-white/50">Starters required</dt>
          <dd className="text-chaos-white">{tournament.required_starting_players}</dd>
        </div>
        <div>
          <dt className="text-chaos-white/50">Entry fee</dt>
          <dd className="text-chaos-white">{entryFeeCents > 0 ? `$${(entryFeeCents / 100).toFixed(2)}/team` : "Free"}</dd>
        </div>
        {tournament.first_place_prize && (
          <div>
            <dt className="text-chaos-white/50">1st place</dt>
            <dd className="text-chaos-white">${tournament.first_place_prize}</dd>
          </div>
        )}
        {tournament.second_place_prize && (
          <div>
            <dt className="text-chaos-white/50">2nd place</dt>
            <dd className="text-chaos-white">${tournament.second_place_prize}</dd>
          </div>
        )}
        {tournament.third_place_prize && (
          <div>
            <dt className="text-chaos-white/50">3rd place</dt>
            <dd className="text-chaos-white">${tournament.third_place_prize}</dd>
          </div>
        )}
      </dl>

      <h2 className="mb-4 font-display text-xl font-bold uppercase tracking-tight text-chaos-white">
        Registered teams ({registrations?.length ?? 0})
      </h2>

      {!registrations || registrations.length === 0 ? (
        <p className="mb-10 text-chaos-white/60">No teams registered yet.</p>
      ) : (
        <ul className="mb-10 divide-y divide-chaos-white/10 rounded-lg border border-chaos-white/10 bg-chaos-charcoal">
          {registrations.map((reg) => {
            const team = Array.isArray(reg.teams) ? reg.teams[0] : reg.teams;
            const isMyRegistration = user?.id === team?.captain_user_id;
            return (
              <li key={reg.registration_id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-semibold text-chaos-white">{team?.team_name}</p>
                  <p className="text-xs uppercase tracking-wide text-chaos-white/50">
                    {REGISTRATION_STATUS_LABELS[reg.registration_status] ?? reg.registration_status}
                  </p>
                </div>
                {isMyRegistration && (
                  <WithdrawRegistrationButton registrationId={reg.registration_id} tournamentSlug={slug} />
                )}
              </li>
            );
          })}
        </ul>
      )}

      {user ? (
        tournament.status === "open" ? (
          <div className="rounded-lg border border-chaos-gold/20 bg-chaos-charcoal p-5">
            <h3 className="mb-4 font-display text-base font-bold uppercase tracking-tight text-chaos-white">
              Register your team
            </h3>
            <RegisterTeamForm tournamentId={tournament.tournament_id} tournamentSlug={slug} teams={myTeams} />
          </div>
        ) : (
          <p className="text-sm text-chaos-white/60">Registration isn&apos;t open for this tournament.</p>
        )
      ) : (
        <p className="text-sm text-chaos-white/60">Log in with Discord to register a team.</p>
      )}
    </div>
  );
}
