import "server-only";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { roundToIncrement } from "@/lib/rules/moneyRules";
import { notifyN8n } from "@/services/n8nNotifyService";
import {
  assignTournamentWinnerRoleToTeam,
  assignTournamentRunnerUpRoleToTeam,
  getDiscordUserIdForUser,
} from "@/services/discordService";

type ServiceClient = ReturnType<typeof createServiceRoleClient>;

type PlacementSpec = { placement: 1 | 2; teamId: string; prizeCents: number | null };

// CLAUDE.md Section 17 / brief Section 34-35. Called from
// matchAdvancementService.advanceWinner the moment the championship match
// completes — the same "increment at the natural trigger point" pattern
// used throughout this build. Only first/second place are computed: single
// elimination directly determines a champion and runner-up, but nothing
// determines a 3rd-place team (no 3rd-place decider match exists), so
// third_place_prize_cents, if configured, is not distributed here — see
// CLAUDE.md Section 0.
export async function generatePayoutsForTournament(tournamentId: string, supabase: ServiceClient) {
  // Idempotency guard in addition to completeMatch's own atomic guard —
  // this function should only ever run once per tournament.
  const { data: existingAllocation } = await supabase
    .from("prize_allocations")
    .select("prize_allocation_id")
    .eq("tournament_id", tournamentId)
    .limit(1)
    .maybeSingle();
  if (existingAllocation) return;

  const { data: tournament, error: tournamentError } = await supabase
    .from("tournaments")
    .select("name, required_starting_players, first_place_prize_cents, second_place_prize_cents")
    .eq("tournament_id", tournamentId)
    .single();
  if (tournamentError) throw tournamentError;

  const { data: settings } = await supabase
    .from("tournament_settings")
    .select("prize_rounding_increment_cents, remainder_allocation_rule, remainder_fallback_rule")
    .eq("tournament_id", tournamentId)
    .single();
  const incrementCents = settings?.prize_rounding_increment_cents ?? 500;

  const { data: bracket } = await supabase
    .from("brackets")
    .select("bracket_id")
    .eq("tournament_id", tournamentId)
    .single();
  if (!bracket) return;

  const { data: finalMatch } = await supabase
    .from("matches")
    .select("winner_team_id, loser_team_id, status")
    .eq("bracket_id", bracket.bracket_id)
    .is("next_match_id", null)
    .single();
  if (!finalMatch || finalMatch.status !== "completed" || !finalMatch.winner_team_id) return;

  const placements: PlacementSpec[] = [
    { placement: 1, teamId: finalMatch.winner_team_id, prizeCents: tournament.first_place_prize_cents },
  ];
  if (finalMatch.loser_team_id) {
    placements.push({
      placement: 2,
      teamId: finalMatch.loser_team_id,
      prizeCents: tournament.second_place_prize_cents,
    });
  }

  for (const spec of placements) {
    await allocatePlacement({
      tournamentId,
      requiredStartingPlayers: tournament.required_starting_players,
      incrementCents,
      remainderAllocationRule: settings?.remainder_allocation_rule ?? "captain_funded_entry",
      remainderFallbackRule: settings?.remainder_fallback_rule ?? "earliest_funded_payer",
      spec,
      supabase,
    });
  }

  await bumpTournamentPlacementStats(tournamentId, finalMatch.winner_team_id, finalMatch.loser_team_id, supabase);

  await assignTournamentWinnerRoleToTeam(finalMatch.winner_team_id);
  if (finalMatch.loser_team_id) {
    await assignTournamentRunnerUpRoleToTeam(finalMatch.loser_team_id);
  }

  const { count: payoutCount } = await supabase
    .from("payouts")
    .select("payout_id, prize_allocations!inner(tournament_id)", { count: "exact", head: true })
    .eq("prize_allocations.tournament_id", tournamentId);
  if (payoutCount && payoutCount > 0) {
    await notifyN8n("payout_pending_review", {
      tournament_name: tournament.name,
      payout_count: payoutCount,
    });
  }
}

