#!/usr/bin/env sh
# Local workerd preview (dev/staging). Production deploys via `npm run deploy`.
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$ROOT_DIR"

PERSIST_DIR="${WRANGLER_PERSIST_DIR:-.wrangler/state}"
WRANGLER_CONFIG_DIR="${XDG_CONFIG_HOME:-$ROOT_DIR/.wrangler/config}"
HOST_IP="${HOST_IP:-0.0.0.0}"
PORT="${PORT:-3000}"

mkdir -p "$PERSIST_DIR"
mkdir -p "$WRANGLER_CONFIG_DIR"
export XDG_CONFIG_HOME="$WRANGLER_CONFIG_DIR"

if [ ! -f .open-next/worker.js ]; then
  npm run cf:build
fi

npx wrangler d1 migrations apply ragbaz-cc-accounts \
  --env staging \
  --local \
  --persist-to "$PERSIST_DIR"

exec npx opennextjs-cloudflare preview \
  --env staging \
  --ip "$HOST_IP" \
  --port "$PORT" \
  --persist-to "$PERSIST_DIR"
