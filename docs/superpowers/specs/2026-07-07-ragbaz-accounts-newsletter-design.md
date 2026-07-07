# ragbaz.cc — accounts, newsletter & gated downloads

**Date:** 2026-07-07
**Status:** approved (design)
**Runs on:** the ragbaz.cc OpenNext Cloudflare Worker (branch `accounts`, stacked on `edge-worker`).

## Goal

Give ragbaz.cc self-contained accounts and a double-opt-in newsletter, and
require an account to download `/school` artifacts. Newsletter now; the schema
leaves room for paid Stripe subscriptions later without a migration.

## Non-goals

- No paid billing in this pass. The buy buttons stay disabled ("coming soon").
- No admin UI for the subscriber list (query D1 directly for now).
- No social/OAuth login. Email + password only.

## Data — D1 database `ragbaz-cc-accounts`

Migration `migrations/0001_init.sql`.

```sql
CREATE TABLE accounts (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  email             TEXT NOT NULL UNIQUE,          -- lowercased
  password_hash     TEXT,                          -- PBKDF2 string; NULL until set
  email_verified_at INTEGER,                        -- epoch seconds
  stripe_customer_id TEXT,                          -- reserved for paid plans
  created_at        INTEGER NOT NULL,
  updated_at        INTEGER NOT NULL
);

CREATE TABLE subscribers (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  email             TEXT NOT NULL UNIQUE,          -- lowercased
  status            TEXT NOT NULL DEFAULT 'pending', -- pending | confirmed | unsubscribed
  confirmed_at      INTEGER,
  unsubscribe_token TEXT NOT NULL,                 -- opaque, for one-click unsub
  created_at        INTEGER NOT NULL,
  updated_at        INTEGER NOT NULL
);

CREATE TABLE email_tokens (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  email       TEXT NOT NULL,                       -- lowercased
  purpose     TEXT NOT NULL,                       -- confirm_subscribe | confirm_account | password_reset
  token_hash  TEXT NOT NULL,                       -- sha-256 of the raw token we emailed
  expires_at  INTEGER NOT NULL,
  consumed_at INTEGER,
  created_at  INTEGER NOT NULL
);
CREATE INDEX idx_email_tokens_hash ON email_tokens(token_hash);
```

Sessions are **stateless** — a signed cookie, no table.

## Security

- **Passwords:** PBKDF2-HMAC-SHA256, 210 000 iterations, 16-byte random salt,
  via WebCrypto `subtle`. Stored as `pbkdf2$210000$<salt_b64>$<hash_b64>`.
  Verification recomputes and compares in constant time.
- **Tokens:** 32 random bytes, base64url. We email the raw token and store only
  its SHA-256 in `email_tokens.token_hash`. Single-use (`consumed_at`), 24 h TTL
  for confirmations, 1 h for password reset.
- **Sessions:** cookie `rb_session` = `<payload_b64>.<hmac>` where payload is
  `{ sub: accountId, email, exp }`; HMAC-SHA256 over the payload with
  `SESSION_SECRET`. `HttpOnly; Secure; SameSite=Lax; Path=/`, 7-day expiry.
- **Enumeration:** `/api/subscribe` and `/api/login` return the same response
  whether or not the email exists; timing kept roughly uniform.
- **Rate limiting:** best-effort per-IP counter in D1 (or KV if added later) on
  subscribe / login / token endpoints — cap ~10/min. Soft; not a hard security
  boundary.

## Email — Resend

Worker calls `https://api.resend.com/emails` with `Authorization: Bearer
$RESEND_API_KEY`, `from: "ragbaz <no-reply@ragbaz.cc>"`. Requires verifying
`ragbaz.cc` as a Resend sending domain (DNS). If `RESEND_API_KEY` is unset
(dev), the transport logs the email to console instead of sending, so the full
flow is testable locally.

Two templates: **confirm subscription** and **confirm account / set password**,
plain-text + minimal HTML, each with the tokenized action link and (for
newsletter) a one-click unsubscribe link.

## Flows

1. **Subscribe** (widget below the homepage slideshow): `POST /api/subscribe
   {email}` → upsert `subscribers` as `pending`, mint a `confirm_subscribe`
   token, email it. Always 200.
2. **Confirm subscription:** `GET /auth/confirm?token=…` → mark subscriber
   `confirmed`; render a page offering to **set a password** and create an
   account with the now-verified email.
3. **Set password / create account:** `POST /api/account/set-password {token,
   password}` → create/find `accounts` row, store hash, set
   `email_verified_at`, start a session.
4. **Login:** `POST /api/login {email,password}` → verify hash → session cookie.
5. **Logout:** `POST /api/logout` → clear cookie.
6. **Session probe:** `GET /api/me` → `{ email }` or `401`; drives header UI.
7. **Unsubscribe:** `GET /api/unsubscribe?token=…` → mark `unsubscribed`.

## UI

- **Account menu:** a round "head" icon injected into every page's header by the
  HTML route handler (keeps the static files clean). Logged out → opens a
  login/signup panel (email → we email a link; or email+password login).
  Logged in → shows email + logout. Injection appends a small
  `/assets/account.js` + inline markup before `</body>`.
- **Subscribe widget:** injected below the slideshow on the homepage only
  ("very low volume — only substantial news"). email input + button →
  `/api/subscribe`, inline success/error.

## Download gating

Currently `/school/**/assets/*.sh|.py` and `/assets/ragbaz-prospectus.pdf` are
public static files. To require an account:

- `scripts/sync-public.mjs` stops copying the gated paths into `public/`.
- A worker route `app/school/[...]/…` (catch gated asset paths) checks the
  session; anonymous → 302 to `/?signup=1&next=<path>`; authenticated →
  streams the file with the right content-type and
  `Content-Disposition: attachment`.
- Gated set (initial): the three `/school/forensics/assets/*` tool files.
  Everything else (pages, CSS, logo) stays public. The prospectus PDF gating is
  a config toggle, default **public** unless requested.

## Config / secrets

Worker `vars`: `APP_URL=https://ragbaz.cc`, `RESEND_FROM=ragbaz
<no-reply@ragbaz.cc>`. Secrets: `RESEND_API_KEY`, `SESSION_SECRET` (random
32+ bytes). D1 binding `DB` → `ragbaz-cc-accounts`.

## Testing

- Local: `wrangler dev` with local D1; `wrangler d1 migrations apply
  ragbaz-cc-accounts --local`. Console email transport prints the tokenized
  links; drive the whole subscribe → confirm → set-password → login → gated
  download flow via curl against the local worker.
- Assert: enumeration responses identical; expired/consumed tokens rejected;
  gated asset 302s when anonymous, 200 + attachment when logged in; wrong
  password rejected; session cookie survives navigation.

## Deploy prerequisites (user-provided)

1. `RESEND_API_KEY` set as a Worker secret; `ragbaz.cc` verified in Resend.
2. Create the D1 database and put its id in `wrangler.jsonc`.
3. Apex `ragbaz.cc` → Worker route (separate DNS step; nginx serves prod until
   cutover).