async function allocatePlacement(args: {
  tournamentId: string;
  requiredStartingPlayers: number;
  incrementCents: number;
  remainderAllocationRule: string;
  remainderFallbackRule: string;
  spec: PlacementSpec;
  supabase: ServiceClient;
}) {
  const { tournamentId, requiredStartingPlayers, incrementCents, spec, supabase } = args;
  if (!spec.prizeCents || spec.prizeCents <= 0 || requiredStartingPlayers <= 0) return;

  const placementPrize = roundToIncrement(spec.prizeCents, incrementCents);
  const entryShareValue = Math.floor(placementPrize / requiredStartingPlayers);
  const remainderCents = placementPrize - entryShareValue * requiredStartingPlayers;

  const { data: allocation, error: allocationError } = await supabase
    .from("prize_allocations")
    .insert({
      tournament_id: tournamentId,
      placement: spec.placement,
      placement_prize_cents: placementPrize,
      entry_share_value_cents: entryShareValue,
    })
    .select()
    .single();
  if (allocationError) throw allocationError;

  const { data: registration } = await supabase
    .from("tournament_registrations")
    .select("registration_id, teams(captain_user_id)")
    .eq("tournament_id", tournamentId)
    .eq("team_id", spec.teamId)
    .single();
  if (!registration) return;
  const captainUserId = (registration.teams as unknown as { captain_user_id: string } | null)
    ?.captain_user_id;

  const { data: slots } = await supabase
    .from("registration_entry_slots")
    .select("entry_slot_id, payout_entitlement_user_id")
    .eq("registration_id", registration.registration_id)
    .eq("payment_status", "paid");
  if (!slots || slots.length === 0) return;

  const entrySlotIds = slots.map((s) => s.entry_slot_id);
  const { data: entitlements } = await supabase
    .from("payout_entitlements")
    .select("entitlement_id, entry_slot_id, holder_user_id")
    .in("entry_slot_id", entrySlotIds);
  const entitlementBySlot = new Map((entitlements ?? []).map((e) => [e.entry_slot_id, e]));

  // Which entry slot gets the remainder: the winning captain's own funded
  // entry if they funded one, else whoever paid earliest among the winning
  // entries (CLAUDE.md Section 7 / brief Section 35).
  let remainderEntitlementId: string | null = null;
  if (remainderCents > 0) {
    const captainOwned = (entitlements ?? []).find((e) => e.holder_user_id === captainUserId);
    if (args.remainderAllocationRule === "captain_funded_entry" && captainOwned) {
      remainderEntitlementId = captainOwned.entitlement_id;
    } else if (args.remainderFallbackRule === "earliest_funded_payer" && entitlements?.length) {
      const { data: allocations } = await supabase
        .from("payment_entry_allocations")
        .select("entry_slot_id, payments(created_at)")
        .in("entry_slot_id", entrySlotIds);
      const earliest = (allocations ?? [])
        .map((a) => ({
          entry_slot_id: a.entry_slot_id,
          created_at: (a.payments as unknown as { created_at: string } | null)?.created_at,
        }))
        .filter((a) => a.created_at)
        .sort((a, b) => (a.created_at! < b.created_at! ? -1 : 1))[0];
      const earliestEntitlement = earliest && entitlementBySlot.get(earliest.entry_slot_id);
      remainderEntitlementId = earliestEntitlement?.entitlement_id ?? entitlements[0].entitlement_id;
    }
  }

  const creditedByHolder = new Map<string, number>();
  const lineItems: Array<{ entitlement_id: string; holder_user_id: string; amount_cents: number }> = [];
  for (const slot of slots) {
    const entitlement = entitlementBySlot.get(slot.entry_slot_id);
    const holderUserId = entitlement?.holder_user_id ?? slot.payout_entitlement_user_id;
    if (!entitlement || !holderUserId) continue;
    const amount = entryShareValue + (entitlement.entitlement_id === remainderEntitlementId ? remainderCents : 0);
    lineItems.push({ entitlement_id: entitlement.entitlement_id, holder_user_id: holderUserId, amount_cents: amount });
    creditedByHolder.set(holderUserId, (creditedByHolder.get(holderUserId) ?? 0) + amount);
  }

  for (const [holderUserId, totalAmountCents] of creditedByHolder) {
    const { data: payout, error: payoutError } = await supabase
      .from("payouts")
      .insert({
        prize_allocation_id: allocation.prize_allocation_id,
        recipient_user_id: holderUserId,
        total_amount_cents: totalAmountCents,
        status: "pending_review",
      })
      .select()
      .single();
    if (payoutError) throw payoutError;

    const holderLineItems = lineItems.filter((li) => li.holder_user_id === holderUserId);
    await supabase
      .from("payout_line_items")
      .insert(
        holderLineItems.map((li) => ({
          payout_id: payout.payout_id,
          entitlement_id: li.entitlement_id,
          amount_cents: li.amount_cents,
        }))
      )
      .throwOnError();
  }

  const creditedEntitlementIds = lineItems.map((li) => li.entitlement_id);
  if (creditedEntitlementIds.length) {
    await supabase
      .from("payout_entitlements")
      .update({ status: "payout_pending" })
      .in("entitlement_id", creditedEntitlementIds);
  }
}

