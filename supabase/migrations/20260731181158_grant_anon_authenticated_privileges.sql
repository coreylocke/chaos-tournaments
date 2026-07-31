-- Same root cause as the service_role grant migration: RLS policies only
-- filter rows a role is already allowed to touch — they don't grant table
-- access on their own. anon/authenticated were missing the base SELECT
-- grant entirely, so every read (even ones RLS should allow) failed with
-- "permission denied for table users" (42501) before RLS was ever evaluated.
--
-- Only SELECT is granted here, deliberately: per CLAUDE.md Section 8, writes
-- go through the service-role service layer, not direct client writes, so
-- anon/authenticated should have no INSERT/UPDATE/DELETE grant at all.

grant usage on schema public to anon, authenticated;

grant select on
  public.users,
  public.discord_accounts,
  public.teams,
  public.team_members,
  public.tournaments,
  public.tournament_settings
to anon, authenticated;

alter default privileges in schema public
  grant select on tables to anon, authenticated;
