-- Phase 2: team_invitations. Field list and consent flow decided during
-- Phase 2 planning (CLAUDE.md Section 0, 2026-07-31) — the brief names this
-- table but never specifies it. Invites require an existing account
-- (invited_user_id is a non-null FK), and roster membership is only ever
-- created on explicit accept.

create table team_invitations (
  invitation_id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(team_id) on delete cascade,
  invited_user_id uuid not null references users(user_id),
  invited_by_user_id uuid not null references users(user_id),
  roster_role text not null check (roster_role in ('starter','substitute','reserve','coach','manager')),
  platform text not null check (platform in ('PC','PS5','Xbox','PS4')),
  status text not null default 'pending' check (status in ('pending','accepted','declined','revoked','expired')),
  created_at timestamptz not null default now(),
  responded_at timestamptz
);

alter table team_invitations enable row level security;

create policy "team_invitations read own or captain or admin" on team_invitations
  for select using (
    invited_user_id = public.current_app_user_id()
    or exists (
      select 1 from public.teams t
      where t.team_id = team_invitations.team_id
        and t.captain_user_id = public.current_app_user_id()
    )
    or public.is_admin()
  );

-- Explicit grants (not just the earlier default-privileges migration) —
-- keeping every new table self-contained after the permission-denied bug
-- found while testing Phase 1's login flow.
grant select on team_invitations to anon, authenticated;
grant select, insert, update, delete on team_invitations to service_role;
