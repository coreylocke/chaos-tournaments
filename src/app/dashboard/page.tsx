import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ClaimPayoutButton from "@/components/ClaimPayoutButton";

/**
 * Real dashboard — confirms the Discord login round-trip works (session + user_profiles
 * row via handle_new_user()), and surfaces the user's teams as the entry point into
 * Phase 2 (team/roster management, tournament registration).
 */
export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: profile }, { data: captainedTeams }, { data: memberOfTeams }, { data: pendingPayouts }] =
    await Promise.all([
      supabase
        .from("user_profiles")
        .select("discord_username, discord_display_name, discord_avatar_url, is_admin, created_at")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase.from("teams").select("team_id, team_name, team_slug, division").eq("captain_user_id", user.id),
      supabase
        .from("team_members")
        .select("teams(team_id, team_name, team_slug, division, captain_user_id)")
        .eq("user_id", user.id)
        .eq("is_active", true),
      supabase
        .from("tournament_payouts")
        .select("payout_id, amount_cents, placement, status, tournaments(name)")
        .eq("recipient_user_id", user.id)
        .in("status", ["awaiting_onboarding", "ready"]),
    ]);

  const captainedIds = new Set((captainedTeams ?? []).map((t) => t.team_id));
  const memberTeams = (memberOfTeams ?? [])
    .map((m) => (Array.isArray(m.teams) ? m.teams[0] : m.teams))
    .filter((t): t is NonNullable<typeof t> => Boolean(t) && !captainedIds.has(t.team_id));

  const allTeams = [...(captainedTeams ?? []).map((t) => ({ ...t, isCaptain: true })), ...memberTeams.map((t) => ({ ...t, isCaptain: false }))];

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      {profile?.discord_avatar_url && (
        <Image
          src={profile.discord_avatar_url}
          alt={profile.discord_display_name ?? profile.discord_username ?? "Discord avatar"}
          width={72}
          height={72}
          className="mx-auto rounded-full ring-2 ring-chaos-gold/60"
          unoptimized
        />
      )}
      <h1 className="mt-6 font-display text-3xl font-extrabold uppercase tracking-tight text-chaos-white md:text-4xl">
        Welcome, {profile?.discord_display_name ?? profile?.discord_username ?? "Chaos"}
      </h1>

      {!profile && (
        <p className="mt-4 text-sm text-red-400">
          Signed in, but no user_profiles row was found yet — the handle_new_user() trigger
          may not have fired.
        </p>
      )}

      {pendingPayouts && pendingPayouts.length > 0 && (
        <div className="mt-10 rounded-lg border border-chaos-gold/40 bg-chaos-gold/10 p-6 text-left">
          <h2 className="mb-3 font-display text-xl font-bold uppercase tracking-tight text-chaos-gold">
            Prize payout waiting on you
          </h2>
          <ul className="mb-4 space-y-2">
            {pendingPayouts.map((payout) => {
              const tournament = Array.isArray(payout.tournaments) ? payout.tournaments[0] : payout.tournaments;
              return (
                <li key={payout.payout_id} className="text-sm text-chaos-white">
                  ${(payout.amount_cents / 100).toFixed(2)} — {payout.placement === "winner" ? "1st place" : "2nd place"} in{" "}
                  {tournament?.name ?? "a tournament"}
                </li>
              );
            })}
          </ul>
          <p className="mb-4 text-sm text-chaos-white/70">
            Link a bank account via Stripe to receive this. It pays out automatically as soon as onboarding is
            complete.
          </p>
          <ClaimPayoutButton />
        </div>
      )}

      <div className="mt-12 text-left">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold uppercase tracking-tight text-chaos-white">Your teams</h2>
          <Link href="/teams/new" className="text-sm font-semibold text-chaos-gold hover:underline">
            + Create a team
          </Link>
        </div>

        {allTeams.length === 0 ? (
          <div className="rounded-lg border border-chaos-white/10 bg-chaos-charcoal p-6 text-center">
            <p className="text-chaos-white/60">
              You&apos;re not on a team yet. Create one to start registering for tournaments.
            </p>
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {allTeams.map((team) => (
              <li key={team.team_id}>
                <Link
                  href={`/teams/${team.team_slug}`}
                  className="block rounded-lg border border-chaos-white/10 bg-chaos-charcoal px-5 py-4 transition hover:border-chaos-gold/50"
                >
                  <p className="font-display text-lg font-bold text-chaos-white">{team.team_name}</p>
                  <p className="mt-1 text-xs uppercase tracking-wide text-chaos-gold">
                    {team.division === "pc" ? "PC" : "Console"} · {team.isCaptain ? "Captain" : "Member"}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Link
          href="/tournaments"
          className="touch-target inline-flex items-center justify-center rounded-md border border-chaos-gold px-6 py-2 text-sm font-bold text-chaos-gold transition hover:bg-chaos-gold hover:text-chaos-black"
        >
          Browse tournaments
        </Link>
        {profile?.is_admin && (
          <Link
            href="/admin"
            className="touch-target inline-flex items-center justify-center rounded-md border border-chaos-white/20 px-6 py-2 text-sm font-bold text-chaos-white/80 transition hover:border-chaos-white/50 hover:text-chaos-white"
          >
            Admin
          </Link>
        )}
      </div>
    </div>
  );
}
