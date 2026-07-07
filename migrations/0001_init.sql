-- ragbaz.cc accounts + newsletter — initial schema
-- Applied with: wrangler d1 migrations apply ragbaz-cc-accounts [--local|--remote]

CREATE TABLE IF NOT EXISTS accounts (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  email              TEXT NOT NULL UNIQUE,
  password_hash      TEXT,
  email_verified_at  INTEGER,
  stripe_customer_id TEXT,
  created_at         INTEGER NOT NULL,
  updated_at         INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS subscribers (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  email             TEXT NOT NULL UNIQUE,
  status            TEXT NOT NULL DEFAULT 'pending',
  confirmed_at      INTEGER,
  unsubscribe_token TEXT NOT NULL,
  created_at        INTEGER NOT NULL,
  updated_at        INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS email_tokens (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  email       TEXT NOT NULL,
  purpose     TEXT NOT NULL,
  token_hash  TEXT NOT NULL,
  expires_at  INTEGER NOT NULL,
  consumed_at INTEGER,
  created_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_email_tokens_hash ON email_tokens(token_hash);

CREATE TABLE IF NOT EXISTS rate_limits (
  bucket     TEXT NOT NULL,
  window_start INTEGER NOT NULL,
  count      INTEGER NOT NULL,
  PRIMARY KEY (bucket, window_start)
);
