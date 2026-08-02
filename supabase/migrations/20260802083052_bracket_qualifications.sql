-- Phase 9 (Tournament Stacking): bracket_qualifications, per brief Section
-- 43. Scoped to qualification_rule in ('bracket_winner','bracket_runner_up')
-- only -- 'top_two'/'points_leader'/'wild_card'/'admin_selection' need
-- standings or manual admin picks beyond this pass's scope (see Section 0).

create table bracket_qualifications (
  bracket_qualification_id uuid primary key default gen_random_uuid(),
  source_bracket_id uuid not null references brackets(bracket_id),
  source_placement int not null default 1,
  destination_bracket_id uuid not null references brackets(bracket_id),
  destination_match_id uuid not null references matches(match_id),
  destination_slot int not null check (destination_slot in (1, 2)),
  qualification_rule text not null default 'bracket_winner'
    check (qualification_rule in ('bracket_winner', 'bracket_runner_up')),
  resolved_team_id uuid references teams(team_id),
  resolved_registration_id uuid references tournament_registrations(registration_id),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  unique (source_bracket_id, qualification_rule, destination_match_id, destination_slot)
);

alter table bracket_qualifications enable row level security;

create policy "bracket_qualifications public read" on bracket_qualifications
  for select using (true);

grant select on bracket_qualifications to anon, authenticated;
grant select, insert, update, delete on bracket_qualifications to service_role;
