# Integrations

Full detail in Master Build Brief [Section 61](../MASTER_BUILD_BRIEF.md#61-addendum-extended-integrations).

## Discord

Primary login identity (via Supabase Auth OAuth) and community/notification layer. See
Section 4 and Section 49 of the brief. Code: `src/lib/supabase/`, login flow at `/login` and
`/auth/callback`.

**Status: connected and verified end-to-end.** Using the existing "Chaos Tournaments"
Discord application (Client ID `1524107620040966355`). Client ID/Secret are saved in
Supabase's Auth > Providers > Discord, and the redirect URI below is registered in
Discord's OAuth2 settings. Verified 2026-08-07 by actually logging in on the live site:
session created, lands on `/dashboard`, `user_profiles` row populated via
`handle_new_user()`. Note: newer Discord accounts on the unique-username system often
have a `null` `discord_username` — only `discord_display_name` gets populated. Any
lookup against `user_profiles` (see roster-add below) needs to check both.

### Discord automation (webhooks) — "hands-off for owner"

**Status: live.** `src/lib/discord.ts` exports `notifyDiscord(content)`, which POSTs to a
Discord webhook URL (`DISCORD_WEBHOOK_URL` env var). Currently wired into:

- Team creation (`src/lib/actions/teams.ts`)
- Tournament registration (`src/lib/actions/tournaments.ts`)
- Tournament creation, status changes to `open`, and registration approve/reject —
  admin-only (`src/lib/actions/admin.ts`)

Configured webhook: "Chaos Announcer" posting to `#announcements` in the Discord server.
If `DISCORD_WEBHOOK_URL` is unset, `notifyDiscord` logs and no-ops rather than throwing —
the app works fine without it, notifications just don't go out.

**This is a webhook, not a bot** — a deliberate scope call for one-way "notify the channel
when X happens," kept separate from the actual bot below.

### Discord bot (Section 49, scoped subset)

**Status: built, not yet deployed.** See
[Section 67](../MASTER_BUILD_BRIEF.md#67-addendum-discord-bot-phase-8-scoped-subset) for
the full writeup. Standalone project at `bot/` — discord.js, its own Docker service, its
own bot token, talks to the same Supabase project as the Next.js app via the service-role
key.

Scoped to what maps to real features today: slash commands `/roster`, `/bracket`,
`/match-status`, `/rules`, `/payment-status`; role automation (Team Captain, Starter,
Registered, Tournament Winner, Tournament Runner-Up — triggered by the Next.js app calling
the bot's internal API, not by the bot polling); check-in reminder DMs (no formal check-in
gate exists yet, so this is informational only).

Deliberately does **not** implement Section 49's full command list yet
(`/checkin`, `/entries`, `/sponsor-entry`, `/report-score`, `/confirm-score`, `/dispute`,
`/accept-grudge`, `/decline-grudge`) — those need a formal check-in flow, per-slot entry
funding, two-party match confirmation, and the Grudge Matches feature, none of which exist
yet (Grudge Matches is currently just a placeholder page). Revisit once those land.

Before deploying: reuse the existing "Chaos Tournaments" Discord application (Developer
Portal → your app → Bot tab → Add Bot, or reuse if already added) rather than creating a
new one — one Discord application can have both the OAuth2 login flow already in use and a
bot user. Needs the bot invited to the server with `bot` + `applications.commands` scopes
and `Manage Roles` + `Send Messages` permissions, and its role positioned above the roles
it manages in the server's role list (Discord won't let a bot manage roles above its own).

## Supabase

Source of truth for all users, teams, tournaments, payments, entitlements, etc. (Section 20).
Schema for Phase 1 lives in `supabase/schema.sql`. Client setup in `src/lib/supabase/`.

**Status: connected and schema applied.** Project "FinalWebsite" (org: admin@chaostournaments.com's
Org), ref `quhofmpsagvylbywuqyo` (https://quhofmpsagvylbywuqyo.supabase.co). URL/anon/
service-role keys are in `.env` (gitignored — not committed, not in the shared zip).
`supabase/schema.sql` has been run against it (via the SQL Editor, with RLS enabled) —
`platforms`, `games`, `user_profiles`, `teams`, and `team_members` all exist. Additive
migrations applied so far: `supabase/schema_phase2.sql` (`tournaments`,
`tournament_registrations`), `supabase/schema_admin.sql` (`is_admin` boolean on
`user_profiles`, manually set per-user via SQL — no role-management UI yet),
`supabase/schema_bracket.sql` (`matches`), and `supabase/schema_payments.sql`
(`platform_settings`, `registration_payments`, `tournament_payouts`, Connect fields on
`user_profiles`). Not yet applied: `supabase/schema_discord_bot.sql` (adds
`reminder_sent_at` to `tournament_registrations` for the bot's check-in reminders).

Redirect URI for the Discord provider (Auth > URL Configuration, and in Discord's own
OAuth2 > Redirects): `https://quhofmpsagvylbywuqyo.supabase.co/auth/v1/callback`

Note: the sandbox this build runs in can't reach `supabase.co` directly (network
allowlist), so any future schema changes need to be run by hand the same way — SQL Editor
→ paste → Run — rather than automatically.

## Stripe

**Status: live in test mode**, deployed 2026-08-07. Phase 3 per Section 56 — see
[Section 66](../MASTER_BUILD_BRIEF.md#66-addendum-stripe-entry-fees--prize-payouts-phase-3)
for the full model. Client: `src/lib/stripe.ts`. Verified end-to-end on production: a test
team registration went through Checkout, paid with a test card, and the webhook correctly
flipped it to `pending_review`.

**Deploy gotcha hit and fixed:** the webhook endpoint was initially created in a different
Stripe sandbox ("Chaos Tournaments sandbox", auto-created when connecting the Stripe MCP
tool in a separate Claude Code session) than the one whose keys were configured on the VPS.
Symptom was silent — no error anywhere, just zero webhook deliveries ever showing up, because
the payment succeeded in a completely different, isolated sandbox account than the one the
webhook was listening on. Fixed by pointing the VPS's `STRIPE_SECRET_KEY` /
`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` at the same sandbox the webhook lives in (`Developers →
API keys`, compare the key prefix to what's in `.env`). Worth checking this alignment first
if a webhook ever looks like it's "not receiving events" with no other explanation.

Before this goes live with real money:

1. Run `supabase/schema_payments.sql` against the FinalWebsite Supabase project (SQL
   Editor — same manual process as the other migrations, since the sandbox can't reach
   `supabase.co` directly).
2. Switch to live-mode Stripe keys in the VPS's `.env`.
3. In the Stripe Dashboard (live mode), add a webhook endpoint at
   `https://chaostournaments.com/api/stripe/webhook` subscribed to
   `checkout.session.completed` and `account.updated`, then set the resulting signing
   secret as `STRIPE_WEBHOOK_SECRET` on the VPS. Test-mode and live-mode webhooks are
   separate — the test-mode one (if configured) won't fire for live payments.
4. Confirm the connected Stripe account has Connect enabled (Express accounts,
   `transfers` capability) — needed for prize payouts.

## n8n

Workflow automation: confirmation emails, Discord notifications, reminders, Sheets sync
(Section 3). Not yet configured — needs an n8n instance (self-hosted on the VPS or n8n
Cloud) and webhook endpoints from the Next.js app.

## Firecrawl

Open-source web-data API (turns pages into LLM-ready markdown/JSON). Client wrapper:
`src/lib/firecrawl.ts`. Env: `FIRECRAWL_API_KEY` (hosted) or `FIRECRAWL_API_URL`
(self-hosted).

Use it for:

- Enriching tournament/grudge-match pages with external game data (patch notes, ranked
  leaderboard snapshots) via scheduled n8n crawls.
- Opponent/team research pulled into grudge-match matchmaking.

Self-hosting (optional, later): Docker Compose stack (API + Redis + RabbitMQ + Postgres +
Playwright-service) — see the Firecrawl repo's `docker-compose.yml` if/when self-hosting on
the VPS makes sense instead of the hosted API.

## Higgsfield

AI video/image generation (text/image prompt to short cinematic clip, camera controls).
Client wrapper: `src/lib/higgsfield.ts`. Env: `HIGGSFIELD_API_KEY`.

Use it for:

- Auto-generated tournament hype/announcement clips and highlight recaps, triggered by n8n
  on tournament completion.
- On-brand social thumbnail variations per tournament.

Slots into Phase 8 (Discord and Automation) — not needed for the current phase.

## Google Sheets

Administrative reporting mirror only (Section 50). Never the source of truth.
