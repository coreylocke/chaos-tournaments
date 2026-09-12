# Open Questions

Decisions that need Corey's input before proceeding further. Update this file as questions
get resolved — move resolved items into the relevant page and delete from here.

## 1. ~~Existing chaostournaments.com deployment~~ — resolved 2026-08-07

Confirmed: chaostournaments.com was already running on this same VPS (droplet
"chaos-website", `192.241.158.223`) via an existing Docker Compose + Caddy setup at
`~/chaos-site`. No real user data existed behind it worth preserving. Decision: replace
it with this build. The old deployment was backed up to
`~/chaos-site-backup-20260807-033317` on the server before replacement, and the
existing `docker-compose.yml`/`Caddyfile` were reused rather than replaced. See
[deployment.md](./deployment.md).

## 2. ~~Supabase project~~ — resolved 2026-08-05

Connected: project "FinalWebsite" (ref `quhofmpsagvylbywuqyo`), org admin@chaostournaments.com's
Org — a separate org/project from the "Chaos Tournaments" production project that backs the
existing chaostournaments.com (see item 1). URL, anon key, and service role key are in
`.env` (gitignored, not in the repo/zip). `schema.sql` has been run — see
[integrations.md](./integrations.md).

## 3. ~~Discord OAuth app~~ — resolved 2026-08-07

Using the existing "Chaos Tournaments" Discord application (Client ID
`1524107620040966355`), Client ID + Secret saved in Supabase's Discord provider config,
redirect URI `https://quhofmpsagvylbywuqyo.supabase.co/auth/v1/callback` registered.
Verified reaching Discord's consent screen on the live site. See
[integrations.md](./integrations.md).

## 4. ~~VPS access~~ — resolved 2026-08-07

Deployed to the existing DigitalOcean droplet ("chaos-website", `192.241.158.223`) via a
dedicated deploy-only SSH key, run from the operator's own Mac Terminal (the build
sandbox can't reach the VPS's network directly). See [deployment.md](./deployment.md)
for the full process.

## 5. Firecrawl hosting

Start on the hosted API (needs `FIRECRAWL_API_KEY`), or self-host on the VPS from day one?
Recommendation: hosted API first, self-host later if volume/cost justifies it.

## 6. ~~Full Discord login end-to-end test~~ — resolved 2026-08-07

Confirmed live: session created, user lands on a real `/dashboard` page (added, not a
PlaceholderPage), Discord avatar/username display correctly, and the `user_profiles` row
was created via the `handle_new_user()` trigger.

Two bugs found and fixed on the way here:

- Supabase Auth's Site URL was still the `localhost:3000` default — redirected there
  instead of the live domain after Discord approval. Fixed in Supabase's URL
  Configuration (Site URL + Redirect URLs updated to chaostournaments.com).
- `src/app/auth/callback/route.ts` derived its redirect origin from `request.url`, which
  resolved to the container's own bind address (`0.0.0.0:3000`) behind the Caddy reverse
  proxy instead of the public domain. Fixed by preferring `NEXT_PUBLIC_SITE_URL` over the
  request-derived origin.
- `/dashboard` didn't exist yet (404) — added a real page (not a placeholder) that reads
  the session and `user_profiles` row server-side.

## 7. `deploy/deploy.sh` and DEPLOY.md are stale

Both assume nginx + certbot, which isn't what's actually running (the VPS uses Caddy).
The real deploy process was done by hand via rsync/scp — see
[deployment.md](./deployment.md). Worth deciding whether to rewrite these to match
reality or remove them.

## 8. ~~Phase 2: teams, rosters, tournament registration~~ — resolved 2026-08-07

Live and tested end-to-end on production: create a team (`/teams/new`), captain-only
roster management with add-by-Discord-username-or-display-name (`/teams/[slug]`), browse
tournaments (`/tournaments`), and register a team for one (`/tournaments/[slug]`). Schema
added via `supabase/schema_phase2.sql` (tournaments + tournament_registrations, additive
to schema.sql). No entry-fee/payment splitting yet (Sections 7-9, 52 — Phase 3/Stripe);
registrations land in `pending_review` or `awaiting_roster` as a placeholder state.

**Known gap — resolved 2026-08-07, see item 9 below:** admin tournament creation now
exists.

