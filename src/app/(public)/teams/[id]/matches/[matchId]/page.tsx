import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { maybeAutoConfirm } from "@/services/matchAdvancementService";
import { SubmitResultForm } from "./SubmitResultForm";
import { confirmResultAction, disputeResultAction } from "./actions";

export default async function TeamMatchPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; matchId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id, matchId } = await params;
  const { error } = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/teams/${id}/matches/${matchId}`);

  const anon = await createClient();

  const { data: team } = await anon
    .from("teams")
    .select("team_id, team_name, captain_user_id")
    .eq("team_id", id)
    .single();
  if (!team) notFound();
  if (team.captain_user_id !== user!.user_id) redirect(`/teams/${id}`);

  await maybeAutoConfirm(matchId);

  const supabase = createServiceRoleClient();
  const { data: match } = await supabase
    .from("matches")
    .select(
      "match_id, round_name, team_1_id, team_2_id, winner_team_id, status, dispute_status, result_type"
    )
    .eq("match_id", matchId)
    .single();
  if (!match) notFound();
  if (match.team_1_id !== id && match.team_2_id !== id) redirect(`/teams/${id}`);

  const opponentId = match.team_1_id === id ? match.team_2_id : match.team_1_id;
  const { data: opponent } = opponentId
    ? await supabase.from("teams").select("team_name").eq("team_id", opponentId).single()
    : { data: null };

  const { data: latestResult } = await supabase
    .from("match_results")
    .select("submitted_by_user_id, series_score")
    .eq("match_id", matchId)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let submitterIsMe = false;
  if (latestResult) {
    const { data: submitter } = await supabase
      .from("users")
      .select("user_id")
      .eq("user_id", latestResult.submitted_by_user_id)
      .single();
    submitterIsMe = submitter?.user_id === user!.user_id;
  }

  const { data: dispute } =
    match.status === "disputed"
      ? await supabase
          .from("disputes")
          .select("reason, description, status")
          .eq("match_id", matchId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      : { data: null };

  return (
    <div className="flex flex-1 flex-col gap-6 px-6 py-12">
      <div>
        <h1 className="text-2xl font-semibold">
          {team.team_name} vs {opponent?.team_name ?? "TBD"}
        </h1>
        <p className="text-sm text-zinc-500">{match.round_name}</p>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      {match.status === "ready" && opponentId && (
        <SubmitResultForm
          teamId={id}
          matchId={matchId}
          myTeam={{ id, name: team.team_name }}
          opponentTeam={{ id: opponentId, name: opponent?.team_name ?? "Opponent" }}
        />
      )}

      {match.status === "pending" && (
        <p className="text-sm text-zinc-500">Waiting on the previous round to finish.</p>
      )}

      {match.status === "awaiting_confirmation" && latestResult && (
        <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <p className="text-sm">
            Reported score: <span className="font-medium">{latestResult.series_score}</span>,
            winner:{" "}
            <span className="font-medium">
              {match.winner_team_id === id ? team.team_name : opponent?.team_name}
            </span>
          </p>
          {submitterIsMe ? (
            <p className="text-sm text-zinc-500">
              Waiting for {opponent?.team_name} to confirm or dispute this result.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              <form action={confirmResultAction}>
                <input type="hidden" name="team_id" value={id} />
                <input type="hidden" name="match_id" value={matchId} />
                <button
                  type="submit"
                  className="h-11 rounded-full bg-foreground px-5 text-sm font-medium text-background"
                >
                  Confirm result
                </button>
              </form>
              <form action={disputeResultAction} className="flex flex-col gap-2">
                <input type="hidden" name="team_id" value={id} />
                <input type="hidden" name="match_id" value={matchId} />
                <input
                  name="reason"
                  placeholder="Dispute reason"
                  required
                  className="h-11 rounded-lg border border-zinc-300 px-4 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                />
                <textarea
                  name="description"
                  placeholder="Details (optional)"
                  rows={3}
                  className="rounded-lg border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                />
                <button
                  type="submit"
                  className="h-11 w-fit rounded-full border border-red-300 px-5 text-sm font-medium text-red-600 dark:border-red-800 dark:text-red-400"
                >
                  Dispute this result
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {match.status === "disputed" && (
        <div className="rounded-lg border border-red-200 p-4 text-sm dark:border-red-900">
          <p className="font-medium text-red-700 dark:text-red-400">Dispute open</p>
          {dispute && <p className="mt-1 text-zinc-600 dark:text-zinc-400">{dispute.reason}</p>}
          <p className="mt-1 text-xs text-zinc-500">An admin will review and resolve this.</p>
        </div>
      )}

      {match.status === "completed" && (
        <p className="text-sm">
          <span className="font-medium text-green-600 dark:text-green-400">
            {match.winner_team_id === id ? team.team_name : opponent?.team_name} won
          </span>
          {match.result_type && match.result_type !== "normal" && ` (${match.result_type})`}
        </p>
      )}

      {match.status === "voided" && (
        <p className="text-sm text-zinc-500">This match was voided by an admin.</p>
      )}
    </div>
  );
}
