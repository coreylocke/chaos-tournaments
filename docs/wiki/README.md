# Chaos Tournaments — Wiki

Living documentation for the build. The full spec lives in
[`../MASTER_BUILD_BRIEF.md`](../MASTER_BUILD_BRIEF.md) (Sections 1-59 original, 60-67
addendum). This wiki breaks the addendum and ongoing decisions into focused pages.

- [Tech stack](./tech-stack.md)
- [Frontend experience](./frontend-experience.md)
- [Integrations](./integrations.md)
- [Deployment](./deployment.md)
- [Open questions](./open-questions.md)

## Status snapshot

| Area | Status |
|---|---|
| Frontend shell + branding | **Live at [chaostournaments.com](https://chaostournaments.com)** |
| One-page scroll homepage (Three.js + scroll animation) | Done, live |
| Supabase project | **Connected + schema applied** — project "FinalWebsite" (`quhofmpsagvylbywuqyo`) |
| Discord OAuth | **Live and verified end-to-end** — real login on the deployed site creates a session, lands on `/dashboard`, and populates `user_profiles` via the DB trigger. |
| Firecrawl / Higgsfield | Client stubs scaffolded, not yet wired into n8n |
| VPS deploy | **Done** — deployed 2026-08-07 to the existing DigitalOcean droplet, reusing its Caddy + Docker Compose setup. See [deployment.md](./deployment.md). |
| Teams, rosters, tournament registration (Phase 2) | **Live** — create a team, manage roster (add/remove by Discord username or display name), browse tournaments, register a team. No payments yet. |
| Admin dashboard | **Live** — `/admin` (tournament list + pending-registration count), `/admin/tournaments/new` (create), `/admin/tournaments/[slug]/edit` (edit details/status + approve/reject registrations). Gated by an `is_admin` flag on `user_profiles` (set manually via SQL, no role-management UI yet). |
| Discord automation | **Live** — webhook notifications ("Chaos Announcer" → `#announcements`) fire on team creation, tournament creation, tournament registration, registration approval/rejection, bracket generation, and match results (including a championship notification). |
| Bracket engine | **Live** — `/admin/tournaments/[slug]/edit` generates a single-elimination bracket from `approved` registrations (standard seeding, automatic byes); `/tournaments/[slug]/bracket` shows the public bracket with admin-only result reporting. Verified live end-to-end on a real 5-team test tournament through to `completed`/`winner`/`runner_up`. Admin-reported results only, no team-side score submission. |
| Payments / payouts (Phases 3, 8-9 of the brief) | **Live in test mode** — Stripe Checkout charges a flat entry fee per team registration (admin-editable at `/admin/settings`, starts at $5). Verified end-to-end on production: register → pay with a test card → webhook flips registration to `pending_review`. On tournament completion, the platform takes a cut and splits the rest 70/30 winner/runner-up to whoever paid each team's fee, paid out automatically via Stripe Connect once they complete onboarding from `/dashboard`. See [Section 66](../MASTER_BUILD_BRIEF.md#66-addendum-stripe-entry-fees--prize-payouts-phase-3). Still on test-mode keys — needs live keys + a live-mode webhook before real money moves. |
| Discord bot (Phase 8, scoped subset) | **Built, not yet deployed** — standalone `bot/` Docker service (discord.js). Slash commands `/roster`, `/bracket`, `/match-status`, `/rules`, `/payment-status`; role automation for Team Captain/Starter/Registered/Tournament Winner/Runner-Up; check-in reminder DMs (informational only, no formal check-in flow exists yet). Deliberately doesn't implement Section 49's full command list — several of those commands need features that don't exist yet (check-in flow, two-party score confirmation, grudge matches). See [Section 67](../MASTER_BUILD_BRIEF.md#67-addendum-discord-bot-phase-8-scoped-subset). Needs a bot token, guild ID, and the new Docker service deployed. |
