-- Chaos Tournaments — Discord bot support (additive migration)
-- Adds the one column the bot's check-in reminder poll needs. Role automation and slash
-- commands read existing tables (teams, team_members, tournaments, tournament_registrations,
-- matches, registration_payments, user_profiles) — no schema changes needed for those.
--
-- Run in the SQL Editor, same project as the other migrations.

alter table public.tournament_registrations
  add column if not exists reminder_sent_at timestamptz;
