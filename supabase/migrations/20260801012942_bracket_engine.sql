-- Phase 5 (Bracket Engine): brackets, bracket_slots, matches, match_results,
-- match_confirmations, per CLAUDE.md Section 3/15/16. match_evidence and
-- disputes are deferred to Phase 6 ("Results & Disputes") — nothing in
-- Phase 5 raises a dispute, so matches.dispute_status stays null and the
-- finalizeMatch "no open dispute" check is trivially satisfied for now.
--
-- CLAUDE.md flagged the original matches DDL's advancement-uniqueness
-- constraint as broken SQL (it referenced a nonexistent `source_match_id`
-- column — the schema actually splits source across team_1_source_match_id/
-- team_2_source_match_id). Resolved here by omitting that constraint
-- entirely: idempotency instead comes from finalizeMatch's atomic
-- `UPDATE ... WHERE status NOT IN ('completed','voided')`, matching Section
-- 16's own "a completed match can only be reopened by an explicit admin
-- action, never by re-running this service" — a status-guarded update
-- provides the same guarantee without a constraint that can't be expressed
-- cleanly against a two-column source reference.

create table brackets (
  bracket_id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments(tournament_id),
  format text not null default 'single_elimination'
    check (format in ('single_elimination','double_elimination','round_robin','group_stage_to_elimination')),
  bracket_size int not null,
  status text not null default 'pending' check (status in ('pending','active','completed')),
  created_at timestamptz not null default now()
);

create table bracket_slots (
  bracket_slot_id uuid primary key default gen_random_uuid(),
  bracket_id uuid not null references brackets(bracket_id) on delete cascade,
  seed int,
  team_id uuid references teams(team_id),
  is_bye boolean not null default false
);

create table matches (
  match_id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments(tournament_id),
  bracket_id uuid not null references brackets(bracket_id),
  round_number int not null,
  round_name text,
  match_number int not null,
  bracket_position int not null,
  team_1_id uuid references teams(team_id),
  team_2_id uuid references teams(team_id),
  team_1_source_match_id uuid references matches(match_id),
  team_2_source_match_id uuid references matches(match_id),
  winner_team_id uuid references teams(team_id),
  loser_team_id uuid references teams(team_id),
  status text not null default 'pending'
    check (status in ('pending','ready','in_progress','awaiting_confirmation','disputed','completed','forfeited','bye','voided')),
  result_type text check (result_type in ('normal','bye','forfeit','double_forfeit','admin_score')),
  next_match_id uuid references matches(match_id),
  next_match_slot int,
  dispute_status text,
  version_number int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table match_results (
  match_result_id uuid primary key default gen_random_uuid(),
  match_id uuid not null references matches(match_id) on delete cascade,
  submitted_by_user_id uuid not null references users(user_id),
  series_score text not null,
  map_scores jsonb,
  submitted_at timestamptz not null default now()
);

create table match_confirmations (
  confirmation_id uuid primary key default gen_random_uuid(),
  match_id uuid not null references matches(match_id) on delete cascade,
  confirmed_by_user_id uuid references users(user_id),
  confirmation_type text not null check (confirmation_type in ('manual','auto','admin')),
  confirmed_at timestamptz not null default now()
);

alter table brackets enable row level security;
alter table bracket_slots enable row level security;
alter table matches enable row level security;
alter table match_results enable row level security;
alter table match_confirmations enable row level security;

-- Public read across all five — non-financial by construction (no payer/
-- entitlement columns anywhere in this table group), matching Section 8's
-- "public bracket views must select only non-financial columns."
create policy "brackets public read" on brackets for select using (true);
create policy "bracket_slots public read" on bracket_slots for select using (true);
create policy "matches public read" on matches for select using (true);
create policy "match_results public read" on match_results for select using (true);
create policy "match_confirmations public read" on match_confirmations for select using (true);

grant select on brackets, bracket_slots, matches, match_results, match_confirmations to anon, authenticated;
grant select, insert, update, delete on brackets, bracket_slots, matches, match_results, match_confirmations to service_role;
