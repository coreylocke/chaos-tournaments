import "server-only";
import { createServiceRoleClient } from "@/lib/supabase/server";

type ServiceClient = ReturnType<typeof createServiceRoleClient>;

export type LinkQualificationInput = {
  sourceBracketId: string;
  destinationBracketId: string;
  destinationMatchId: string;
  destinationSlot: 1 | 2;
  qualificationRule: "bracket_winner" | "bracket_runner_up";
};

// Brief Section 43. Admin-only; authorization happens in the caller, same
// as the rest of the service layer. Scoped to bracket_winner/bracket_
// runner_up — see CLAUDE.md Section 0 for why the other four qualification
// rules aren't implemented this pass, and for the deferred "how does an
// admin build a championship bracket with slots reserved for qualifiers"
// question this doesn't solve (destinationMatchId must already exist with
// an empty slot; that's on the admin/operator for now).
export async function linkQualification(input: LinkQualificationInput) {
  const supabase = createServiceRoleClient();

  const { data: sourceBracket, error: sourceError } = await supabase
    .from("brackets")
    .select("bracket_id, tournament_id, tournaments(division)")
    .eq("bracket_id", input.sourceBracketId)
    .single();
  if (sourceError) throw sourceError;
  const { data: destBracket, error: destError } = await supabase
    .from("brackets")
    .select("bracket_id, tournament_id, tournaments(division)")
    .eq("bracket_id", input.destinationBracketId)
    .single();
  if (destError) throw destError;

  const sourceDivision = (sourceBracket.tournaments as unknown as { division: string } | null)?.division;
  const destDivision = (destBracket.tournaments as unknown as { division: string } | null)?.division;
  if (sourceDivision !== destDivision) {
    throw new Error(
      `A ${sourceDivision} qualifier can't feed a ${destDivision} championship — divisions must match.`
    );
  }

  const { data: destMatch, error: matchError } = await supabase
    .from("matches")
    .select("match_id, bracket_id, team_1_id, team_2_id")
    .eq("match_id", input.destinationMatchId)
    .single();
  if (matchError) throw matchError;
  if (destMatch.bracket_id !== input.destinationBracketId) {
    throw new Error("That match doesn't belong to the destination bracket.");
  }
  const existingTeamInSlot = input.destinationSlot === 1 ? destMatch.team_1_id : destMatch.team_2_id;
  if (existingTeamInSlot) {
    throw new Error("That destination slot is already filled by a team.");
  }

  const { data: link, error } = await supabase
    .from("bracket_qualifications")
    .insert({
      source_bracket_id: input.sourceBracketId,
      destination_bracket_id: input.destinationBracketId,
      destination_match_id: input.destinationMatchId,
      destination_slot: input.destinationSlot,
      qualification_rule: input.qualificationRule,
    })
    .select()
    .single();
  if (error) throw error;

  // If the source bracket already finished before this link was created,
  // resolve it immediately rather than waiting for a future match.
  const { data: sourceFinal } = await supabase
    .from("matches")
    .select("status, winner_team_id")
    .eq("bracket_id", input.sourceBracketId)
    .is("next_match_id", null)
    .maybeSingle();
  if (sourceFinal?.status === "completed" && sourceFinal.winner_team_id) {
    await resolveQualificationLink(link.bracket_qualification_id, supabase);
  }

  return link;
}

// Called from matchAdvancementService.advanceWinner the moment a source
// bracket completes — resolves every qualification link still pending for
// that bracket (there can be two: bracket_winner and bracket_runner_up
// feeding different destination slots).
export async function resolveQualificationsForBracket(sourceBracketId: string, supabase: ServiceClient) {
  const { data: links } = await supabase
    .from("bracket_qualifications")
    .select("bracket_qualification_id")
    .eq("source_bracket_id", sourceBracketId)
    .is("resolved_at", null);
  for (const link of links ?? []) {
    await resolveQualificationLink(link.bracket_qualification_id, supabase);
  }
}

