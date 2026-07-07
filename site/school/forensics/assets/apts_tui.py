#!/usr/bin/env python3
"""
apts_tui.py — Android Phone Triage & Forensic Acquisition (TUI)

A keyboard-driven, colored terminal interface for compromise assessment and
forensic acquisition of an Android device you OWN or are AUTHORIZED to examine.

WHAT IT DOES
  * Read-only triage of the six Android persistence surfaces (device admin,
    accessibility, notification listeners, boot receivers, overlay, sideload),
    plus fingerprint / integrity, dangerous permissions, hidden apps, network
    trust anchors.
  * Forensic ACQUISITION (imaging) of firmware partitions — boot, init_boot,
    vendor_boot, vbmeta, dtbo, bootloader, etc. — for OFFLINE analysis. Imaging
    is how you inspect BELOW the OS, where a kernel rootkit/bootkit hides and
    where it can no longer lie to ADB.
  * Known-good comparison: hash an acquired partition against a trusted OEM
    factory image to detect tampering (the actual forensic payload).

SCOPE / SAFETY (read this, it is not boilerplate)
  * Authorized devices only. The app requires an explicit acknowledgment on
    launch. Use it on your own lab/field devices, or with written authorization.
  * READ-ONLY with respect to the device. This tool never flashes, writes,
    erases, unlocks, roots, or bypasses any lock. `dd` is used only to READ
    partitions. There are deliberately no write/flash operations in this code.
  * Prerequisites for partition imaging: a running, authorized OS with root
    (su) on a device you own, OR a custom recovery / EDL workflow you run
    manually. Obtaining root/unlock on your own lab device is a prerequisite
    this tool does not automate — and must never be done to a device you do
    not own.

REQUIREMENTS
  * Python 3.8+ (standard library only — curses, subprocess, hashlib).
  * Android platform-tools (`adb`, optionally `fastboot`) on PATH.

USAGE
  python3 apts_tui.py            # launches the TUI
  Keys: Up/Down or j/k move · Enter select · number = hotkey · q/Esc back · Q quit
"""

import curses
import subprocess
import hashlib
import os
import shutil
import datetime

APP_TITLE = "APTS · Android Phone Triage & Forensic Acquisition"

# Partitions that matter most for boot-chain / rootkit-below-the-OS analysis.
# (Actual set is device-specific; the tool enumerates what really exists.)
FORENSIC_PARTITIONS = [
    "boot", "init_boot", "vendor_boot", "recovery", "dtbo",
    "vbmeta", "vbmeta_system", "vbmeta_vendor",
    "abl", "xbl", "xbl_config", "aop", "tz", "bl", "bootloader",
]


