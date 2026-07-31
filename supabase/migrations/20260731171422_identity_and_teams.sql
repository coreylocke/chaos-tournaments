-- Phase 1 (Foundation): identity + teams
-- Tables per CLAUDE.md Section 3, plus one addition flagged below.

create extension if not exists pgcrypto;

-- Identity -------------------------------------------------------------

create table users (
  user_id uuid primary key default gen_random_uuid(),
  supabase_auth_id uuid unique not null references auth.users(id) on delete cascade,
  email text,
  preferred_platform text check (preferred_platform in ('PC','PS5','Xbox','PS4')),
  account_status text not null default 'active' check (account_status in ('active','suspended','deleted')),
  -- Not in the original CLAUDE.md Section 3 DDL: added so the Phase 1 "admin auth gate
  -- (role check)" milestone item has something to check against. Admins are flagged
  -- manually (no self-serve admin signup path).
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table discord_accounts (
  discord_account_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(user_id) on delete cascade,
  discord_user_id text unique not null,
  discord_username text not null,
  discord_display_name text,
  discord_avatar_url text,
  linked_at timestamptz not null default now()
);

-- Teams -----------------------------------------------------------------

create table teams (
  team_id uuid primary key default gen_random_uuid(),
  team_name text not null,
  team_slug text unique not null,
  team_logo_url text,
  captain_user_id uuid not null references users(user_id),
  division text not null check (division in ('PC','Console')),
  status text not null default 'active' check (status in ('active','disbanded','suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table team_members (
  team_member_id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(team_id) on delete cascade,
  user_id uuid not null references users(user_id),
  roster_role text not null check (roster_role in ('starter','substitute','reserve','coach','manager')),
  platform text not null check (platform in ('PC','PS5','Xbox','PS4')),
  game_username text,
  is_confirmed boolean not null default false,
  is_active boolean not null default true,
  joined_at timestamptz not null default now(),
  removed_at timestamptz,
  unique (team_id, user_id)
);

-- Row Level Security ------------------------------------------------------
-- Per CLAUDE.md Section 8: all privileged writes go through the service layer
-- using the service-role key server-side. RLS here only grants read access;
-- no INSERT/UPDATE/DELETE policies are defined, so direct client writes are
-- denied by default and every mutation must go through a server-side service
-- function using the service-role client.

alter table users enable row level security;
alter table discord_accounts enable row level security;
alter table teams enable row level security;
alter table team_members enable row level security;

create policy "users read own or admin" on users
  for select using (
    supabase_auth_id = auth.uid()
    or exists (
      select 1 from users admin_check
      where admin_check.supabase_auth_id = auth.uid() and admin_check.is_admin
    )
  );

create policy "discord_accounts read own or admin" on discord_accounts
  for select using (
    exists (
      select 1 from users u
      where u.user_id = discord_accounts.user_id and u.supabase_auth_id = auth.uid()
    )
    or exists (
      select 1 from users admin_check
      where admin_check.supabase_auth_id = auth.uid() and admin_check.is_admin
    )
  );

create policy "teams public read" on teams
  for select using (true);

create policy "team_members read own team or admin" on team_members
  for select using (
    exists (
      select 1 from users u
      where u.supabase_auth_id = auth.uid()
        and u.user_id in (
          select tm.user_id from team_members tm where tm.team_id = team_members.team_id
        )
    )
    or exists (
      select 1 from users admin_check
      where admin_check.supabase_auth_id = auth.uid() and admin_check.is_admin
    )
  );
