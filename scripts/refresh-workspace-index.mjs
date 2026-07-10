import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

function readEnvFile(filePath) {
  if (!existsSync(filePath)) return {};
  const env = {};
  for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#")) continue;
    const index = line.indexOf("=");
    if (index < 0) continue;
    const key = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim();
    if (key) env[key] = value;
  }
  return env;
}

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fileEnv = readEnvFile(path.join(repoRoot, ".env.graphql-sync.local"));
const env = { ...process.env, ...fileEnv };
const endpoint = env.GRAPHQL_SYNC_ENDPOINT || "https://ragbaz.cc/api/graphql";
const key = env.GRAPHQL_SYNC_KEY || "";

if (!endpoint || !key) {
  console.log("workspace GraphQL refresh: skipped (GRAPHQL_SYNC_ENDPOINT / GRAPHQL_SYNC_KEY not configured)");
  process.exit(0);
}

const mutation = `
  mutation RefreshWorkspaceSnapshot {
    refreshWorkspaceSnapshot {
      ok
      manifestsCount
      sitePagesCount
      digest
      sourceRevision
      storedAt
    }
  }
`;

const response = await fetch(endpoint, {
  method: "POST",
  headers: {
    authorization: `Bearer ${key}`,
    "content-type": "application/json",
  },
  body: JSON.stringify({ query: mutation }),
});

let payload;
try {
  payload = await response.json();
} catch {
  throw new Error(`workspace GraphQL refresh failed with HTTP ${response.status}`);
}

if (!response.ok || payload?.errors?.length) {
  const message = payload?.errors?.map((error) => error.message).join("; ")
    || `HTTP ${response.status}`;
  if (message.includes("WORKSPACE_GRAPHQL_UPSTREAM_URL is not configured")) {
    console.log("workspace GraphQL refresh: skipped (upstream GraphQL source is not configured on the deployed Worker)");
    process.exit(0);
  }
  throw new Error(`workspace GraphQL refresh failed: ${message}`);
}

console.log(
  `workspace GraphQL refresh: pulled ${payload.data.refreshWorkspaceSnapshot.manifestsCount} manifest(s) and ` +
    `${payload.data.refreshWorkspaceSnapshot.sitePagesCount} page(s)`,
);
