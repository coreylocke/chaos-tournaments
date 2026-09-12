#!/usr/bin/env bash
#
# Deploys this project to the VPS: rsyncs the source (excluding node_modules/.next/.git)
# over SSH, then runs `docker compose up -d --build` remotely.
#
# Required env vars:
#   VPS_HOST          e.g. 203.0.113.10 or chaostournaments.com
#   VPS_USER          SSH username, e.g. deploy
#   VPS_SSH_KEY_PATH  path to the private key, e.g. ~/.ssh/chaos_vps_ed25519
#
# Optional env vars (sane defaults shown):
#   VPS_PORT=22
#   VPS_APP_DIR=/opt/chaos-tournaments
#
# Usage:
#   VPS_HOST=1.2.3.4 VPS_USER=deploy VPS_SSH_KEY_PATH=~/.ssh/id_ed25519 ./deploy/deploy.sh

set -euo pipefail

: "${VPS_HOST:?Set VPS_HOST}"
: "${VPS_USER:?Set VPS_USER}"
: "${VPS_SSH_KEY_PATH:?Set VPS_SSH_KEY_PATH}"
VPS_PORT="${VPS_PORT:-22}"
VPS_APP_DIR="${VPS_APP_DIR:-/opt/chaos-tournaments}"

SSH_OPTS=(-i "$VPS_SSH_KEY_PATH" -p "$VPS_PORT" -o StrictHostKeyChecking=accept-new)
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "==> Ensuring $VPS_APP_DIR exists on $VPS_HOST"
ssh "${SSH_OPTS[@]}" "$VPS_USER@$VPS_HOST" "mkdir -p '$VPS_APP_DIR'"

echo "==> Syncing project files"
rsync -az --delete \
  -e "ssh -i $VPS_SSH_KEY_PATH -p $VPS_PORT -o StrictHostKeyChecking=accept-new" \
  --exclude node_modules \
  --exclude .next \
  --exclude .git \
  --exclude .env \
  "$PROJECT_ROOT/" "$VPS_USER@$VPS_HOST:$VPS_APP_DIR/"

echo "==> Checking for .env on the remote host"
if ! ssh "${SSH_OPTS[@]}" "$VPS_USER@$VPS_HOST" "test -f '$VPS_APP_DIR/.env'"; then
  echo "!! No .env found at $VPS_APP_DIR/.env on the remote host."
  echo "!! Copy .env.example there, fill in real values, then re-run this script."
  exit 1
fi

echo "==> Building and starting the container"
ssh "${SSH_OPTS[@]}" "$VPS_USER@$VPS_HOST" "cd '$VPS_APP_DIR' && docker compose up -d --build"

echo "==> Done. Check status with:"
echo "    ssh -i $VPS_SSH_KEY_PATH -p $VPS_PORT $VPS_USER@$VPS_HOST 'cd $VPS_APP_DIR && docker compose ps'"
