-- Phase 7 (Prize Allocation & Payouts): payout_entitlements,
-- entitlement_transfers, prize_allocations, payouts, payout_line_items, per
-- CLAUDE.md Section 3 DDL. These were deferred at Phase 3 planning (see
-- Section 0) until a tournament could actually reach completion and
-- exercise them. payout_entitlements becomes the authoritative
-- entitlement record going forward; registration_entry_slots'
-- payout_entitlement_user_id/entitlement_status remain a denormalized
-- read cache, same treatment as payment_id/payment_entry_allocations.
--
-- payouts is missing the "unique constraint on prize_allocation +
-- recipient" that Section 17's pseudocode calls for but the original DDL
-- pass never added (same class of gap as the Phase 5 matches-table
-- constraint) — added here.

create table payout_entitlements (
  entitlement_id uuid primary key default gen_random_uuid(),
  entry_slot_id uuid not null references registration_entry_slots(entry_slot_id),
  holder_user_id uuid not null references users(user_id),
  status text not null default 'pending'
    check (status in ('pending','active','locked','payout_pending','paid_out','transferred','cancelled','forfeited','admin_review')),
  locked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (entry_slot_id)
);

create table entitlement_transfers (
  transfer_id uuid primary key default gen_random_uuid(),
  entitlement_id uuid not null references payout_entitlements(entitlement_id),
  from_user_id uuid references users(user_id),
  to_user_id uuid not null references users(user_id),
  reason text,
  approved_by_admin_id uuid references users(user_id),
  created_at timestamptz not null default now()
);

create table prize_allocations (
  prize_allocation_id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments(tournament_id),
  placement int not null,
  placement_prize_cents int not null,
  entry_share_value_cents int not null,
  created_at timestamptz not null default now(),
  unique (tournament_id, placement)
);

create table payouts (
  payout_id uuid primary key default gen_random_uuid(),
  prize_allocation_id uuid not null references prize_allocations(prize_allocation_id),
  recipient_user_id uuid not null references users(user_id),
  total_amount_cents int not null,
  status text not null default 'pending_review'
    check (status in ('pending_review','approved','processing','paid','failed','cancelled')),
  approved_by_admin_id uuid references users(user_id),
  approved_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  unique (prize_allocation_id, recipient_user_id)
);

create table payout_line_items (
  line_item_id uuid primary key default gen_random_uuid(),
  payout_id uuid not null references payouts(payout_id) on delete cascade,
  entitlement_id uuid not null references payout_entitlements(entitlement_id),
  amount_cents int not null
);

-- Phase 6 deferred tournament-placement team_statistics fields to Phase 7
-- (per Section 0): tournaments_entered/tournaments_won/runner_up_finishes
-- are the specific fields directly tied to payout generation.
-- semifinal_finishes/quarterfinal_finishes/ranking_points/series and map
-- stats remain deferred — see Section 0 for why.
alter table team_statistics
  add column tournaments_entered int not null default 0,
  add column tournaments_won int not null default 0,
  add column runner_up_finishes int not null default 0;

alter table payout_entitlements enable row level security;
alter table entitlement_transfers enable row level security;
alter table prize_allocations enable row level security;
alter table payouts enable row level security;
alter table payout_line_items enable row level security;

create policy "payout_entitlements read own or admin" on payout_entitlements
  for select using (
    holder_user_id = public.current_app_user_id()
    or public.is_admin()
  );

create policy "entitlement_transfers read own or admin" on entitlement_transfers
  for select using (
    from_user_id = public.current_app_user_id()
    or to_user_id = public.current_app_user_id()
    or public.is_admin()
  );

-- Prize amounts/structure are already public via the tournament page
-- (first_place_prize_cents etc.) — no payer/recipient identity here.
create policy "prize_allocations public read" on prize_allocations
  for select using (true);

create policy "payouts read own or admin" on payouts
  for select using (
    recipient_user_id = public.current_app_user_id()
    or public.is_admin()
  );

create policy "payout_line_items read own or admin" on payout_line_items
  for select using (
    exists (
      select 1 from public.payouts p
      where p.payout_id = payout_line_items.payout_id
        and p.recipient_user_id = public.current_app_user_id()
    )
    or public.is_admin()
  );

grant select on payout_entitlements, entitlement_transfers, prize_allocations, payouts, payout_line_items to anon, authenticated;
grant select, insert, update, delete on payout_entitlements, entitlement_transfers, prize_allocations, payouts, payout_line_items to service_role;