## 9. ~~Admin tournament creation + Discord automation~~ — resolved 2026-08-07

**Admin form:** `/admin/tournaments/new`, gated by a new `is_admin` boolean on
`user_profiles` (`supabase/schema_admin.sql`). No role-management UI — admins are set
via a manual SQL `update`. The create action (`src/lib/actions/admin.ts`) checks
`is_admin` in application code, then inserts using the service-role client
(`createAdminClient()`) since there's no admin RLS policy on `tournaments` yet. Tested
live: created a real tournament, registered a real team against it, status correctly
computed as `awaiting_roster`.

**Discord automation:** webhook-based (not a full bot — see
[integrations.md](./integrations.md) for why), posting to `#announcements` via a
"Chaos Announcer" webhook. Fires on team creation, tournament creation, and tournament
registration. Tested live — a real team-creation event produced a real message in
Discord.

**Gotcha hit along the way:** the roster-add lookup (`addTeamMember`) originally matched
only `discord_username`, but Discord's newer unique-username system leaves that field
`null` for some accounts — only `discord_display_name` is reliably populated. Fixed to
match either field, case-insensitively, via two separate queries (not a single `.or()`
filter, to avoid special characters in user input breaking PostgREST's filter syntax).

## 10. ~~Admin dashboard: edit tournaments + approve registrations~~ — resolved 2026-08-07

Live: `/admin` (hub — lists all tournaments including drafts, shows a pending-review
count), `/admin/tournaments/[slug]/edit` (edit description/fees/prizes/start date, change
status draft → open → closed → in_progress → completed/cancelled, and approve or reject
`pending_review` registrations). All admin-only via the same `is_admin` + service-role
pattern as tournament creation. Tested live: created a tournament, opened it, registered
a team, confirmed it appears on the admin edit page.

**Bug hit and fixed:** after saving a status change, the status `<select>` visually
reverted to its old value even though the database write succeeded — a classic React
quirk where `defaultValue` on an already-mounted uncontrolled input doesn't re-apply
after the surrounding server component refreshes with new data (`revalidatePath` doesn't
remount the client component). Fixed by keying `EditTournamentForm` on the tournament's
`updated_at` timestamp, forcing a remount (and fresh `defaultValue`) on every successful
save.

**Not tested live:** the Approve/Reject buttons themselves — reaching `pending_review`
requires a team with 5 confirmed starters, which needs 5 real Discord accounts to set up
as a live test. The underlying action (`setRegistrationStatus`) follows the same
service-role-update + `revalidatePath` + `notifyDiscord` pattern already verified working
elsewhere (`removeTeamMember`, `withdrawRegistration`), so this is lower-risk than
untested code usually is, but worth a manual click-test once a real 5-player team exists.

## 11. ~~Bracket engine~~ — resolved 2026-08-07

Live: `/admin/tournaments/[slug]/edit` generates a single-elimination bracket from
`approved` registrations once there are ≥2 (`supabase/schema_bracket.sql` adds a
`matches` table). `/tournaments/[slug]/bracket` is the public view, with admin-only
"Report winner" buttons on matches that are `ready`.

Tested live end-to-end on a real 5-team "Bracket Test Cup" tournament (worked around the
single-real-Discord-account limitation by SQL-forcing all 5 registrations to `approved`,
since bracket generation only needs `approved`, not the 5-starter `pending_review` path
from item 10 above): generated the bracket, reported the Quarterfinal, both Semifinals
(one already fully populated from a cascading bye), and the Championship — winner
propagation into each next match was correct at every step, and the tournament reached
`completed` with the winning team's registration set to `winner` and the runner-up's to
`runner_up`. Test data has been deleted from production.

**Known limitation, deliberate scope cut:** results are admin-reported only
(`result_type: admin_decision`) — no team-side score submission or two-party
confirmation (Section 29 of the brief). Fine for a hands-on admin running a small
bracket; revisit if event volume grows.

**Next candidate gaps, not yet started:** Stripe-backed entry fees/payouts (Sections
7-9, 52), and a real Discord bot (slash commands, check-in reminders) now that there's
enough match state to make one useful — see item 9 above and
[integrations.md](./integrations.md).
