-- Chaos Tournaments — Phase 1 schema
-- Master Build Brief Sections 4, 18, 19, 52, 56 (Phase 1: Foundation)
--
-- Run this against a fresh Supabase project (SQL Editor, or `supabase db push`).
-- Enable the Discord provider in Supabase Auth > Providers before users can sign in.

-- ============================================================================
-- Extensions
-- ============================================================================
create extension if not exists "pgcrypto";

-- ============================================================================
-- Lookup tables
-- ============================================================================

create table if not exists public.platforms (
  id text primary key,          -- 'pc' | 'ps5' | 'xbox'
  label text not null
);
insert into public.platforms (id, label) values
  ('pc', 'PC'), ('ps5', 'PS5'), ('xbox', 'Xbox')
on conflict (id) do nothing;

create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- Users (Section 4)
-- ============================================================================
-- One row per auth.users row, populated automatically on first Discord login via the
-- handle_new_user() trigger below. This is the "user_profiles" table from Section 52.

create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  discord_user_id text unique,
  discord_username text,
  discord_display_name text,
  discord_avatar_url text,
  email text,
  preferred_platform text references public.platforms (id),
  account_status text not null default 'active', -- active | suspended | banned
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Populate user_profiles automatically from Discord OAuth metadata on signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.user_profiles (
    user_id, discord_user_id, discord_username, discord_display_name,
    discord_avatar_url, email
  )
  values (
    new.id,
    new.raw_user_meta_data ->> 'provider_id',
    new.raw_user_meta_data ->> 'user_name',
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url',
    new.email
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- Teams and rosters (Section 18)
-- ============================================================================

create table if not exists public.teams (
  team_id uuid primary key default gen_random_uuid(),
  team_name text not null,
  team_slug text unique not null,
  team_logo_url text,
  captain_user_id uuid not null references public.user_profiles (user_id),
  division text not null check (division in ('pc', 'console')),
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.team_members (
  team_member_id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (team_id) on delete cascade,
  user_id uuid not null references public.user_profiles (user_id),
  roster_role text not null check (
    roster_role in ('starter', 'substitute', 'reserve', 'coach', 'manager')
  ),
  platform text not null references public.platforms (id),
  game_username text,
  is_confirmed boolean not null default false,
  is_active boolean not null default true,
  joined_at timestamptz not null default now(),
  removed_at timestamptz,
  unique (team_id, user_id)
);

-- ============================================================================
-- Row Level Security
-- ============================================================================

alter table public.user_profiles enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;

-- user_profiles: users can read any profile (public roster display), but only update
-- their own.
create policy "user_profiles are viewable by everyone"
  on public.user_profiles for select using (true);

create policy "users can update their own profile"
  on public.user_profiles for update using (auth.uid() = user_id);

-- teams: readable by everyone, only the captain can update/insert on their own behalf.
create policy "teams are viewable by everyone"
  on public.teams for select using (true);

create policy "authenticated users can create a team as captain"
  on public.teams for insert
  with check (auth.uid() = captain_user_id);

create policy "captains can update their own team"
  on public.teams for update using (auth.uid() = captain_user_id);

-- team_members: readable by everyone; only the team's captain can add/remove members.
create policy "team_members are viewable by everyone"
  on public.team_members for select using (true);

create policy "captains can manage their team's roster"
  on public.team_members for all using (
    auth.uid() in (
      select captain_user_id from public.teams where teams.team_id = team_members.team_id
    )
  );

-- ============================================================================
-- updated_at helper (reused by future tables)
-- ============================================================================

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at on public.user_profiles;
create trigger set_updated_at before update on public.user_profiles
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.teams;
create trigger set_updated_at before update on public.teams
  for each row execute function public.set_updated_at();
