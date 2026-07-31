-- Phase 2: tournament_registrations + registration_rosters, per CLAUDE.md
-- Section 3 DDL and the Phase 2/Phase 4 boundary decided in Section 0
-- (2026-07-31): this is only the minimal registration trigger, not the full
-- Phase 4 flow (tournament pages, rules acceptance, check-in).

create table tournament_registrations (
  registration_id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments(tournament_id),
  team_id uuid not null references teams(team_id),
  funding_status text not null default 'unfunded'
    check (funding_status in ('unfunded','partially_funded','fully_funded','payment_mismatch','refund_pending','partially_refunded','refunded','chargeback_review','admin_review')),
  rules_accepted_at timestamptz,
  checked_in_at timestamptz,
  status text not null default 'pending' check (status in ('pending','approved','rejected','withdrawn')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tournament_id, team_id)
);

create table registration_rosters (
  registration_roster_id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references tournament_registrations(registration_id) on delete cascade,
  team_member_id uuid not null references team_members(team_member_id),
  assigned_role text not null check (assigned_role in ('starter','substitute','reserve','coach','manager')),
  starter_slot_number int,
  eligibility_status text not null default 'eligible' check (eligibility_status in ('eligible','ineligible','pending_review')),
  confirmation_status text not null default 'pending' check (confirmation_status in ('pending','confirmed','declined')),
  locked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (registration_id, team_member_id)
);

alter table tournament_registrations enable row level security;
alter table registration_rosters enable row level security;

create policy "tournament_registrations read own team or admin" on tournament_registrations
  for select using (
    public.is_team_member(team_id)
    or exists (select 1 from public.teams t where t.team_id = tournament_registrations.team_id and t.captain_user_id = public.current_app_user_id())
    or public.is_admin()
  );

create policy "registration_rosters read own team or admin" on registration_rosters
  for select using (
    exists (
      select 1 from public.tournament_registrations r
      where r.registration_id = registration_rosters.registration_id
        and (
          public.is_team_member(r.team_id)
          or exists (select 1 from public.teams t where t.team_id = r.team_id and t.captain_user_id = public.current_app_user_id())
        )
    )
    or public.is_admin()
  );

grant select on tournament_registrations, registration_rosters to anon, authenticated;
grant select, insert, update, delete on tournament_registrations, registration_rosters to service_role;
