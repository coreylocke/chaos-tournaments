-- Chaos Tournaments — Bracket engine schema (additive migration)
-- Master Build Brief Sections 24-27, 29, 32 (scoped subset — see docs/MASTER_BUILD_BRIEF.md
-- addendum for what's deliberately left out: best-of series, two-party result confirmation,
-- disputes, payout creation).
--
-- Run in the SQL Editor, same project as the other migrations.

create table if not exists public.matches (
  match_id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments (tournament_id) on delete cascade,
  round_number int not null,
  round_name text not null,
  match_number int not null,
  team_1_id uuid references public.teams (team_id),
  team_2_id uuid references public.teams (team_id),
  next_match_id uuid references public.matches (match_id),
  next_match_slot int check (next_match_slot in (1, 2)),
  winner_team_id uuid references public.teams (team_id),
  loser_team_id uuid references public.teams (team_id),
  status text not null default 'pending' check (status in ('pending', 'ready', 'completed')),
  result_type text check (result_type in ('normal', 'bye', 'admin_decision')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tournament_id, match_number)
);

alter table public.matches enable row level security;

create policy "matches are viewable by everyone"
  on public.matches for select using (true);

-- No insert/update/delete policies: the bracket engine writes exclusively through the
-- service-role client from admin-only server actions (src/lib/actions/bracket.ts), same
-- pattern as tournament creation/editing (Section 63-64 addenda).

drop trigger if exists set_updated_at on public.matches;
create trigger set_updated_at before update on public.matches
  for each row execute function public.set_updated_at();
