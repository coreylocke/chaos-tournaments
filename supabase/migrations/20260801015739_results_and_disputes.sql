-- Phase 6 (Results & Disputes): match_evidence and disputes are already
-- fully specified in CLAUDE.md Section 3 — created as-is. team_statistics
-- is new (master brief Section 38), scoped to per-match fields only for
-- this pass: tournament-placement fields (tournaments_won, ranking_points,
-- etc.) are deferred to Phase 7, since Section 34 pairs "update team
-- statistics" with payout creation at tournament-completion time, not
-- per-match — same "increment at the natural trigger point" pattern used
-- throughout this build (e.g. funding_status recalculates at the payment
-- webhook, not at registration).

create table match_evidence (
  evidence_id uuid primary key default gen_random_uuid(),
  match_id uuid not null references matches(match_id) on delete cascade,
  uploaded_by_user_id uuid references users(user_id),
  file_url text not null,
  uploaded_at timestamptz not null default now()
);

create table disputes (
  dispute_id uuid primary key default gen_random_uuid(),
  match_id uuid not null references matches(match_id),
  submitted_by_user_id uuid not null references users(user_id),
  reason text not null,
  description text,
  evidence_urls text[],
  assigned_admin_id uuid references users(user_id),
  resolution text check (resolution in ('original_result_upheld','result_reversed','match_replay','partial_replay','team_disqualified','double_forfeit','admin_score','match_voided')),
  resolution_notes text,
  status text not null default 'open' check (status in ('open','under_review','resolved')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table team_statistics (
  team_id uuid primary key references teams(team_id) on delete cascade,
  matches_played int not null default 0,
  matches_won int not null default 0,
  matches_lost int not null default 0,
  forfeit_wins int not null default 0,
  forfeit_losses int not null default 0,
  current_win_streak int not null default 0,
  longest_win_streak int not null default 0,
  updated_at timestamptz not null default now()
);

alter table match_evidence enable row level security;
alter table disputes enable row level security;
alter table team_statistics enable row level security;

-- Section 8: "disputes, match_evidence | ... | read if participant |
-- read/write for own team | ... | read/write". Writes still go through the
-- service layer (admin resolution, captain submission with validated
-- captaincy/participation), so only read policies are defined here.
create policy "match_evidence read if participant or admin" on match_evidence
  for select using (
    exists (
      select 1 from public.matches m
      join public.teams t on t.team_id in (m.team_1_id, m.team_2_id)
      where m.match_id = match_evidence.match_id
        and t.captain_user_id = public.current_app_user_id()
    )
    or public.is_admin()
  );

create policy "disputes read if participant or admin" on disputes
  for select using (
    exists (
      select 1 from public.matches m
      join public.teams t on t.team_id in (m.team_1_id, m.team_2_id)
      where m.match_id = disputes.match_id
        and t.captain_user_id = public.current_app_user_id()
    )
    or public.is_admin()
  );

create policy "team_statistics public read" on team_statistics for select using (true);

grant select on match_evidence, disputes, team_statistics to anon, authenticated;
grant select, insert, update, delete on match_evidence, disputes, team_statistics to service_role;

-- Storage bucket for match-result evidence screenshots. Uploads go through
-- the service-role client (validated captaincy/participation checked in
-- the service layer, matching the rest of this build), and the bucket is
-- public so evidence images can be displayed directly without signed URLs
-- — no storage.objects RLS policies are needed for either path.
insert into storage.buckets (id, name, public)
values ('match-evidence', 'match-evidence', true)
on conflict (id) do nothing;