# ============================================================================
# Backend — thin, testable wrappers around adb/fastboot. No curses in here.
# ============================================================================
class Backend:
    def __init__(self):
        self.adb_path = shutil.which("adb")
        self.fastboot_path = shutil.which("fastboot")
        self.rooted = False
        self.serial = None
        self.outdir = None

    # -- process helpers ------------------------------------------------------
    def run(self, argv, timeout=180, binary_out=None):
        """Run a command. If binary_out is a path, stdout is streamed to it raw."""
        try:
            if binary_out:
                with open(binary_out, "wb") as fh:
                    p = subprocess.run(argv, stdout=fh, stderr=subprocess.PIPE,
                                       timeout=timeout)
                return p.returncode, "", p.stderr.decode("utf-8", "replace")
            p = subprocess.run(argv, capture_output=True, timeout=timeout)
            return (p.returncode,
                    p.stdout.decode("utf-8", "replace"),
                    p.stderr.decode("utf-8", "replace"))
        except FileNotFoundError:
            return 127, "", f"not found: {argv[0]}"
        except subprocess.TimeoutExpired:
            return 124, "", f"timeout after {timeout}s"

    def adb(self, *args, **kw):
        if not self.adb_path:
            return 127, "", "adb not found on PATH"
        return self.run([self.adb_path, *args], **kw)

    def shell(self, cmd, **kw):
        return self.adb("shell", cmd, **kw)

    # -- device state ---------------------------------------------------------
    def have_adb(self):
        return bool(self.adb_path)

    def state(self):
        rc, out, _ = self.adb("get-state")
        return out.strip() if rc == 0 else "no-device"

    def connect(self):
        """Return (ok, message). Populates serial + root status."""
        if not self.adb_path:
            return False, "adb is not installed / not on PATH."
        self.adb("start-server")
        st = self.state()
        if st != "device":
            return False, f"device state = '{st}'. Plug in, unlock, accept RSA prompt."
        rc, out, _ = self.adb("get-serialno")
        self.serial = out.strip() if rc == 0 else "unknown"
        self.rooted = self._check_root()
        return True, f"connected: {self.serial}  (root: {'yes' if self.rooted else 'no'})"

    def _check_root(self):
        rc, out, _ = self.shell("su -c id 2>/dev/null || id")
        return "uid=0" in out

    def prop(self, name):
        rc, out, _ = self.shell(f"getprop {name}")
        return out.strip()

    def fingerprint(self):
        keys = {
            "model": "ro.product.model",
            "manufacturer": "ro.product.manufacturer",
            "android": "ro.build.version.release",
            "sdk": "ro.build.version.sdk",
            "patch": "ro.build.version.security_patch",
            "fingerprint": "ro.build.fingerprint",
            "verifiedboot": "ro.boot.verifiedbootstate",
            "bl_locked": "ro.boot.flash.locked",
        }
        return {k: self.prop(v) for k, v in keys.items()}

    # -- evidence dir ---------------------------------------------------------
    def new_evidence_dir(self):
        ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        serial = (self.serial or "device").replace("/", "_")
        self.outdir = os.path.abspath(f"evidence_{serial}_{ts}")
        os.makedirs(self.outdir, exist_ok=True)
        return self.outdir

    def ensure_outdir(self):
        return self.outdir or self.new_evidence_dir()

    # -- partition enumeration & acquisition (READ-ONLY) ----------------------
    def list_partitions(self):
        """Map partition-name -> block device via /dev/block/by-name (needs root)."""
        parts = {}
        for base in ("/dev/block/by-name", "/dev/block/bootdevice/by-name"):
            rc, out, _ = self.shell(f"su -c 'ls -l {base}' 2>/dev/null")
            if rc == 0 and out.strip():
                for line in out.splitlines():
                    # ... name -> /dev/block/sdaNN
                    if "->" in line:
                        name = line.split("->")[0].split()[-1]
                        target = line.split("->")[-1].strip()
                        parts[name] = target
                if parts:
                    break
        return parts

    def acquire_partition(self, name, outdir):
        """Image one partition to outdir via `dd` read. Returns (ok, path, sha256, msg)."""
        if not self.rooted:
            return (False, None, None,
                    "root (su) required to read raw partitions from a running OS.")
        dev = f"/dev/block/by-name/{name}"
        out_path = os.path.join(outdir, f"{name}.img")
        # exec-out gives a raw binary stream (no newline translation) — correct for imaging.
        cmd = f"dd if={dev} bs=4M 2>/dev/null"
        rc, _, err = self.adb("exec-out", "su", "-c", cmd,
                              binary_out=out_path, timeout=1800)
        if rc != 0 or not os.path.exists(out_path) or os.path.getsize(out_path) == 0:
            if os.path.exists(out_path):
                os.remove(out_path)
            return False, None, None, err.strip() or "dd produced no data (partition name?)"
        digest = sha256_file(out_path)
        return True, out_path, digest, f"{human(os.path.getsize(out_path))} imaged"

    def write_manifest(self, outdir, rows):
        path = os.path.join(outdir, "ACQUISITION_MANIFEST.txt")
        with open(path, "a") as fh:
            for name, p, digest, size in rows:
                fh.write(f"{digest}  {os.path.basename(p)}  {size}  ({name})\n")
        return path


# ---- module-level helpers ---------------------------------------------------
def sha256_file(path, chunk=1 << 20):
    h = hashlib.sha256()
    with open(path, "rb") as fh:
        for block in iter(lambda: fh.read(chunk), b""):
            h.update(block)
    return h.hexdigest()