async function bumpTournamentPlacementStats(
  tournamentId: string,
  championTeamId: string,
  runnerUpTeamId: string | null,
  supabase: ServiceClient
) {
  const { data: eligible } = await supabase
    .from("tournament_registrations")
    .select("team_id")
    .eq("tournament_id", tournamentId)
    .eq("status", "approved")
    .eq("funding_status", "fully_funded")
    .not("checked_in_at", "is", null);

  for (const reg of eligible ?? []) {
    await supabase.from("team_statistics").upsert({ team_id: reg.team_id }, { onConflict: "team_id", ignoreDuplicates: true });
    const { data: current } = await supabase
      .from("team_statistics")
      .select("tournaments_entered")
      .eq("team_id", reg.team_id)
      .single();
    await supabase
      .from("team_statistics")
      .update({ tournaments_entered: (current?.tournaments_entered ?? 0) + 1 })
      .eq("team_id", reg.team_id);
  }

  const { data: championStats } = await supabase
    .from("team_statistics")
    .select("tournaments_won")
    .eq("team_id", championTeamId)
    .single();
  await supabase
    .from("team_statistics")
    .update({ tournaments_won: (championStats?.tournaments_won ?? 0) + 1 })
    .eq("team_id", championTeamId);

  if (runnerUpTeamId) {
    const { data: runnerUpStats } = await supabase
      .from("team_statistics")
      .select("runner_up_finishes")
      .eq("team_id", runnerUpTeamId)
      .single();
    await supabase
      .from("team_statistics")
      .update({ runner_up_finishes: (runnerUpStats?.runner_up_finishes ?? 0) + 1 })
      .eq("team_id", runnerUpTeamId);
  }
}

export async function approvePayout(payoutId: string, adminUserId: string) {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("payouts")
    .update({ status: "approved", approved_by_admin_id: adminUserId, approved_at: new Date().toISOString() })
    .eq("payout_id", payoutId)
    .eq("status", "pending_review")
    .select()
    .single();
  if (error) throw error;
  if (!data) throw new Error("This payout isn't pending review.");
  return data;
}

export async function markPayoutPaid(payoutId: string) {
  const supabase = createServiceRoleClient();
  const { data: payout, error } = await supabase
    .from("payouts")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("payout_id", payoutId)
    .eq("status", "approved")
    .select()
    .single();
  if (error) throw error;
  if (!payout) throw new Error("This payout must be approved before it can be marked paid.");

  const { data: lineItems } = await supabase
    .from("payout_line_items")
    .select("entitlement_id")
    .eq("payout_id", payoutId);
  if (lineItems?.length) {
    await supabase
      .from("payout_entitlements")
      .update({ status: "paid_out" })
      .in(
        "entitlement_id",
        lineItems.map((li) => li.entitlement_id)
      );
  }

  try {
    const { data: allocation } = await supabase
      .from("prize_allocations")
      .select("tournaments(name)")
      .eq("prize_allocation_id", payout.prize_allocation_id)
      .single();
    const tournamentName = (allocation?.tournaments as unknown as { name: string } | null)?.name;
    const { data: recipient } = await supabase
      .from("users")
      .select("email")
      .eq("user_id", payout.recipient_user_id)
      .single();
    const discordUserId = await getDiscordUserIdForUser(payout.recipient_user_id);
    // Sheets logging shouldn't depend on a Discord link — only the DM
    // itself should skip when there's no linked account (the n8n workflow
    // handles that gating via is_dm, driven by discord_user_id's presence).
    await notifyN8n("payout_paid", {
      tournament_name: tournamentName,
      discord_user_id: discordUserId,
      recipient_email: recipient?.email,
      amount_cents: payout.total_amount_cents,
    });
  } catch (err) {
    console.error("payout_paid notification lookup failed:", err);
  }

  return payout;
}