async function resolveQualificationLink(bracketQualificationId: string, supabase: ServiceClient) {
  const { data: link } = await supabase
    .from("bracket_qualifications")
    .select("*")
    .eq("bracket_qualification_id", bracketQualificationId)
    .single();
  if (!link || link.resolved_at) return;

  const { data: sourceFinal } = await supabase
    .from("matches")
    .select("winner_team_id, loser_team_id, status")
    .eq("bracket_id", link.source_bracket_id)
    .is("next_match_id", null)
    .single();
  if (!sourceFinal || sourceFinal.status !== "completed" || !sourceFinal.winner_team_id) return;

  const qualifyingTeamId =
    link.qualification_rule === "bracket_winner" ? sourceFinal.winner_team_id : sourceFinal.loser_team_id;
  if (!qualifyingTeamId) return;

  const { data: sourceBracket } = await supabase
    .from("brackets")
    .select("tournament_id")
    .eq("bracket_id", link.source_bracket_id)
    .single();
  const { data: destBracket } = await supabase
    .from("brackets")
    .select("tournament_id")
    .eq("bracket_id", link.destination_bracket_id)
    .single();
  const { data: sourceTournament } = await supabase
    .from("tournaments")
    .select("entry_fee_per_starting_slot_cents")
    .eq("tournament_id", sourceBracket!.tournament_id)
    .single();
  const { data: destTournament } = await supabase
    .from("tournaments")
    .select("entry_fee_per_starting_slot_cents")
    .eq("tournament_id", destBracket!.tournament_id)
    .single();

  let destRegistrationId: string;
  const { data: existingDestReg } = await supabase
    .from("tournament_registrations")
    .select("registration_id")
    .eq("tournament_id", destBracket!.tournament_id)
    .eq("team_id", qualifyingTeamId)
    .maybeSingle();

  if (existingDestReg) {
    destRegistrationId = existingDestReg.registration_id;
  } else {
    const { data: sourceReg, error: sourceRegError } = await supabase
      .from("tournament_registrations")
      .select("registration_id")
      .eq("tournament_id", sourceBracket!.tournament_id)
      .eq("team_id", qualifyingTeamId)
      .single();
    if (sourceRegError) throw sourceRegError;
    const { data: sourceRoster } = await supabase
      .from("registration_rosters")
      .select("team_member_id, assigned_role, starter_slot_number")
      .eq("registration_id", sourceReg!.registration_id);
    const { data: sourceSlots } = await supabase
      .from("registration_entry_slots")
      .select("entry_slot_id, slot_number, assigned_starter_user_id, payer_user_id")
      .eq("registration_id", sourceReg!.registration_id)
      .order("slot_number");

    // payout_entitlements is the authoritative entitlement record as of
    // Phase 7 — registration_entry_slots.payout_entitlement_user_id is
    // only a denormalized cache and isn't guaranteed to be populated
    // (e.g. entitlements created/updated directly rather than through the
    // Stripe webhook). Read the source of truth here, not the cache.
    const sourceSlotIds = (sourceSlots ?? []).map((s) => s.entry_slot_id);
    const { data: sourceEntitlements } = sourceSlotIds.length
      ? await supabase
          .from("payout_entitlements")
          .select("entry_slot_id, holder_user_id")
          .in("entry_slot_id", sourceSlotIds)
      : { data: [] as Array<{ entry_slot_id: string; holder_user_id: string }> };
    const holderBySlotId = new Map((sourceEntitlements ?? []).map((e) => [e.entry_slot_id, e.holder_user_id]));

    const { data: destReg, error: destRegError } = await supabase
      .from("tournament_registrations")
      .insert({ tournament_id: destBracket!.tournament_id, team_id: qualifyingTeamId, status: "approved" })
      .select()
      .single();
    if (destRegError) throw destRegError;
    destRegistrationId = destReg.registration_id;

    if (sourceRoster?.length) {
      await supabase
        .from("registration_rosters")
        .insert(
          sourceRoster.map((r) => ({
            registration_id: destRegistrationId,
            team_member_id: r.team_member_id,
            assigned_role: r.assigned_role,
            starter_slot_number: r.starter_slot_number,
          }))
        )
        .throwOnError();
    }

    // Brief Section 43 ("Entry-Fee Carryover, resolved"): identical fees
    // carry the existing payment/entitlement over with no new payment
    // required; different fees create fresh unpaid slots.
    const feesMatch =
      sourceTournament!.entry_fee_per_starting_slot_cents === destTournament!.entry_fee_per_starting_slot_cents;

    if (sourceSlots?.length) {
      const { data: insertedSlots, error: slotsError } = await supabase
        .from("registration_entry_slots")
        .insert(
          sourceSlots.map((s) => ({
            registration_id: destRegistrationId,
            slot_number: s.slot_number,
            assigned_starter_user_id: s.assigned_starter_user_id,
            entry_fee_amount_cents: destTournament!.entry_fee_per_starting_slot_cents,
            payment_status: feesMatch ? "paid" : "unpaid",
            payer_user_id: feesMatch ? s.payer_user_id : null,
            payout_entitlement_user_id: feesMatch ? (holderBySlotId.get(s.entry_slot_id) ?? null) : null,
            entitlement_status: feesMatch ? "active" : "pending",
          }))
        )
        .select();
      if (slotsError) throw slotsError;

      if (feesMatch) {
        const entitlementRows = (insertedSlots ?? [])
          .filter((s) => s.payout_entitlement_user_id)
          .map((s) => ({
            entry_slot_id: s.entry_slot_id,
            holder_user_id: s.payout_entitlement_user_id as string,
            status: "active",
          }));
        if (entitlementRows.length) {
          await supabase
            .from("payout_entitlements")
            .upsert(entitlementRows, { onConflict: "entry_slot_id" })
            .throwOnError();
        }
      }
    }

    await supabase
      .from("tournament_registrations")
      .update({ funding_status: feesMatch ? "fully_funded" : "unfunded" })
      .eq("registration_id", destRegistrationId);
  }

  await supabase
    .from("matches")
    .update(link.destination_slot === 1 ? { team_1_id: qualifyingTeamId } : { team_2_id: qualifyingTeamId })
    .eq("match_id", link.destination_match_id);

  const { data: destMatch } = await supabase
    .from("matches")
    .select("match_id, team_1_id, team_2_id, status")
    .eq("match_id", link.destination_match_id)
    .single();
  if (destMatch?.team_1_id && destMatch.team_2_id && destMatch.status === "pending") {
    await supabase.from("matches").update({ status: "ready" }).eq("match_id", destMatch.match_id);
  }

  await supabase
    .from("bracket_qualifications")
    .update({
      resolved_team_id: qualifyingTeamId,
      resolved_registration_id: destRegistrationId,
      resolved_at: new Date().toISOString(),
    })
    .eq("bracket_qualification_id", bracketQualificationId);
}