def human(n):
    for unit in ("B", "KB", "MB", "GB", "TB"):
        if n < 1024:
            return f"{n:.0f}{unit}" if unit == "B" else f"{n:.1f}{unit}"
        n /= 1024
    return f"{n:.1f}PB"


# Data-driven triage: (label, adb-shell-command, evidence-file, flag-predicate)
# flag-predicate(output)->str|None ; returns a FLAG message if suspicious.
def _flag_nonempty_nonnull(msg):
    def f(o):
        s = o.strip()
        return msg if s and s.lower() != "null" else None
    return f


TRIAGE_CHECKS = [
    ("Root / su binary",
     "which su 2>/dev/null; pm list packages | grep -Ei 'magisk|xposed|lsposed|supersu'",
     "root_indicators.txt",
     _flag_nonempty_nonnull("root or root-management framework present")),
    ("Device Administrators",
     "dumpsys device_policy | grep -i 'admin='",
     "device_admin.txt",
     _flag_nonempty_nonnull("active device-admin component(s) — verify each is legit MDM")),
    ("Accessibility services",
     "settings get secure enabled_accessibility_services",
     "accessibility.txt",
     _flag_nonempty_nonnull("accessibility ENABLED — most-abused surface, verify every app")),
    ("Notification listeners",
     "settings get secure enabled_notification_listeners",
     "notif_listeners.txt",
     _flag_nonempty_nonnull("listener(s) can read 2FA/OTP + message content")),
    ("Boot receivers (persistence)",
     "dumpsys package r android.intent.action.BOOT_COMPLETED",
     "boot_receivers.txt", None),
    ("Overlay (SYSTEM_ALERT_WINDOW)",
     "dumpsys package | grep -A1 -i 'SYSTEM_ALERT_WINDOW'",
     "overlay.txt", None),
    ("Sideloaded / non-store apps",
     "for p in $(pm list packages -3 | sed 's/package://'); do "
     "pm list packages -i $p | grep -Ei 'installer=(null|com.android.shell)'; done",
     "sideloaded.txt",
     _flag_nonempty_nonnull("app(s) installed outside a vetted store")),
    ("User-added CA certs (MITM)",
     "su -c 'ls /data/misc/user/0/cacerts-added/' 2>/dev/null",
     "user_cacerts.txt",
     _flag_nonempty_nonnull("user CA cert(s) present — possible TLS interception")),
    ("Global HTTP proxy",
     "settings get global http_proxy",
     "proxy.txt",
     lambda o: ("proxy set: " + o.strip()) if o.strip() not in ("", "null", ":0") else None),
    ("Third-party package inventory",
     "pm list packages -3",
     "packages_thirdparty.txt", None),
]


def run_triage_check(be, check):
    """Execute one triage check, save evidence, return (label, flag_or_None)."""
    label, cmd, fname, pred = check
    outdir = be.ensure_outdir()
    rc, out, err = be.shell(cmd)
    with open(os.path.join(outdir, fname), "w") as fh:
        fh.write(out)
        if err.strip():
            fh.write("\n--- stderr ---\n" + err)
    flag = pred(out) if pred else None
    return label, flag


