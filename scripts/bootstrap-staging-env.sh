#!/usr/bin/env sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$ROOT_DIR"

ENV_FILE="${1:-$ROOT_DIR/.env.staging.local}"

if [ -e "$ENV_FILE" ]; then
  printf 'staging env already exists at %s\n' "$ENV_FILE"
  exit 0
fi

XKCD_PASSWORD_BIN="${XKCD_PASSWORD_BIN:-}"

if [ -z "$XKCD_PASSWORD_BIN" ] && command -v xkcd-password >/dev/null 2>&1; then
  XKCD_PASSWORD_BIN="$(command -v xkcd-password)"
fi

if [ -z "$XKCD_PASSWORD_BIN" ] && [ -x "${HOME:-}/.volta/bin/xkcd-password" ]; then
  XKCD_PASSWORD_BIN="${HOME}/.volta/bin/xkcd-password"
fi

if [ -z "$XKCD_PASSWORD_BIN" ]; then
  printf 'xkcd-password is required to create %s\n' "$ENV_FILE" >&2
  exit 1
fi

umask 077
{
  printf 'SESSION_SECRET='
  "$XKCD_PASSWORD_BIN" --numWords 6 --minLength 5 --maxLength 8 --separator -
  printf 'GRAPHQL_SYNC_KEY=\n'
  printf 'RESEND_API_KEY=\n'
} >"$ENV_FILE"

printf 'created %s\n' "$ENV_FILE"
