#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
env_file="$repo_root/.env.graphql-sync.local"

if [[ -e "$env_file" ]]; then
  printf 'graphql sync env already exists at %s\n' "$env_file"
  exit 0
fi

umask 077
{
  printf 'GRAPHQL_SYNC_ENDPOINT=https://ragbaz.cc/api/graphql\n'
  printf 'GRAPHQL_SYNC_KEY='
  xkcd-password --numWords 6 --minLength 5 --maxLength 8 --separator -
  printf 'GRAPHQL_SYNC_WORKSPACE_ROOT=/data/src\n'
} >"$env_file"

printf 'created %s\n' "$env_file"
