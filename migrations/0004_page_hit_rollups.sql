-- Track public page hits and daily unique visitors for /stats.
-- Applied with: wrangler d1 migrations apply ragbaz-cc-accounts [--local|--remote]

CREATE TABLE IF NOT EXISTS page_hit_seen (
  day           TEXT NOT NULL,
  path          TEXT NOT NULL,
  visitor_hash  TEXT NOT NULL,
  first_seen_at INTEGER NOT NULL,
  PRIMARY KEY (day, path, visitor_hash)
);

CREATE TABLE IF NOT EXISTS page_hit_rollups (
  day     TEXT NOT NULL,
  path    TEXT NOT NULL,
  hits    INTEGER NOT NULL DEFAULT 0,
  uniques INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, path)
);

CREATE INDEX IF NOT EXISTS idx_page_hit_rollups_day ON page_hit_rollups(day);
