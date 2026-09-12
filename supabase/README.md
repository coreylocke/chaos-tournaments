# Supabase setup

1. Create a project at supabase.com (or reuse an existing one).
2. In the SQL Editor, run `schema.sql` (Phase 1: user_profiles, teams, team_members, RLS).
3. Auth > Providers > enable **Discord**. You'll need a Discord application's Client ID +
   Client Secret (Discord Developer Portal > New Application > OAuth2). Set the redirect
   URL Discord gives you as `https://<your-project>.supabase.co/auth/v1/callback`.
4. Copy the project URL, anon key, and service role key into `.env` (see `.env.example`
   at the repo root).
5. Auth > URL Configuration > add your site's `/auth/callback` route (e.g.
   `https://chaostournaments.com/auth/callback`, plus `http://localhost:3000/auth/callback`
   for local dev) to the allowed redirect URLs.

Once those env vars are set, `/login` automatically switches from the placeholder to the
real Discord login button (see `src/app/login/page.tsx`).