# ============================================================================
# TUI — curses front end.
# ============================================================================
class UI:
    # color pair ids
    HEADER, SEL, FLAG, CRIT, OK, MUTED, ACCENT = range(1, 8)

    def __init__(self, stdscr, be):
        self.s = stdscr
        self.be = be
        self.log = []           # (text, pair) tuples, the scrolling activity pane
        curses.curs_set(0)
        curses.start_color()
        curses.use_default_colors()
        curses.init_pair(self.HEADER, curses.COLOR_WHITE, curses.COLOR_BLUE)
        curses.init_pair(self.SEL,    curses.COLOR_BLACK, curses.COLOR_CYAN)
        curses.init_pair(self.FLAG,   curses.COLOR_YELLOW, -1)
        curses.init_pair(self.CRIT,   curses.COLOR_RED, -1)
        curses.init_pair(self.OK,     curses.COLOR_GREEN, -1)
        curses.init_pair(self.MUTED,  curses.COLOR_WHITE, -1)
        curses.init_pair(self.ACCENT, curses.COLOR_CYAN, -1)

    # -- drawing primitives ---------------------------------------------------
    def _put(self, y, x, text, attr=0):
        h, w = self.s.getmaxyx()
        if 0 <= y < h and x < w:
            try:
                self.s.addstr(y, x, text[: max(0, w - x - 1)], attr)
            except curses.error:
                pass

    def header(self, subtitle=""):
        h, w = self.s.getmaxyx()
        bar = APP_TITLE.ljust(w - 1)[: w - 1]
        self._put(0, 0, bar, curses.color_pair(self.HEADER) | curses.A_BOLD)
        meta = "READ-ONLY · AUTHORIZED USE ONLY"
        if self.be.serial:
            meta = f"dev {self.be.serial} · root {'Y' if self.be.rooted else 'N'} · " + meta
        self._put(1, 0, meta[: w - 1], curses.color_pair(self.MUTED) | curses.A_DIM)
        if subtitle:
            self._put(2, 0, subtitle[: w - 1], curses.color_pair(self.ACCENT) | curses.A_BOLD)

    def footer(self, hint):
        h, w = self.s.getmaxyx()
        self._put(h - 1, 0, hint.ljust(w - 1)[: w - 1],
                  curses.color_pair(self.MUTED) | curses.A_DIM | curses.A_REVERSE)

    def logline(self, text, pair=MUTED):
        self.log.append((text, pair))

    def draw_log(self, top, bottom):
        """Render the activity pane between rows top..bottom."""
        h, w = self.s.getmaxyx()
        self._put(top, 0, "── activity ".ljust(w - 1, "─"),
                  curses.color_pair(self.MUTED) | curses.A_DIM)
        rows = bottom - top - 1
        for i, (text, pair) in enumerate(self.log[-rows:]):
            self._put(top + 1 + i, 0, "  " + text, curses.color_pair(pair))

    # -- generic menu ---------------------------------------------------------
    def menu(self, title, items, hint=None):
        """items: list of (key_label, text). Returns index or None (back)."""
        idx = 0
        hint = hint or "↑/↓ or j/k move · Enter select · q/Esc back · Q quit"
        while True:
            self.s.erase()
            self.header(title)
            top = 4
            for i, (klabel, text) in enumerate(items):
                sel = (i == idx)
                attr = curses.color_pair(self.SEL) | curses.A_BOLD if sel \
                    else curses.color_pair(self.MUTED)
                prefix = " ▶ " if sel else "   "
                self._put(top + i, 2, f"{prefix}{klabel:>2}  {text}", attr)
            self.draw_log(top + len(items) + 1, self.s.getmaxyx()[0] - 1)
            self.footer(hint)
            self.s.refresh()

            c = self.s.getch()
            if c in (curses.KEY_UP, ord("k")):
                idx = (idx - 1) % len(items)
            elif c in (curses.KEY_DOWN, ord("j")):
                idx = (idx + 1) % len(items)
            elif c in (curses.KEY_ENTER, 10, 13, ord(" ")):
                return idx
            elif c in (27, ord("q")):     # Esc / q -> back
                return None
            elif c == ord("Q"):
                raise KeyboardInterrupt
            else:
                # numeric hotkey matches key_label
                for i, (klabel, _) in enumerate(items):
                    if klabel.strip() and chr(c) == klabel.strip()[0]:
                        return i

    # -- scrollable pager -----------------------------------------------------
    def pager(self, title, lines):
        pos = 0
        while True:
            self.s.erase()
            self.header(title)
            h, w = self.s.getmaxyx()
            view = h - 6
            for i, (text, pair) in enumerate(lines[pos:pos + view]):
                self._put(4 + i, 2, text, curses.color_pair(pair))
            self.footer("↑/↓ scroll · PgUp/PgDn · q/Esc back")
            self.s.refresh()
            c = self.s.getch()
            if c in (curses.KEY_UP, ord("k")):
                pos = max(0, pos - 1)
            elif c in (curses.KEY_DOWN, ord("j")):
                pos = min(max(0, len(lines) - view), pos + 1)
            elif c == curses.KEY_NPAGE:
                pos = min(max(0, len(lines) - view), pos + view)
            elif c == curses.KEY_PPAGE:
                pos = max(0, pos - view)
            elif c in (27, ord("q"), curses.KEY_ENTER, 10, 13):
                return
            elif c == ord("Q"):
                raise KeyboardInterrupt

    # -- simple text input line ----------------------------------------------
    def prompt(self, label):
        curses.curs_set(1)
        curses.echo()
        h, w = self.s.getmaxyx()
        self._put(h - 2, 0, (label + " ").ljust(w - 1),
                  curses.color_pair(self.ACCENT))
        self.s.refresh()
        try:
            val = self.s.getstr(h - 2, len(label) + 1, w - len(label) - 3)
            val = val.decode("utf-8", "replace").strip()
        except Exception:
            val = ""
        curses.noecho()
        curses.curs_set(0)
        return val

    def flash(self, text, pair=OK):
        """Momentary status while a blocking op runs."""
        h, w = self.s.getmaxyx()
        self._put(h - 2, 0, ("  " + text).ljust(w - 1),
                  curses.color_pair(pair) | curses.A_BOLD)
        self.s.refresh()


