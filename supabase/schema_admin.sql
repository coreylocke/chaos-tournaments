-- Chaos Tournaments — Admin flag migration (additive)
--
-- Run in the SQL Editor, same project as schema.sql / schema_phase2.sql.
-- Adds a simple is_admin boolean to user_profiles. No admin UI/roles table yet — just
-- enough to gate the tournament-creation form. Everyone defaults to false.

alter table public.user_profiles
  add column if not exists is_admin boolean not null default false;

-- After running this, make yourself an admin (replace with your own Discord username):
--
--   update public.user_profiles set is_admin = true where discord_username = 'your_username_here';
