#!/usr/bin/env bash
#
# apts.sh — Android Phone Triage Script
# A compromise-assessment / self-pentest tool for Android devices.
#
# PURPOSE
#   Structured collection of persistence, privilege-escalation, and
#   exfiltration indicators from an Android phone over ADB, so a student
#   can reason about whether their OWN device shows signs of a rootkit,
#   RAT, stalkerware, or backdoor.
#
# SCOPE / AUTHORIZATION
#   Use ONLY on devices you own or are explicitly authorized to examine.
#   This is a read-only collector: it does not modify the device. It cannot
#   "clean" anything — detection and triage only.
#
# REQUIREMENTS
#   - adb (Android Platform Tools) on the examiner workstation
#   - USB debugging enabled on the target, USB cable, RSA key authorized
#
# USAGE
#   ./apts.sh
#
# OUTPUT
#   ./evidence_<serial>_<timestamp>/  containing one .txt per check,
#   plus SHA256SUMS for integrity, plus FINDINGS.txt (the triage summary).
#
set -uo pipefail

# ----------------------------------------------------------------------------
# 0. Preflight
# ----------------------------------------------------------------------------
command -v adb >/dev/null 2>&1 || { echo "[!] adb not found on PATH. Install Android platform-tools."; exit 1; }

echo "==============================================================="
echo " Android Phone Triage Script (read-only compromise assessment)"
echo "==============================================================="
echo
echo " AUTHORIZATION: Only examine devices you own or are authorized to test."
read -r -p " Type 'I AM AUTHORIZED' to continue: " AUTH
[ "$AUTH" = "I AM AUTHORIZED" ] || { echo "[!] Aborting."; exit 1; }

echo
echo "[*] Waiting for a device (plug in phone, unlock, accept the RSA prompt)..."
adb wait-for-device
STATE=$(adb get-state 2>/dev/null || echo "unknown")
[ "$STATE" = "device" ] || { echo "[!] Device state is '$STATE', not 'device'. Check authorization prompt on phone."; exit 1; }

SERIAL=$(adb get-serialno 2>/dev/null | tr -d '[:space:]')
TS=$(date +%Y%m%d_%H%M%S)
OUT="evidence_${SERIAL}_${TS}"
mkdir -p "$OUT"
FINDINGS="$OUT/FINDINGS.txt"
: > "$FINDINGS"

log()  { echo "$@"; }
flag() { echo "[FLAG] $*" | tee -a "$FINDINGS"; }
save() { adb shell "$1" > "$OUT/$2" 2>&1; }   # run shell cmd, capture to file

echo "[*] Evidence directory: $OUT"
echo

# ----------------------------------------------------------------------------
# 1. Device fingerprint & integrity baseline
# ----------------------------------------------------------------------------
log "[1] Device fingerprint & OS integrity"
{
  echo "serial:        $SERIAL"
  echo "model:         $(adb shell getprop ro.product.model | tr -d '\r')"
  echo "manufacturer:  $(adb shell getprop ro.product.manufacturer | tr -d '\r')"
  echo "android:       $(adb shell getprop ro.build.version.release | tr -d '\r')"
  echo "sdk:           $(adb shell getprop ro.build.version.sdk | tr -d '\r')"
  echo "build:         $(adb shell getprop ro.build.fingerprint | tr -d '\r')"
  echo "patch level:   $(adb shell getprop ro.build.version.security_patch | tr -d '\r')"
  echo "verified boot: $(adb shell getprop ro.boot.verifiedbootstate | tr -d '\r')"
  echo "bootloader:    $(adb shell getprop ro.boot.flash.locked | tr -d '\r')"
} > "$OUT/01_fingerprint.txt"

# Verified-boot / bootloader-unlock checks: a rootkit usually needs one of these.
VBS=$(adb shell getprop ro.boot.verifiedbootstate | tr -d '\r')
LOCKED=$(adb shell getprop ro.boot.flash.locked | tr -d '\r')
[ "$VBS" != "green" ] && [ -n "$VBS" ] && flag "verifiedbootstate=$VBS (not 'green' — OS integrity not guaranteed)"
[ "$LOCKED" = "0" ] && flag "bootloader UNLOCKED (ro.boot.flash.locked=0) — persistent rootkit becomes feasible"

