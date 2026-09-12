# Deploying Chaos Tournaments to the VPS

This project builds as a Docker image (multi-stage, Next.js "standalone" output) and runs
behind an Nginx reverse proxy with Let's Encrypt TLS.

**Before the first deploy:** chaostournaments.com is already live (see
`docs/wiki/open-questions.md`). Confirm whether this build replaces that deployment before
pointing `deploy.sh` at production — don't assume the VPS/domain target is empty.

## One-time VPS setup

```bash
# Docker + Compose plugin
curl -fsSL https://get.docker.com | sh
apt-get install -y docker-compose-plugin nginx certbot python3-certbot-nginx

# App directory
mkdir -p /opt/chaos-tournaments
```

## Deploy

**Option A — one command, from this machine:**

```bash
VPS_HOST=1.2.3.4 VPS_USER=deploy VPS_SSH_KEY_PATH=~/.ssh/id_ed25519 ./deploy/deploy.sh
```

This rsyncs the project to `/opt/chaos-tournaments` on the VPS and runs
`docker compose up -d --build` remotely. It will stop and tell you if `.env` is missing on
the remote host the first time — see step 2 below.

**Option B — manual:**

1. Copy this project to the VPS (git clone or rsync) into `/opt/chaos-tournaments`.
2. Create `/opt/chaos-tournaments/.env` from `.env.example` with real values.
3. Build and start:

   ```bash
   cd /opt/chaos-tournaments
   docker compose up -d --build
   ```

4. Wire up Nginx:

   ```bash
   cp deploy/nginx-chaostournaments.conf /etc/nginx/sites-available/chaostournaments.com
   # edit the server_name to match your real domain
   ln -s /etc/nginx/sites-available/chaostournaments.com /etc/nginx/sites-enabled/
   nginx -t && systemctl reload nginx
   ```

5. Point your domain's DNS A record at the VPS's IP, then issue a certificate:

   ```bash
   certbot --nginx -d chaostournaments.com -d www.chaostournaments.com
   ```

## Redeploying after changes

```bash
cd /opt/chaos-tournaments
git pull   # or re-sync files
docker compose up -d --build
```

## Notes

- The container listens on `127.0.0.1:3000` only (via Docker's default bridge + Nginx
  proxying to the host-mapped port); it is never exposed directly to the internet.
- Environment variables (Supabase, Discord, Stripe keys) live in `.env` on the VPS only —
  never commit `.env` to git (already covered by `.gitignore`).
- `next.config.ts` sets `output: "standalone"`, which is what makes the Docker image small
  and self-contained (no need for `node_modules` at runtime beyond what's traced in).