# ============================================================================
# Screens / actions
# ============================================================================
def authorization_gate(ui):
    ui.s.erase()
    ui.header("Authorization required")
    body = [
        "",
        "This tool performs READ-ONLY triage and forensic ACQUISITION of an",
        "Android device you OWN or are explicitly AUTHORIZED to examine.",
        "",
        "It never writes, flashes, erases, unlocks, or roots the device.",
        "Partition imaging reads only, and requires a device you control.",
        "",
        "By continuing you confirm you are authorized to examine this device.",
        "",
        "Press  Y  to accept   ·   any other key to quit.",
    ]
    for i, line in enumerate(body):
        pair = UI.FLAG if "never writes" in line or "READ-ONLY" in line else UI.MUTED
        ui._put(4 + i, 2, line, curses.color_pair(pair))
    ui.s.refresh()
    return ui.s.getch() in (ord("y"), ord("Y"))


def action_connect(ui):
    ui.flash("connecting to device…", UI.ACCENT)
    ok, msg = ui.be.connect()
    ui.logline(("[+] " if ok else "[!] ") + msg, UI.OK if ok else UI.CRIT)
    if ok:
        ui.be.new_evidence_dir()
        ui.logline(f"[*] evidence dir: {ui.be.outdir}", UI.MUTED)


def screen_device_status(ui):
    if not ui.be.serial:
        action_connect(ui)
    fp = ui.be.fingerprint() if ui.be.serial else {}
    lines = [("Device fingerprint & boot integrity", UI.ACCENT), ("", UI.MUTED)]
    if not fp:
        lines.append(("No device connected. Use 'Connect device' first.", UI.CRIT))
    for k, v in fp.items():
        pair = UI.MUTED
        if k == "verifiedboot" and v and v != "green":
            pair = UI.FLAG
        if k == "bl_locked" and v == "0":
            pair = UI.FLAG
        lines.append((f"  {k:<14}: {v}", pair))
    if fp.get("verifiedboot") == "green" and fp.get("bl_locked") == "1":
        lines += [("", UI.MUTED),
                  ("  integrity: green + locked → userspace evidence is more trustworthy.", UI.OK)]
    elif fp:
        lines += [("", UI.MUTED),
                  ("  integrity: NOT green/locked → weight userspace findings with caution.", UI.FLAG)]
    ui.pager("Device status", lines)


def screen_triage(ui):
    if not ui.be.serial:
        action_connect(ui)
    items = [("0", "Run ALL checks")] + \
            [(str(i + 1), c[0]) for i, c in enumerate(TRIAGE_CHECKS)]
    while True:
        choice = ui.menu("Triage · persistence & compromise indicators", items)
        if choice is None:
            return
        targets = TRIAGE_CHECKS if choice == 0 else [TRIAGE_CHECKS[choice - 1]]
        if not ui.be.have_adb() or not ui.be.serial:
            ui.logline("[!] no device connected — connect first.", UI.CRIT)
            continue
        flags = []
        for chk in targets:
            ui.flash(f"running: {chk[0]}…", UI.ACCENT)
            label, flag = run_triage_check(ui.be, chk)
            if flag:
                flags.append((label, flag))
                ui.logline(f"[FLAG] {label}: {flag}", UI.FLAG)
            else:
                ui.logline(f"[ok]   {label}", UI.OK)
        ui.logline(f"[*] evidence written to {ui.be.outdir}", UI.MUTED)
        if choice == 0:
            summary = [("Triage summary", UI.ACCENT), ("", UI.MUTED)]
            if flags:
                for label, flag in flags:
                    summary.append((f"  [FLAG] {label}: {flag}", UI.FLAG))
            else:
                summary.append(("  No automatic flags. Still review evidence by hand —", UI.OK))
                summary.append(("  absence of flags is not proof of a clean device.", UI.MUTED))
            ui.pager("Triage summary", summary)


