# Deployment

**Status: live** at [chaostournaments.com](https://chaostournaments.com), deployed 2026-08-07.

## Actual setup (VPS)

The VPS (`192.241.158.223`, DigitalOcean droplet "chaos-website") already had a working
production stack from a prior build, at `~/chaos-site`. Rather than replace it, this
deploy reused it as-is:

- **Docker Compose**, two services: `app` (this Next.js project, `build: .`) and `caddy`
  (`caddy:2-alpine`, ports 80/443).
- **Caddy 2** handles the reverse proxy and automatic HTTPS — no nginx, no certbot. The
  `Caddyfile` on the server just does `reverse_proxy app:3000` for
  `chaostournaments.com, www.chaostournaments.com`.
- The Dockerfile in this repo (multi-stage, Next.js `output: "standalone"`) replaced the
  server's previous Dockerfile; `docker-compose.yml`, `Caddyfile`, and `.env` on the
  server were left untouched during the code sync so the working infra wasn't disturbed.

`deploy/deploy.sh` and the nginx/certbot notes below were the original plan before the
existing Caddy setup was discovered on the server — **not what's actually running**. Left
in the repo for reference but should probably be removed or rewritten to match Caddy.

## How the deploy was actually done

No CI/CD yet — manual, from the operator's own Mac Terminal (the build sandbox can't
reach the VPS's network):

1. SSH key pair generated for deploy access, public key appended to the VPS's
   `root/.ssh/authorized_keys`.
2. Existing `~/chaos-site` backed up on the server: `cp -a ~/chaos-site
   ~/chaos-site-backup-<timestamp>`.
3. Project files synced to `~/chaos-site` via `rsync -az --delete`, excluding
   `node_modules`, `.next`, `.git`, `.DS_Store`, and — deliberately — `docker-compose.yml`,
   `Caddyfile`, and `.env` (kept the server's working copies).
4. New `.env` (FinalWebsite Supabase + Discord app credentials) pushed separately via `scp`.
5. `docker compose up -d --build` on the server to rebuild the `app` image and recreate
   both containers.

One issue hit and fixed: files synced via `rsync` from macOS carried `600` (owner-only)
permissions, which the container's non-root `nextjs` user couldn't read — this broke
`public/logos/*` (served as HTTP 400). Fixed with `chmod 644` on files / `755` on
directories under `~/chaos-site/public`, then rebuilt. Worth setting correct permissions
at the source next time to avoid the extra rebuild.

## Verified after deploy

- Site loads at `https://chaostournaments.com` with valid HTTPS (Caddy-issued cert).
- Logo/branding assets render correctly.
- "Login with Discord" reaches Discord's real OAuth consent screen with the correct
  Client ID (`1524107620040966355`) and redirect URI
  (`https://quhofmpsagvylbywuqyo.supabase.co/auth/v1/callback`) — confirms the Supabase
  Discord provider credentials are saved correctly. Full login (creating a session,
  landing on `/dashboard`) hasn't been completed end-to-end yet since that requires
  signing in with a real Discord account.

## Next steps

- Do a real Discord login end-to-end and confirm a `user_profiles` row gets created.
- Decide whether to update `deploy/deploy.sh` to match the real Caddy-based setup (for
  future deploys) or replace it with a simpler rsync+ssh script matching what was
  actually run.
- Consider a non-root-friendly permissions step (`chmod` before rsync, or `--chmod` flag
  on rsync itself) to avoid the permissions issue on future deploys.

## Stripe deploy checklist

**Status: done for test mode**, deployed 2026-08-07 and verified end-to-end (test
registration → Checkout → webhook → `pending_review`). See
[integrations.md](./integrations.md#stripe) for the sandbox-mismatch gotcha hit along the
way. Remaining before real money can move:

1. ~~Run `supabase/schema_payments.sql` against production Supabase.~~ Done.
2. ~~Add Stripe test keys + webhook secret to the VPS `.env`.~~ Done.
3. Switch `STRIPE_SECRET_KEY` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` to live-mode keys, and
   configure a **live-mode** webhook endpoint in the Stripe Dashboard (test and live
   webhooks are separate) with its own signing secret in `STRIPE_WEBHOOK_SECRET`.
4. Rebuild/redeploy (`docker compose up -d --build`) — required any time
   `NEXT_PUBLIC_*` vars change, since those get baked in at build time, not just read at
   runtime.

Note when repeating this rsync+rebuild cycle: every full-project sync from macOS re-triggers
the same `600`/`700` permissions gotcha noted above (this time it showed up as
`EACCES: permission denied, scandir '/app/public/icons'` crash-looping the container) — run
the `chmod 644`/`755` fix after every rsync, before rebuilding, not just once.

## Discord bot deploy checklist (not yet deployed)

See [Section 67](../MASTER_BUILD_BRIEF.md#67-addendum-discord-bot-phase-8-scoped-subset)
for the full writeup of what's built.

1. In the Discord Developer Portal, open the existing "Chaos Tournaments" application (the
   one already used for OAuth login) → **Bot** tab → Add Bot (if not already added) →
   reset/copy the bot token.
2. Get the server's Guild ID: enable Developer Mode in Discord (User Settings → Advanced),
   then right-click the server icon → Copy Server ID.
3. Generate an invite URL (OAuth2 → URL Generator) with scopes `bot` +
   `applications.commands`, permissions `Manage Roles` + `Send Messages`, and use it to add
   the bot to the server. Afterward, drag the bot's role above whichever roles it needs to
   manage in Server Settings → Roles — Discord won't let a bot assign/remove a role
   positioned above its own highest role.
4. Run `supabase/schema_discord_bot.sql` against production Supabase (adds
   `reminder_sent_at`).
5. Add `DISCORD_BOT_TOKEN`, `DISCORD_GUILD_ID`, `BOT_INTERNAL_SECRET` (make up any long
   random string for this last one) to the VPS's `.env`. Don't set `BOT_INTERNAL_URL` —
   `docker-compose.yml` sets it automatically for the `web` service.
6. Sync the `bot/` directory and updated `docker-compose.yml` to the VPS the same way the
   rest of the code gets synced (full-project rsync, excluding the same files as always).
7. `docker compose up -d --build` — builds and starts the new `bot` service alongside
   `web` and `caddy`.
8. Register the slash commands (one-off, only needs re-running when commands change):
   `docker compose exec bot node dist/registerCommands.js`.
