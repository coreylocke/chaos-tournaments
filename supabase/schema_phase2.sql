-- Chaos Tournaments — Phase 2 schema (additive migration)
-- Master Build Brief Sections 18-19, 22, 24 (Team registration + tournament structure)
--
-- Run this against the same Supabase project schema.sql was applied to (SQL Editor).
-- Adds tournaments + tournament_registrations. Does NOT implement the per-entry-slot
-- payment/sponsorship model from Sections 7-9 and 52 — that's Phase 3 (Stripe). Team
-- registration here is a placeholder pending_review state until payments exist.

-- ============================================================================
-- Tournaments (Section 24 — subset of full brief; bracket/prize-rule fields deferred)
-- ============================================================================

create table if not exists public.tournaments (
  tournament_id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  game_id uuid references public.games (id),
  division text not null check (division in ('pc', 'console')),
  format text not null default 'single_elimination'
    check (format in ('single_elimination', 'double_elimination', 'round_robin', 'group_stage_to_elimination')),
  team_size int not null default 5,
  required_starting_players int not null default 5,
  maximum_substitutes int not null default 2,
  maximum_reserves int not null default 1,
  maximum_coaches int not null default 1,
  maximum_managers int not null default 1,
  minimum_teams int not null default 4,
  maximum_teams int,
  entry_fee_per_starting_slot numeric(10, 2) not null default 0,
  first_place_prize numeric(10, 2),
  second_place_prize numeric(10, 2),
  third_place_prize numeric(10, 2),
  registration_open_at timestamptz,
  registration_close_at timestamptz,
  starts_at timestamptz,
  status text not null default 'draft'
    check (status in ('draft', 'open', 'closed', 'in_progress', 'completed', 'cancelled')),
  rules_version int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- Tournament registrations (Section 22 — team-level registration status)
-- ============================================================================
-- Entry-slot-level funding (Sections 7-9) is Phase 3. Until then, registration_status
-- moves draft -> awaiting_roster -> pending_review manually; a captain "registers" once
-- their roster meets required_starting_players, landing in pending_review for admin
-- approval rather than being auto-approved.

create table if not exists public.tournament_registrations (
  registration_id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments (tournament_id) on delete cascade,
  team_id uuid not null references public.teams (team_id) on delete cascade,
  registration_status text not null default 'draft' check (
    registration_status in (
      'draft', 'awaiting_roster', 'awaiting_entry_funding', 'partially_funded',
      'fully_funded', 'pending_review', 'approved', 'checked_in', 'seeded', 'active',
      'eliminated', 'winner', 'runner_up', 'disqualified', 'withdrawn',
      'refund_pending', 'refunded', 'payment_review'
    )
  ),
  registered_by uuid not null references public.user_profiles (user_id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tournament_id, team_id)
);

-- ============================================================================
-- Row Level Security
-- ============================================================================

alter table public.tournaments enable row level security;
alter table public.tournament_registrations enable row level security;

create policy "tournaments are viewable by everyone"
  on public.tournaments for select using (true);

create policy "tournament_registrations are viewable by everyone"
  on public.tournament_registrations for select using (true);

-- Only a team's captain may register that team, and only update/withdraw their own
-- team's registration.
create policy "captains can register their team"
  on public.tournament_registrations for insert
  with check (
    auth.uid() in (
      select captain_user_id from public.teams where teams.team_id = tournament_registrations.team_id
    )
  );

create policy "captains can update their team's registration"
  on public.tournament_registrations for update using (
    auth.uid() in (
      select captain_user_id from public.teams where teams.team_id = tournament_registrations.team_id
    )
  );

create policy "captains can withdraw their team's registration"
  on public.tournament_registrations for delete using (
    auth.uid() in (
      select captain_user_id from public.teams where teams.team_id = tournament_registrations.team_id
    )
  );

-- ============================================================================
-- updated_at triggers (reuses set_updated_at() from schema.sql)
-- ============================================================================

drop trigger if exists set_updated_at on public.tournaments;
create trigger set_updated_at before update on public.tournaments
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.tournament_registrations;
create trigger set_updated_at before update on public.tournament_registrations
  for each row execute function public.set_updated_at();
