#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/../.." && pwd)
ENV_FILE=${1:-"$SCRIPT_DIR/private-origin.env"}

if [ -f "$ENV_FILE" ]; then
  # shellcheck disable=SC1090
  . "$ENV_FILE"
fi

: "${RAGBAZ_ORIGIN_KONSONANS_IP:?Set RAGBAZ_ORIGIN_KONSONANS_IP in private-origin.env}"
: "${RAGBAZ_READER_MO_IP:?Set RAGBAZ_READER_MO_IP in private-origin.env}"
: "${RAGBAZ_READER_QUUX1TAB_IP:?Set RAGBAZ_READER_QUUX1TAB_IP in private-origin.env}"

command -v docker >/dev/null 2>&1 || { echo "docker is required" >&2; exit 1; }
command -v tailscale >/dev/null 2>&1 || { echo "tailscale is required" >&2; exit 1; }

if ! tailscale ip -4 | grep -Fx "$RAGBAZ_ORIGIN_KONSONANS_IP" >/dev/null 2>&1; then
  echo "Refusing deployment: this host does not own Tailscale IP $RAGBAZ_ORIGIN_KONSONANS_IP" >&2
  exit 1
fi

POLICY_OUT="$SCRIPT_DIR/tailscale-policy.rendered.hujson"
sed \
  -e "s|\${RAGBAZ_READER_MO_IP}|$RAGBAZ_READER_MO_IP|g" \
  -e "s|\${RAGBAZ_READER_QUUX1TAB_IP}|$RAGBAZ_READER_QUUX1TAB_IP|g" \
  -e "s|\${RAGBAZ_ORIGIN_KONSONANS_IP}|$RAGBAZ_ORIGIN_KONSONANS_IP|g" \
  "$SCRIPT_DIR/tailscale-policy.fragment.hujson" > "$POLICY_OUT"
chmod 600 "$POLICY_OUT"

cd "$REPO_ROOT"
docker compose -f deploy/security-school-private-origin/compose.yaml up -d --build

curl -fsS http://127.0.0.1:8788/school/security/ >/dev/null
sudo tailscale serve --yes --bg --https=443 http://127.0.0.1:8788

echo
echo "Private origin is running on konsonans."
echo "Apply/merge the rendered Tailscale grant from:"
echo "  $POLICY_OUT"
echo
echo "Tailscale Serve status:"
tailscale serve status
