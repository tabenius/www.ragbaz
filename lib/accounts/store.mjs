// D1 data access for accounts, subscribers, tokens, and soft rate limiting.
import { getDb } from "./env.mjs";
import { randomToken, sha256Hex } from "./crypto.mjs";

const now = () => Math.floor(Date.now() / 1000);
export const normalizeEmail = (e) => String(e || "").trim().toLowerCase();

// Same-ish shape RFC5322-lite; good enough to reject obvious junk.
export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

// ── subscribers ────────────────────────────────────────────────────────
export async function upsertPendingSubscriber(email, plan) {
  const db = getDb();
  const t = now();
  const unsub = randomToken(24);
  await db
    .prepare(
      `INSERT INTO subscribers (email, status, unsubscribe_token, plan_interest, created_at, updated_at)
       VALUES (?, 'pending', ?, ?, ?, ?)
       ON CONFLICT(email) DO UPDATE SET
         status = CASE WHEN subscribers.status = 'unsubscribed' THEN 'pending' ELSE subscribers.status END,
         plan_interest = CASE WHEN excluded.plan_interest IS NOT NULL THEN excluded.plan_interest ELSE subscribers.plan_interest END,
         updated_at = excluded.updated_at`,
    )
    .bind(email, unsub, plan || null, t, t)
    .run();
}

export async function confirmSubscriber(email) {
  const db = getDb();
  await db
    .prepare(
      `UPDATE subscribers SET status='confirmed', confirmed_at=?, updated_at=? WHERE email=?`,
    )
    .bind(now(), now(), email)
    .run();
}

export async function unsubscribeByToken(token) {
  const db = getDb();
  const res = await db
    .prepare(
      `UPDATE subscribers SET status='unsubscribed', updated_at=? WHERE unsubscribe_token=?`,
    )
    .bind(now(), token)
    .run();
  return (res.meta?.changes ?? 0) > 0;
}

// ── accounts ───────────────────────────────────────────────────────────
export async function getAccountByEmail(email) {
  return getDb().prepare(`SELECT * FROM accounts WHERE email=?`).bind(email).first();
}

export async function upsertVerifiedAccountWithPassword(email, passwordHash) {
  const db = getDb();
  const t = now();
  await db
    .prepare(
      `INSERT INTO accounts (email, password_hash, email_verified_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(email) DO UPDATE SET
         password_hash = excluded.password_hash,
         email_verified_at = COALESCE(accounts.email_verified_at, excluded.email_verified_at),
         updated_at = excluded.updated_at`,
    )
    .bind(email, passwordHash, t, t, t)
    .run();
  return getAccountByEmail(email);
}

// ── email tokens ───────────────────────────────────────────────────────
const TTL = { confirm_subscribe: 86400, confirm_account: 86400, password_reset: 3600 };

/** Create a token, store only its hash, return the RAW token to email. */
export async function issueToken(email, purpose) {
  const db = getDb();
  const raw = randomToken(32);
  const hash = await sha256Hex(raw);
  const t = now();
  await db
    .prepare(
      `INSERT INTO email_tokens (email, purpose, token_hash, expires_at, created_at)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .bind(email, purpose, hash, t + (TTL[purpose] ?? 86400), t)
    .run();
  return raw;
}

/** Validate + consume a token. Returns { email } on success, else null. */
export async function consumeToken(raw, purpose) {
  if (!raw) return null;
  const db = getDb();
  const hash = await sha256Hex(raw);
  const row = await db
    .prepare(
      `SELECT * FROM email_tokens WHERE token_hash=? AND purpose=? LIMIT 1`,
    )
    .bind(hash, purpose)
    .first();
  if (!row) return null;
  if (row.consumed_at || row.expires_at < now()) return null;
  await db
    .prepare(`UPDATE email_tokens SET consumed_at=? WHERE id=?`)
    .bind(now(), row.id)
    .run();
  return { email: row.email };
}

/** Peek a token without consuming (for confirm landing → then set password). */
export async function peekToken(raw, purpose) {
  if (!raw) return null;
  const db = getDb();
  const hash = await sha256Hex(raw);
  const row = await db
    .prepare(`SELECT * FROM email_tokens WHERE token_hash=? AND purpose=? LIMIT 1`)
    .bind(hash, purpose)
    .first();
  if (!row || row.consumed_at || row.expires_at < now()) return null;
  return { email: row.email };
}

// ── soft rate limit (per bucket, fixed 60s window) ─────────────────────
export async function rateLimit(bucket, limit = 10, windowSec = 60) {
  const db = getDb();
  const windowStart = Math.floor(Date.now() / 1000 / windowSec) * windowSec;
  try {
    await db
      .prepare(
        `INSERT INTO rate_limits (bucket, window_start, count) VALUES (?, ?, 1)
         ON CONFLICT(bucket, window_start) DO UPDATE SET count = count + 1`,
      )
      .bind(bucket, windowStart)
      .run();
    const row = await db
      .prepare(`SELECT count FROM rate_limits WHERE bucket=? AND window_start=?`)
      .bind(bucket, windowStart)
      .first();
    return (row?.count ?? 0) <= limit;
  } catch {
    return true; // fail-open; rate limiting is best-effort
  }
}
