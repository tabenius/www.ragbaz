import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(repoRoot, "wrangler.jsonc");
const outputPath = path.join(repoRoot, ".wrangler.production.jsonc");
const databaseName = "ragbaz-cc-accounts";
const placeholder = "00000000-0000-0000-0000-000000000000";
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function discoverDatabaseId() {
  const result = spawnSync("npx", ["wrangler", "d1", "list", "--json"], {
    cwd: repoRoot,
    encoding: "utf8",
    env: process.env,
  });
  if (result.status !== 0) {
    throw new Error(`unable to discover D1 database ${databaseName}: ${result.stderr.trim() || "wrangler failed"}`);
  }
  const databases = JSON.parse(result.stdout);
  const match = databases.find((entry) => entry?.name === databaseName);
  return match?.uuid || match?.database_id || match?.id || "";
}

const databaseId = process.env.RAGBAZ_D1_DATABASE_ID || discoverDatabaseId();
if (!uuidPattern.test(databaseId) || databaseId === placeholder) {
  throw new Error(`valid D1 database ID not found for ${databaseName}`);
}

const source = readFileSync(sourcePath, "utf8");
const occurrences = source.split(placeholder).length - 1;
if (occurrences !== 2) {
  throw new Error(`expected two D1 ID placeholders in ${sourcePath}; found ${occurrences}`);
}
writeFileSync(outputPath, source.replaceAll(placeholder, databaseId), { mode: 0o600 });
console.log("wrangler-config: rendered production config with account-scoped D1 binding");
