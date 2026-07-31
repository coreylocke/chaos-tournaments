-- Phase 1 (Foundation): tournaments + tournament_settings
-- Tables per CLAUDE.md Section 3. No registration flow yet.

create table tournaments (
  tournament_id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  division text not null check (division in ('PC','Console')),
  required_starting_players int not null default 5,
  maximum_substitutes int not null default 2,
  maximum_reserves int not null default 2,
  minimum_teams int not null default 4,
  maximum_teams int,
  bracket_size int,
  best_of int not null default 1 check (best_of in (1,3,5)),
  entry_fee_per_starting_slot_cents int not null,
  prize_allocation_method text not null default 'placement',
  first_place_prize_cents int,
  second_place_prize_cents int,
  third_place_prize_cents int,
  registration_open_at timestamptz,
  registration_close_at timestamptz,
  payment_deadline timestamptz,
  check_in_open_at timestamptz,
  check_in_close_at timestamptz,
  roster_lock_at timestamptz,
  entitlement_lock_at timestamptz,
  starts_at timestamptz,
  status text not null default 'draft' check (status in ('draft','open','registration_closed','in_progress','completed','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table tournament_settings (
  tournament_id uuid primary key references tournaments(tournament_id) on delete cascade,
  operations_fee_percentage numeric(5,2) not null default 20.00,
  prize_rounding_increment_cents int not null default 500,
  remainder_allocation_rule text not null default 'captain_funded_entry',
  remainder_fallback_rule text not null default 'earliest_funded_payer',
  double_no_show_policy text not null default 'void_match'
    check (double_no_show_policy in ('advance_neither','advance_designated_team','award_bye_to_next_opponent','reschedule_match','void_match')),
  auto_confirmation_enabled boolean not null default true,
  auto_confirmation_window_minutes int not null default 60,
  auto_confirmation_value_threshold_cents int,
  allow_payer_to_sponsor_opposing_teams boolean not null default false,
  seeding_method text not null default 'hybrid'
    check (seeding_method in ('random','registration_order','manual','ranking_based','performance_based','hybrid'))
);

-- Row Level Security ------------------------------------------------------
-- Public read (tournament pages are public). No write policies: creation and
-- editing go through the admin service layer using the service-role client.

alter table tournaments enable row level security;
alter table tournament_settings enable row level security;

create policy "tournaments public read" on tournaments
  for select using (true);

create policy "tournament_settings public read" on tournament_settings
  for select using (true);
