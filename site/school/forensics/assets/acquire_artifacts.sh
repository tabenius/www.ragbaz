#!/usr/bin/env bash
#
# acquire_artifacts.sh — Live Android artifact acquisition (READ-ONLY)
#
# Part of the RAGBAZ forensics school toolchain. Where apts.sh does triage and
# apts_tui.py does boot-chain imaging, this collector pulls the broad set of
# LIVE forensic artifacts from a running, authorized Android device you own —
# logs, dumpsys state, package/APK inventory, settings, network state, and
# (with root or run-as) app-private data.
#
# SCOPE / SAFETY
#   * Authorized, owned devices only. Read-only: it never writes, flashes,
#     unlocks, or roots the device.
#   * Requires USB debugging (developer mode). Some artifacts require root (su)
#     or run-as on a debuggable app; the script detects access and skips what
#     it cannot read, telling you why.
#   * PII artifacts (SMS/MMS/call log/contacts/calendar) are OPT-IN. They are
#     acquired only if you pass --include-pii, because they contain personal
#     data of the device owner and their contacts. Handle as case material.
#
# USAGE
#   ./acquire_artifacts.sh                 # standard artifacts
#   ./acquire_artifacts.sh --include-pii   # also query content providers (PII)
#   ./acquire_artifacts.sh --bugreport     # also capture a full bugreport (slow)
#
set -uo pipefail

INCLUDE_PII=0
DO_BUGREPORT=0
for arg in "$@"; do
  case "$arg" in
    --include-pii) INCLUDE_PII=1 ;;
    --bugreport)   DO_BUGREPORT=1 ;;
    -h|--help) grep '^#' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "[!] unknown arg: $arg"; exit 1 ;;
  esac
done

command -v adb >/dev/null 2>&1 || { echo "[!] adb not found. Install platform-tools."; exit 1; }

echo "==============================================================="
echo " Live Android artifact acquisition (read-only)"
echo "==============================================================="
echo " Authorization: examine only devices you own or are authorized to test."
read -r -p " Type 'I AM AUTHORIZED' to continue: " AUTH
[ "$AUTH" = "I AM AUTHORIZED" ] || { echo "[!] Aborting."; exit 1; }

echo "[*] Waiting for an authorized device (unlock + accept RSA prompt)..."
adb wait-for-device
[ "$(adb get-state 2>/dev/null)" = "device" ] || { echo "[!] no authorized device."; exit 1; }

SERIAL=$(adb get-serialno 2>/dev/null | tr -d '[:space:]')
TS=$(date +%Y%m%d_%H%M%S)
OUT="artifacts_${SERIAL}_${TS}"
mkdir -p "$OUT"/{logs,dumpsys,packages,settings,network,appdata,providers,root}
echo "[*] Output: $OUT"

save()  { adb shell "$1" > "$OUT/$2" 2>&1; }        # capture shell cmd
suget() { adb shell "su -c '$1'" 2>/dev/null; }     # run as root, quiet

# ---- access-mode detection -------------------------------------------------
ROOT=0
if adb shell "su -c id" 2>/dev/null | grep -q "uid=0"; then ROOT=1; fi
echo "[*] Access mode: adb $( [ $ROOT -eq 1 ] && echo '+ root (su)' || echo '(no root)' )"

# ---------------------------------------------------------------------------
# 1. Device fingerprint
# ---------------------------------------------------------------------------
echo "[1] Fingerprint"
{
  for p in ro.product.model ro.product.manufacturer ro.build.version.release \
           ro.build.version.sdk ro.build.version.security_patch \
           ro.build.fingerprint ro.boot.verifiedbootstate ro.boot.flash.locked; do
    echo "$p = $(adb shell getprop $p | tr -d '\r')"
  done
} > "$OUT/00_fingerprint.txt"

# ---------------------------------------------------------------------------
# 2. System logs
# ---------------------------------------------------------------------------
echo "[2] System logs"
save "logcat -d -v threadtime"                 logs/logcat_main.txt
save "logcat -d -b system -v threadtime"       logs/logcat_system.txt
save "logcat -d -b events -v threadtime"       logs/logcat_events.txt
save "logcat -d -b crash -v threadtime"        logs/logcat_crash.txt
save "logcat -d -b radio -v threadtime"        logs/logcat_radio.txt
[ $ROOT -eq 1 ] && suget "dmesg" > "$OUT/logs/dmesg.txt" 2>&1

# ---------------------------------------------------------------------------
# 3. dumpsys subsystems (state of persistence-relevant services)
# ---------------------------------------------------------------------------
echo "[3] dumpsys state"
for svc in package activity accessibility device_policy notification appops \
           usagestats netstats connectivity wifi batterystats account \
           jobscheduler alarm mount; do
  save "dumpsys $svc" "dumpsys/${svc}.txt"
done

