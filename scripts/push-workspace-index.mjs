import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { buildWorkspaceSnapshot } from "./lib/workspace-snapshot.mjs";

const args = new Set(process.argv.slice(2));
const quiet = args.has("--quiet");
const dryRun = args.has("--dry-run");
const force = args.has("--force");

function log(message) {
  if (!quiet) console.log(message);
}

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

function gitHead(repoRoot) {
  try {
    return execFileSync("git", ["-C", repoRoot, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  } catch {
    return null;
  }
}

function stateFilePath(repoRoot) {
  return path.join(repoRoot, ".git", "workspace-graphql-sync.json");
}

function readState(filePath) {
  if (!existsSync(filePath)) return null;
  try {
    return JSON.parse(readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function writeState(filePath, state) {
  writeFileSync(filePath, `${JSON.stringify(state, null, 2)}\n`);
}

function snapshotHash(snapshot) {
  return createHash("sha256").update(JSON.stringify(snapshot)).digest("hex");
}

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fileEnv = readEnvFile(path.join(repoRoot, ".env.graphql-sync.local"));
const env = { ...fileEnv, ...process.env };
const workspaceRoot = env.GRAPHQL_SYNC_WORKSPACE_ROOT || "/data/src";
const sourceRevision = gitHead(repoRoot);
const snapshot = buildWorkspaceSnapshot({ workspaceRoot, sourceRevision });
const statePath = stateFilePath(repoRoot);
const state = readState(statePath);
const contentHash = snapshotHash({
  digest: snapshot.digest,
  stats: snapshot.stats,
});

if (!force && state?.contentHash === contentHash) {
  log("workspace GraphQL sync: no manifest or page metadata changes");
  process.exit(0);
}

if (dryRun) {
  log(
    `workspace GraphQL sync dry run: ${snapshot.stats.totalManifests} manifest(s), ` +
      `${snapshot.stats.totalSitePages} page(s), digest ${snapshot.digest}`,
  );
  process.exit(0);
}

const endpoint = env.GRAPHQL_SYNC_ENDPOINT || "";
const key = env.GRAPHQL_SYNC_KEY || "";

if (!endpoint || !key) {
  const message =
    "workspace GraphQL sync is not configured; set GRAPHQL_SYNC_ENDPOINT and GRAPHQL_SYNC_KEY";
  if (quiet) process.exit(0);
  console.error(message);
  process.exit(1);
}

const mutation = `
  mutation PushWorkspaceSnapshot($snapshot: JSON!, $sourceRevision: String, $digest: String) {
    pushWorkspaceSnapshot(snapshot: $snapshot, sourceRevision: $sourceRevision, digest: $digest) {
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
  body: JSON.stringify({
    query: mutation,
    variables: {
      snapshot,
      sourceRevision: snapshot.sourceRevision,
      digest: snapshot.digest,
    },
  }),
});

let payload;
try {
  payload = await response.json();
} catch {
  throw new Error(`workspace GraphQL sync failed with HTTP ${response.status}`);
}

if (!response.ok || payload?.errors?.length) {
  const message = payload?.errors?.map((error) => error.message).join("; ")
    || `HTTP ${response.status}`;
  throw new Error(`workspace GraphQL sync failed: ${message}`);
}

writeState(statePath, {
  contentHash,
  digest: snapshot.digest,
  endpoint,
  manifestsCount: snapshot.stats.totalManifests,
  sitePagesCount: snapshot.stats.totalSitePages,
  pushedAt: new Date().toISOString(),
  sourceRevision: snapshot.sourceRevision,
});

log(
  `workspace GraphQL sync: pushed ${snapshot.stats.totalManifests} manifest(s) and ` +
    `${snapshot.stats.totalSitePages} page(s)`,
);
