import { normalizeWorkspaceSnapshot } from "./workspace-index.mjs";
import { saveWorkspaceSnapshotToDb } from "./workspace-store.mjs";

const SNAPSHOT_QUERY = `
  query WorkspaceSnapshotSync {
    snapshot {
      version
      generatedAt
      storedAt
      sourceRevision
      digest
      stats {
        totalManifests
        totalSitePages
        byKind {
          kind
          count
        }
      }
      sitePages {
        path
        localPath
        section
        title
        description
        url
      }
      manifests {
        key
        kind
        path
        localPath
        directory
        repoPath
        workspaceArea
        name
        displayName
        version
        description
        componentId
        owner
        lifecycle
        packageManager
        tags
        personas
        capabilities
        scripts
        dependencyNames
        endpointNames
        publicUrls
        supportTier
        salesStatus
        statsFile
        statsParseError
        parseError
        stats {
          path
          currency
          updatedAt
          latestDollars
          latestCompletion
          latest {
            date
            dollars
            completion
            note
          }
          entries {
            date
            dollars
            completion
            note
          }
        }
      }
    }
  }
`;

function syncError(message, statusCode = 502) {
  return Object.assign(new Error(message), { statusCode });
}

function authHeaders(key) {
  const trimmed = String(key || "").trim();
  return trimmed ? { "x-ragbaz-auth-key": trimmed } : {};
}

function payloadErrorMessage(status, payload) {
  const messages = Array.isArray(payload?.errors)
    ? payload.errors.map((error) => String(error?.message || "GraphQL error")).filter(Boolean)
    : [];
  return messages.join("; ") || `HTTP ${status}`;
}

export async function fetchWorkspaceSnapshotFromUpstream({ endpoint, key }) {
  const url = String(endpoint || "").trim();
  if (!url) throw syncError("WORKSPACE_GRAPHQL_UPSTREAM_URL is not configured", 503);

  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...authHeaders(key),
      },
      body: JSON.stringify({ query: SNAPSHOT_QUERY }),
    });
  } catch (error) {
    throw syncError(`upstream GraphQL request failed: ${error.message}`, 502);
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw syncError(`upstream GraphQL returned non-JSON (HTTP ${response.status})`, 502);
  }

  if (!response.ok || payload?.errors?.length) {
    throw syncError(
      `upstream workspace snapshot failed: ${payloadErrorMessage(response.status, payload)}`,
      response.status || 502,
    );
  }

  if (!payload?.data?.snapshot || typeof payload.data.snapshot !== "object") {
    throw syncError("upstream GraphQL response did not include a snapshot", 502);
  }

  return normalizeWorkspaceSnapshot(payload.data.snapshot);
}

export async function refreshWorkspaceSnapshotFromUpstream({ db, endpoint, key }) {
  const snapshot = await fetchWorkspaceSnapshotFromUpstream({ endpoint, key });
  const stored = await saveWorkspaceSnapshotToDb({
    db,
    snapshot,
    sourceRevision: snapshot.sourceRevision,
    digest: snapshot.digest,
  });
  return { ok: true, ...stored };
}