def screen_acquire(ui):
    if not ui.be.serial:
        action_connect(ui)
    items = [
        ("1", "Enumerate partitions (by-name map)"),
        ("2", "Acquire boot-chain set (boot/init_boot/vbmeta/…)"),
        ("3", "Acquire a named partition…"),
        ("4", "Verify a partition against a known-good image"),
        ("5", "Show acquisition manifest"),
    ]
    while True:
        choice = ui.menu("Forensic acquisition · READ-ONLY imaging", items)
        if choice is None:
            return
        if not ui.be.serial:
            ui.logline("[!] connect a device first.", UI.CRIT)
            continue
        if choice == 0:
            _acq_enumerate(ui)
        elif choice == 1:
            _acq_bootset(ui)
        elif choice == 2:
            _acq_named(ui)
        elif choice == 3:
            _acq_verify(ui)
        elif choice == 4:
            _acq_manifest(ui)


def _require_root(ui):
    if not ui.be.rooted:
        ui.logline("[!] partition imaging needs root (su) on a device you own.", UI.CRIT)
        ui.logline("    Alternatives (run manually): custom recovery / EDL acquisition.", UI.MUTED)
        return False
    return True


def _acq_enumerate(ui):
    ui.flash("enumerating partitions…", UI.ACCENT)
    parts = ui.be.list_partitions()
    if not parts:
        ui.logline("[!] could not read /dev/block/by-name (need root).", UI.CRIT)
        return
    lines = [("Partition → block device", UI.ACCENT), ("", UI.MUTED)]
    for name, dev in sorted(parts.items()):
        star = " *" if name in FORENSIC_PARTITIONS else "  "
        lines.append((f" {star} {name:<18} {dev}",
                      UI.FLAG if star == " *" else UI.MUTED))
    lines += [("", UI.MUTED), ("  * = boot-chain / rootkit-relevant partition", UI.MUTED)]
    ui.pager("Partitions", lines)


def _acq_bootset(ui):
    if not _require_root(ui):
        return
    outdir = ui.be.ensure_outdir()
    present = ui.be.list_partitions()
    targets = [p for p in FORENSIC_PARTITIONS if p in present]
    if not targets:
        ui.logline("[!] no boot-chain partitions found by name.", UI.CRIT)
        return
    rows = []
    for name in targets:
        ui.flash(f"imaging {name}…", UI.ACCENT)
        ok, path, digest, msg = ui.be.acquire_partition(name, outdir)
        if ok:
            rows.append((name, path, digest, human(os.path.getsize(path))))
            ui.logline(f"[img]  {name}: {msg}  sha256={digest[:16]}…", UI.OK)
        else:
            ui.logline(f"[skip] {name}: {msg}", UI.FLAG)
    if rows:
        mpath = ui.be.write_manifest(outdir, rows)
        ui.logline(f"[*] manifest: {mpath}", UI.MUTED)


def _acq_named(ui):
    if not _require_root(ui):
        return
    name = ui.prompt("partition name (e.g. boot, vbmeta, abl):")
    if not name:
        return
    outdir = ui.be.ensure_outdir()
    ui.flash(f"imaging {name}…", UI.ACCENT)
    ok, path, digest, msg = ui.be.acquire_partition(name, outdir)
    if ok:
        ui.be.write_manifest(outdir, [(name, path, digest, human(os.path.getsize(path)))])
        ui.logline(f"[img]  {name}: {msg}  sha256={digest[:16]}…", UI.OK)
    else:
        ui.logline(f"[!] {name}: {msg}", UI.CRIT)


