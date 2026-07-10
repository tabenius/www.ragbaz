-- ragbaz.cc workspace snapshot for GraphQL aggregation
-- Applied with: wrangler d1 migrations apply ragbaz-cc-accounts [--local|--remote]

CREATE TABLE IF NOT EXISTS workspace_snapshots (
  scope           TEXT PRIMARY KEY,
  schema_version  INTEGER NOT NULL,
  payload_json    TEXT NOT NULL,
  manifests_count INTEGER NOT NULL DEFAULT 0,
  site_pages_count INTEGER NOT NULL DEFAULT 0,
  digest          TEXT,
  source_revision TEXT,
  updated_at      INTEGER NOT NULL
);