# Root indicators
save "which su 2>/dev/null; ls -l /sbin/su /system/bin/su /system/xbin/su 2>/dev/null" 02_root_su.txt
save "pm list packages | grep -Ei 'magisk|supersu|superuser|kingroot|xposed|lsposed'" 02_root_packages.txt
if [ -s "$OUT/02_root_su.txt" ] || [ -s "$OUT/02_root_packages.txt" ]; then
  grep -q . "$OUT/02_root_packages.txt" 2>/dev/null && flag "root/management framework package present (see 02_root_packages.txt)"
  grep -qi 'su$' "$OUT/02_root_su.txt" 2>/dev/null && flag "su binary present (see 02_root_su.txt)"
fi

# ----------------------------------------------------------------------------
# 2. Full package inventory (baseline for everything else)
# ----------------------------------------------------------------------------
log "[2] Package inventory"
save "pm list packages -f"          03_packages_all.txt        # all, with APK paths
save "pm list packages -3"          03_packages_thirdparty.txt # user-installed
save "pm list packages -d"          03_packages_disabled.txt   # disabled/suspended
save "pm list packages -s"          03_packages_system.txt     # system
save "cmd package list packages -U" 03_packages_uid.txt        # with UIDs

# Installer provenance: sideloaded apps (installer = null / adb / unknown) are higher-risk
log "    - resolving installer source for third-party apps"
: > "$OUT/04_installer_source.txt"
adb shell pm list packages -3 | sed 's/package://; s/\r//' | while read -r PKG; do
  [ -z "$PKG" ] && continue
  SRC=$(adb shell pm list packages -i "$PKG" 2>/dev/null | tr -d '\r')
  echo "$SRC" >> "$OUT/04_installer_source.txt"
done
grep -Ei 'installer=(null|com\.android\.shell|com\.google\.android\.packageinstaller)' "$OUT/04_installer_source.txt" \
  > "$OUT/04_installer_sideloaded.txt" 2>/dev/null
if [ -s "$OUT/04_installer_sideloaded.txt" ]; then
  flag "sideloaded / non-store apps found ($(wc -l < "$OUT/04_installer_sideloaded.txt") — see 04_installer_sideloaded.txt)"
fi

# ----------------------------------------------------------------------------
# 3. Persistence mechanism 1: Device Administrator apps
#    Malware/stalkerware requests admin so it can resist uninstall + wipe you.
# ----------------------------------------------------------------------------
log "[3] Device admin receivers"
save "dpm list-owners; dumpsys device_policy" 05_device_admin.txt
ACTIVE_ADMINS=$(adb shell dumpsys device_policy 2>/dev/null | grep -i 'admin=' | tr -d '\r')
if [ -n "$ACTIVE_ADMINS" ]; then
  echo "$ACTIVE_ADMINS" > "$OUT/05_active_admins.txt"
  flag "active device-admin components present — review 05_active_admins.txt (legit MDM? or stalkerware?)"
fi

# ----------------------------------------------------------------------------
# 4. Persistence mechanism 2: Accessibility services
#    THE most-abused Android surface. Grants screen-read + input-injection.
#    Banking trojans / RATs live here.
# ----------------------------------------------------------------------------
log "[4] Accessibility services (high-value indicator)"
save "settings get secure enabled_accessibility_services" 06_accessibility_enabled.txt
save "settings get secure accessibility_enabled"          06_accessibility_flag.txt
save "dumpsys accessibility"                              06_accessibility_dump.txt
A11Y=$(adb shell settings get secure enabled_accessibility_services 2>/dev/null | tr -d '\r')
if [ -n "$A11Y" ] && [ "$A11Y" != "null" ]; then
  flag "accessibility services ENABLED: $A11Y — verify every entry is a known app"
fi

# ----------------------------------------------------------------------------
# 5. Persistence mechanism 3: Notification listeners
#    Lets an app read every notification (2FA codes, messages).
# ----------------------------------------------------------------------------
log "[5] Notification listeners"
save "settings get secure enabled_notification_listeners" 07_notif_listeners.txt
NL=$(adb shell settings get secure enabled_notification_listeners 2>/dev/null | tr -d '\r')
if [ -n "$NL" ] && [ "$NL" != "null" ]; then
  flag "notification listeners ENABLED: $NL — can read 2FA/OTP + message content"
fi

# ----------------------------------------------------------------------------
# 6. Persistence mechanism 4: BOOT_COMPLETED receivers
#    How malware survives a reboot.
# ----------------------------------------------------------------------------
log "[6] Boot receivers (reboot persistence)"
save "dumpsys package r android.intent.action.BOOT_COMPLETED" 08_boot_receivers.txt

