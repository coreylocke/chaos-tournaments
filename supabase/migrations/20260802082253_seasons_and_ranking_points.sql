-- Phase 9 (Tournament Stacking): seasons + season_points, per brief
-- Section 38's "ranking_points" field (explicitly deferred to Phase 9 by
-- name in Phase 6/7 planning). ranking_points is NOT added to
-- team_statistics as a cached column -- season standings are computed by
-- summing season_points.points per (season_id, team_id), since a single
-- lifetime counter doesn't cleanly represent "points within a season."

create table seasons (
  season_id uuid primary key default gen_random_uuid(),
  name text not null,
  starts_at timestamptz,
  ends_at timestamptz,
  status text not null default 'upcoming' check (status in ('upcoming', 'active', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table season_points (
  season_points_id uuid primary key default gen_random_uuid(),
  season_id uuid not null references seasons(season_id) on delete cascade,
  tournament_id uuid not null references tournaments(tournament_id),
  team_id uuid not null references teams(team_id),
  points int not null,
  placement_tier text not null
    check (placement_tier in ('champion', 'runner_up', 'semifinalist', 'quarterfinalist', 'round_of_16', 'participation', 'forfeit_loss', 'disqualification')),
  created_at timestamptz not null default now(),
  unique (tournament_id, team_id)
);

-- A tournament opts into a season by being assigned one; tournaments with
-- no season_id never trigger point-awarding (Section 0).
alter table tournaments add column season_id uuid references seasons(season_id);

-- Brief Section 38's suggested values, configurable per tournament rather
-- than one global constant. One jsonb column instead of 8 separate int
-- columns to keep the schema change minimal.
alter table tournament_settings
  add column ranking_points_config jsonb not null default '{
    "champion": 100,
    "runner_up": 70,
    "semifinalist": 45,
    "quarterfinalist": 25,
    "round_of_16": 10,
    "participation": 5,
    "forfeit_loss": 0,
    "disqualification": 0
  }'::jsonb;

alter table seasons enable row level security;
alter table season_points enable row level security;

create policy "seasons public read" on seasons for select using (true);
create policy "season_points public read" on season_points for select using (true);

grant select on seasons, season_points to anon, authenticated;
grant select, insert, update, delete on seasons, season_points to service_role;