def _acq_verify(ui):
    """Compare an acquired image to a trusted OEM factory image (tamper check)."""
    acq = ui.prompt("path to ACQUIRED image (.img):")
    if not acq or not os.path.exists(acq):
        ui.logline("[!] acquired image not found.", UI.CRIT)
        return
    good = ui.prompt("path to KNOWN-GOOD OEM image:")
    if not good or not os.path.exists(good):
        ui.logline("[!] known-good image not found.", UI.CRIT)
        return
    ui.flash("hashing both images…", UI.ACCENT)
    a, b = sha256_file(acq), sha256_file(good)
    if a == b:
        ui.logline(f"[MATCH] {os.path.basename(acq)} == known-good (no tampering detected).", UI.OK)
    else:
        ui.logline(f"[MISMATCH] {os.path.basename(acq)} differs from known-good!", UI.CRIT)
        ui.logline(f"    acquired : {a}", UI.MUTED)
        ui.logline(f"    knowngood: {b}", UI.MUTED)
        ui.logline("    → possible boot-chain tampering. Investigate offline.", UI.FLAG)


def _acq_manifest(ui):
    outdir = ui.be.outdir
    mpath = os.path.join(outdir, "ACQUISITION_MANIFEST.txt") if outdir else None
    if not mpath or not os.path.exists(mpath):
        ui.logline("[!] no manifest yet — acquire something first.", UI.FLAG)
        return
    with open(mpath) as fh:
        lines = [(ln.rstrip(), UI.MUTED) for ln in fh]
    ui.pager("Acquisition manifest", [("SHA-256  ·  image  ·  size  ·  (partition)", UI.ACCENT),
                                      ("", UI.MUTED)] + lines)


def screen_help(ui):
    lines = [
        ("Method — image below the OS, then compare", UI.ACCENT), ("", UI.MUTED),
        ("A kernel rootkit can lie to ADB. Userspace triage may look clean while", UI.MUTED),
        ("the compromise lives in the boot chain. The forensic answer:", UI.MUTED),
        ("", UI.MUTED),
        ("  1. Confirm integrity signals (verifiedbootstate, bootloader lock).", UI.MUTED),
        ("  2. ACQUIRE boot / init_boot / vbmeta / bootloader partitions (read-only).", UI.MUTED),
        ("  3. Obtain the matching OEM factory image (public for many devices).", UI.MUTED),
        ("  4. Compare SHA-256. A mismatch on a signed partition is a red flag.", UI.FLAG),
        ("", UI.MUTED),
        ("This tool never writes to the device. Imaging needs root on a device", UI.MUTED),
        ("you own; recovery/EDL are manual alternatives you run yourself.", UI.MUTED),
        ("", UI.MUTED),
        ("Pair with MVT (Amnesty) for IOC matching on backups.", UI.OK),
    ]
    ui.pager("Help / methodology", lines)


# ============================================================================
# Main loop
# ============================================================================
def main(stdscr):
    be = Backend()
    ui = UI(stdscr, be)

    if not authorization_gate(ui):
        return
    if not be.have_adb():
        ui.logline("[!] adb not found on PATH — install Android platform-tools.", UI.CRIT)
    else:
        action_connect(ui)

    top = [
        ("1", "Connect / re-detect device"),
        ("2", "Device status & boot integrity"),
        ("3", "Triage — persistence & compromise indicators"),
        ("4", "Forensic acquisition — image firmware/bootloader (read-only)"),
        ("5", "Help / methodology"),
        ("6", "Quit"),
    ]
    while True:
        try:
            choice = ui.menu("Main menu", top)
        except KeyboardInterrupt:
            return
        if choice in (None, 5):
            return
        try:
            if choice == 0:
                action_connect(ui)
            elif choice == 1:
                screen_device_status(ui)
            elif choice == 2:
                screen_triage(ui)
            elif choice == 3:
                screen_acquire(ui)
            elif choice == 4:
                screen_help(ui)
        except KeyboardInterrupt:
            return


if __name__ == "__main__":
    try:
        curses.wrapper(main)
    except KeyboardInterrupt:
        pass