# ----------------------------------------------------------------------------
# 7. Dangerous runtime permissions granted to third-party apps
# ----------------------------------------------------------------------------
log "[7] Dangerous permission grants"
for PERM in RECORD_AUDIO CAMERA READ_SMS RECEIVE_SMS ACCESS_FINE_LOCATION \
            READ_CONTACTS READ_CALL_LOG PROCESS_OUTGOING_CALLS \
            SYSTEM_ALERT_WINDOW REQUEST_INSTALL_PACKAGES PACKAGE_USAGE_STATS; do
  echo "=== android.permission.$PERM (or appop) ===" >> "$OUT/09_dangerous_perms.txt"
  adb shell dumpsys package 2>/dev/null | tr -d '\r' | grep -i "$PERM" >> "$OUT/09_dangerous_perms.txt"
  echo >> "$OUT/09_dangerous_perms.txt"
done
# "draw over other apps" (SYSTEM_ALERT_WINDOW) + accessibility is a classic overlay-attack combo
save "dumpsys package | grep -A2 -i 'appop.*SYSTEM_ALERT_WINDOW'" 09_overlay_appops.txt

# ----------------------------------------------------------------------------
# 8. Hidden apps (installed but no launcher icon — evasion technique)
# ----------------------------------------------------------------------------
log "[8] Apps with no launcher activity (icon-hiding)"
adb shell cmd package query-activities --brief \
  -a android.intent.action.MAIN -c android.intent.category.LAUNCHER 2>/dev/null \
  | tr -d '\r' | sed -n 's/.* \([a-zA-Z0-9_.]*\)\/.*/\1/p' | sort -u > "$OUT/10_has_launcher.txt"
adb shell pm list packages -3 2>/dev/null | sed 's/package://; s/\r//' | sort -u > "$OUT/10_thirdparty.txt"
comm -23 "$OUT/10_thirdparty.txt" "$OUT/10_has_launcher.txt" > "$OUT/10_hidden_apps.txt" 2>/dev/null
if [ -s "$OUT/10_hidden_apps.txt" ]; then
  flag "third-party app(s) with NO launcher icon (possible hiding) — see 10_hidden_apps.txt"
fi

# ----------------------------------------------------------------------------
# 9. Live process / service / socket state
# ----------------------------------------------------------------------------
log "[9] Runtime state (processes, services, sockets)"
save "ps -A -o USER,PID,PPID,NAME 2>/dev/null || ps"  11_processes.txt
save "dumpsys activity services"                       11_services.txt
save "netstat -tunp 2>/dev/null || cat /proc/net/tcp /proc/net/tcp6 /proc/net/udp" 11_network.txt

# ----------------------------------------------------------------------------
# 10. Network trust: user-added CA certs (MITM) + VPN/proxy config
# ----------------------------------------------------------------------------
log "[10] Network trust anchors & proxy/VPN"
save "ls -l /data/misc/user/0/cacerts-added/ 2>/dev/null" 12_user_cacerts.txt
if adb shell 'ls /data/misc/user/0/cacerts-added/ 2>/dev/null' | tr -d '\r' | grep -q .; then
  flag "user-added CA certificate(s) present — possible TLS interception (see 12_user_cacerts.txt)"
fi
save "settings get global http_proxy" 12_http_proxy.txt
save "dumpsys connectivity | grep -i vpn" 12_vpn.txt
PROXY=$(adb shell settings get global http_proxy 2>/dev/null | tr -d '\r')
[ -n "$PROXY" ] && [ "$PROXY" != "null" ] && [ "$PROXY" != ":0" ] && flag "global HTTP proxy set: $PROXY"

# ----------------------------------------------------------------------------
# 11. Recently installed / updated packages (timeline)
# ----------------------------------------------------------------------------
log "[11] Install timeline"
save "dumpsys package | grep -E 'Package \[|firstInstallTime|lastUpdateTime|installerPackageName'" 13_install_timeline.txt

# ----------------------------------------------------------------------------
# 12. Integrity hashing of collected evidence
# ----------------------------------------------------------------------------
log "[12] Hashing evidence for integrity"
( cd "$OUT" && command -v sha256sum >/dev/null 2>&1 && sha256sum ./*.txt > SHA256SUMS 2>/dev/null )

# ----------------------------------------------------------------------------
# Summary
# ----------------------------------------------------------------------------
echo
echo "==============================================================="
echo " TRIAGE SUMMARY"
echo "==============================================================="
if [ -s "$FINDINGS" ]; then
  cat "$FINDINGS"
else
  echo "[*] No automatic flags raised. STILL review the evidence files by hand —"
  echo "    absence of flags is not proof of a clean device."
fi
echo
echo "[*] Full evidence in: $OUT/"
echo "[*] Next step: run Amnesty MVT against a full backup for IOC matching."
