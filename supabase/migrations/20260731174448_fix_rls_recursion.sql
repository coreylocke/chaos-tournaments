-- The "users read own or admin" and "team_members read own team or admin"
-- policies queried their own table from within their own USING clause,
-- which Postgres re-evaluates through the same policy recursively and
-- aborts with "infinite recursion detected in policy for relation". Fixing
-- with SECURITY DEFINER helper functions: as functions owned by the table
-- owner, their internal queries bypass RLS instead of re-triggering it.

create or replace function public.current_app_user_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select user_id from public.users where supabase_auth_id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select is_admin from public.users where supabase_auth_id = auth.uid()),
    false
  )
$$;

create or replace function public.is_team_member(check_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.team_members tm
    join public.users u on u.user_id = tm.user_id
    where tm.team_id = check_team_id and u.supabase_auth_id = auth.uid()
  )
$$;

grant execute on function public.current_app_user_id() to authenticated, anon;
grant execute on function public.is_admin() to authenticated, anon;
grant execute on function public.is_team_member(uuid) to authenticated, anon;

drop policy "users read own or admin" on users;
create policy "users read own or admin" on users
  for select using (
    supabase_auth_id = auth.uid() or public.is_admin()
  );

drop policy "discord_accounts read own or admin" on discord_accounts;
create policy "discord_accounts read own or admin" on discord_accounts
  for select using (
    user_id = public.current_app_user_id() or public.is_admin()
  );

drop policy "team_members read own team or admin" on team_members;
create policy "team_members read own team or admin" on team_members
  for select using (
    public.is_team_member(team_id) or public.is_admin()
  );