# ---------------------------------------------------------------------------
# 4. Package + APK acquisition (third-party)
# ---------------------------------------------------------------------------
echo "[4] Packages + APKs"
save "pm list packages -f"  packages/packages_all.txt
save "pm list packages -3"  packages/packages_thirdparty.txt
save "pm list packages -d"  packages/packages_disabled.txt
# pull the APK for each third-party package for offline static analysis
adb shell pm list packages -3 | sed 's/package://; s/\r//' | while read -r PKG; do
  [ -z "$PKG" ] && continue
  APKPATH=$(adb shell pm path "$PKG" 2>/dev/null | sed 's/package://; s/\r//' | head -1)
  if [ -n "$APKPATH" ]; then
    adb pull "$APKPATH" "$OUT/packages/${PKG}.apk" >/dev/null 2>&1 \
      && echo "pulled $PKG" >> "$OUT/packages/_pulled.txt"
  fi
done

# ---------------------------------------------------------------------------
# 5. Settings namespaces
# ---------------------------------------------------------------------------
echo "[5] Settings"
for ns in secure global system; do
  save "settings list $ns" "settings/${ns}.txt"
done

# ---------------------------------------------------------------------------
# 6. Network state
# ---------------------------------------------------------------------------
echo "[6] Network"
save "ip addr"                                   network/ip_addr.txt
save "netstat -tunp 2>/dev/null || cat /proc/net/tcp /proc/net/tcp6" network/connections.txt
save "cat /proc/net/arp"                         network/arp.txt
save "settings get global http_proxy"            network/http_proxy.txt
save "dumpsys connectivity | grep -i vpn"        network/vpn.txt
[ $ROOT -eq 1 ] && suget "cat /data/misc/wifi/WifiConfigStore.xml" > "$OUT/network/wifi_config.xml" 2>&1

# ---------------------------------------------------------------------------
# 7. Root-only artifacts
# ---------------------------------------------------------------------------
if [ $ROOT -eq 1 ]; then
  echo "[7] Root-only artifacts"
  suget "cat /data/system/packages.xml"  > "$OUT/root/packages.xml" 2>&1
  suget "cat /data/system/packages.list" > "$OUT/root/packages.list" 2>&1
  suget "ls -l /data/misc/user/0/cacerts-added/" > "$OUT/root/user_cacerts.txt" 2>&1
  # per-app private data (READ-ONLY tar to stdout; no device writes)
  adb shell pm list packages -3 | sed 's/package://; s/\r//' | while read -r PKG; do
    [ -z "$PKG" ] && continue
    adb exec-out "su -c 'tar -c -C /data/data $PKG 2>/dev/null'" \
      > "$OUT/appdata/${PKG}.tar" 2>/dev/null
    [ -s "$OUT/appdata/${PKG}.tar" ] || rm -f "$OUT/appdata/${PKG}.tar"
  done
else
  echo "[7] Root-only artifacts — SKIPPED (no su). Debuggable apps only:"
  # run-as works only for apps flagged debuggable — legitimate on your own test apps
  adb shell pm list packages -3 | sed 's/package://; s/\r//' | while read -r PKG; do
    if adb shell "run-as $PKG id" 2>/dev/null | grep -q uid; then
      adb exec-out "run-as $PKG tar -c ./ 2>/dev/null" > "$OUT/appdata/${PKG}.tar" 2>/dev/null
      [ -s "$OUT/appdata/${PKG}.tar" ] && echo "run-as $PKG" >> "$OUT/appdata/_runas.txt" \
        || rm -f "$OUT/appdata/${PKG}.tar"
    fi
  done
fi

# ---------------------------------------------------------------------------
# 8. Content providers (PII — opt-in)
# ---------------------------------------------------------------------------
if [ $INCLUDE_PII -eq 1 ]; then
  echo "[8] Content providers (PII — opt-in)"
  save "content query --uri content://sms"            providers/sms.txt
  save "content query --uri content://mms"            providers/mms.txt
  save "content query --uri content://call_log/calls" providers/call_log.txt
  save "content query --uri content://contacts/phones" providers/contacts.txt
  save "content query --uri content://com.android.calendar/events" providers/calendar.txt
else
  echo "[8] Content providers — SKIPPED (pass --include-pii to acquire PII)"
fi

# ---------------------------------------------------------------------------
# 9. Full bugreport (opt-in, slow)
# ---------------------------------------------------------------------------
if [ $DO_BUGREPORT -eq 1 ]; then
  echo "[9] bugreport (this can take several minutes)..."
  adb bugreport "$OUT/bugreport" >/dev/null 2>&1
fi

# ---------------------------------------------------------------------------
# 10. Integrity manifest
# ---------------------------------------------------------------------------
echo "[10] Hashing artifacts"
( cd "$OUT" && find . -type f ! -name SHA256SUMS -print0 \
    | xargs -0 sha256sum 2>/dev/null > SHA256SUMS )

echo
echo "[*] Done. Artifacts in: $OUT/"
echo "[*] Next: analyze offline; correlate logs + dumpsys + packages with a timeline."
[ $INCLUDE_PII -eq 0 ] && echo "[*] (PII providers were not queried — re-run with --include-pii if authorized.)"
