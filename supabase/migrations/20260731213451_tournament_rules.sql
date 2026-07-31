-- Phase 4: tournament_rules. Named in the master brief's table list with no
-- field spec (same situation as team_invitations in Phase 2) — decided
-- during Phase 4 planning: one admin-editable rules body per tournament,
-- versioned so edits after teams have already accepted are visible as a
-- distinct version rather than silently rewriting what was agreed to.

create table tournament_rules (
  tournament_rules_id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments(tournament_id) on delete cascade,
  body text not null,
  version int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tournament_id)
);

alter table tournament_rules enable row level security;

create policy "tournament_rules public read" on tournament_rules
  for select using (true);

grant select on tournament_rules to anon, authenticated;
grant select, insert, update, delete on tournament_rules to service_role;
