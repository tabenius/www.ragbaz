import { maybeDb, getDb } from "./accounts/env.mjs";
import { bundledWorkspaceSnapshot, normalizeWorkspaceSnapshot } from "./workspace-index.mjs";

const SNAPSHOT_SCOPE = "ragbaz-workspace";

function now() {
  return Math.floor(Date.now() / 1000);
}

function missingTable(error) {
  return /no such table:\s*workspace_snapshots/i.test(String(error?.message || error));
}

export async function loadStoredWorkspaceSnapshot() {
  const db = maybeDb();
  if (!db) return null;
  try {
    const row = await db
      .prepare(`SELECT payload_json FROM workspace_snapshots WHERE scope=? LIMIT 1`)
      .bind(SNAPSHOT_SCOPE)
      .first();
    if (!row?.payload_json) return null;
    return normalizeWorkspaceSnapshot(JSON.parse(row.payload_json));
  } catch (error) {
    if (missingTable(error)) return null;
    throw error;
  }
}

export async function currentWorkspaceSnapshot() {
  return (await loadStoredWorkspaceSnapshot()) || bundledWorkspaceSnapshot();
}

export async function saveWorkspaceSnapshotToDb({ db, snapshot, sourceRevision, digest }) {
  const storedAt = new Date().toISOString();
  const normalized = normalizeWorkspaceSnapshot({
    ...snapshot,
    sourceRevision: sourceRevision ?? snapshot?.sourceRevision ?? null,
    digest: digest ?? snapshot?.digest ?? null,
    storedAt,
  });
  const payload = JSON.stringify(normalized);

  try {
    await db
      .prepare(
        `INSERT INTO workspace_snapshots
           (scope, schema_version, payload_json, manifests_count, site_pages_count, digest, source_revision, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(scope) DO UPDATE SET
           schema_version=excluded.schema_version,
           payload_json=excluded.payload_json,
           manifests_count=excluded.manifests_count,
           site_pages_count=excluded.site_pages_count,
           digest=excluded.digest,
           source_revision=excluded.source_revision,
           updated_at=excluded.updated_at`,
      )
      .bind(
        SNAPSHOT_SCOPE,
        normalized.version,
        payload,
        normalized.stats.totalManifests,
        normalized.stats.totalSitePages,
        normalized.digest,
        normalized.sourceRevision,
        now(),
      )
      .run();
  } catch (error) {
    if (missingTable(error)) {
      throw new Error("workspace_snapshots table is missing; apply D1 migration 0002_workspace_snapshot.sql");
    }
    throw error;
  }

  return normalized;
}

export async function saveWorkspaceSnapshot({ snapshot, sourceRevision, digest }) {
  return saveWorkspaceSnapshotToDb({
    db: getDb(),
    snapshot,
    sourceRevision,
    digest,
  });
}
