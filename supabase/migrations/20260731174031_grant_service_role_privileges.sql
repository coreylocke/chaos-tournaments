-- The service-role client bypasses RLS but is still a normal Postgres role —
-- it needs explicit table grants. These weren't present after pushing the
-- Phase 1 tables via the CLI, causing "permission denied for table users"
-- (42501) from the /auth/callback service-layer write.

grant usage on schema public to service_role;

grant select, insert, update, delete on
  public.users,
  public.discord_accounts,
  public.teams,
  public.team_members,
  public.tournaments,
  public.tournament_settings
to service_role;

-- Cover tables created by future migrations too, so this doesn't recur.
alter default privileges in schema public
  grant select, insert, update, delete on tables to service_role;
