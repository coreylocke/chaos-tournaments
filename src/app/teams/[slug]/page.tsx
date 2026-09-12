import Image from "next/image";
import { notFound } from "next/navigation";
import AddTeamMemberForm from "@/components/AddTeamMemberForm";
import RemoveMemberButton from "@/components/RemoveMemberButton";
import { createClient } from "@/lib/supabase/server";

const ROLE_LABELS: Record<string, string> = {
  starter: "Starter",
  substitute: "Substitute",
  reserve: "Reserve",
  coach: "Coach",
  manager: "Manager",
};

export default async function TeamDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: team } = await supabase
    .from("teams")
    .select(
      "team_id, team_name, team_slug, division, status, captain_user_id, user_profiles!teams_captain_user_id_fkey(discord_username, discord_display_name)"
    )
    .eq("team_slug", slug)
    .maybeSingle();

  if (!team) {
    notFound();
  }

  const { data: members } = await supabase
    .from("team_members")
    .select(
      "team_member_id, roster_role, platform, game_username, is_active, user_profiles(discord_username, discord_display_name, discord_avatar_url)"
    )
    .eq("team_id", team.team_id)
    .eq("is_active", true)
    .order("roster_role");

  const isCaptain = user?.id === team.captain_user_id;
  const captainProfile = Array.isArray(team.user_profiles) ? team.user_profiles[0] : team.user_profiles;

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <div className="mb-2 flex items-center gap-3">
        <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight text-chaos-white md:text-4xl">
          {team.team_name}
        </h1>
        <span className="rounded-full border border-chaos-gold/40 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-chaos-gold">
          {team.division === "pc" ? "PC" : "Console"}
        </span>
      </div>
      <p className="mb-10 text-sm text-chaos-white/60">
        Captain: {captainProfile?.discord_display_name ?? captainProfile?.discord_username ?? "Unknown"}
      </p>

      <h2 className="mb-4 font-display text-xl font-bold uppercase tracking-tight text-chaos-white">
        Roster ({members?.length ?? 0})
      </h2>

      {!members || members.length === 0 ? (
        <p className="mb-10 text-chaos-white/60">No roster members yet.</p>
      ) : (
        <ul className="mb-10 divide-y divide-chaos-white/10 rounded-lg border border-chaos-white/10 bg-chaos-charcoal">
          {members.map((member) => {
            const profile = Array.isArray(member.user_profiles) ? member.user_profiles[0] : member.user_profiles;
            return (
              <li key={member.team_member_id} className="flex items-center gap-4 px-5 py-3">
                {profile?.discord_avatar_url && (
                  <Image
                    src={profile.discord_avatar_url}
                    alt=""
                    width={36}
                    height={36}
                    unoptimized
                    className="rounded-full"
                  />
                )}
                <div className="flex-1">
                  <p className="text-sm font-semibold text-chaos-white">
                    {profile?.discord_display_name ?? profile?.discord_username ?? "Unknown"}
                    {member.game_username && (
                      <span className="ml-2 text-xs font-normal text-chaos-white/50">({member.game_username})</span>
                    )}
                  </p>
                  <p className="text-xs uppercase tracking-wide text-chaos-white/50">
                    {ROLE_LABELS[member.roster_role] ?? member.roster_role} · {member.platform.toUpperCase()}
                  </p>
                </div>
                {isCaptain && <RemoveMemberButton teamMemberId={member.team_member_id} teamSlug={slug} />}
              </li>
            );
          })}
        </ul>
      )}

      {isCaptain && (
        <div className="rounded-lg border border-chaos-gold/20 bg-chaos-charcoal p-5">
          <h3 className="mb-4 font-display text-base font-bold uppercase tracking-tight text-chaos-white">
            Add a roster member
          </h3>
          <AddTeamMemberForm teamId={team.team_id} teamSlug={slug} />
        </div>
      )}
    </div>
  );
}
