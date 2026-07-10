#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
git -C "$repo_root" config core.hooksPath .githooks
chmod +x "$repo_root/.githooks/post-commit"
printf 'installed git hooks at %s/.githooks\n' "$repo_root"
