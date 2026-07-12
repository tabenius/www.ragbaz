import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildWorkspaceSnapshot,
  comparableSnapshot,
  formatGeneratedWorkspaceIndex,
  readGeneratedWorkspaceIndex,
  writeGeneratedWorkspaceIndex,
} from "./lib/workspace-snapshot.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = path.join(repoRoot, "lib", "workspace-index.generated.mjs");
const snapshot = buildWorkspaceSnapshot();
const existing = readGeneratedWorkspaceIndex(outputPath);

if (existing?.snapshot && comparableSnapshot(existing.snapshot) === comparableSnapshot(snapshot)) {
  snapshot.generatedAt = existing.snapshot.generatedAt || snapshot.generatedAt;
}

const nextSource = formatGeneratedWorkspaceIndex(snapshot);
if (existing?.source !== nextSource) {
  writeGeneratedWorkspaceIndex(snapshot, outputPath);
}
console.log(
  `workspace-index: wrote ${snapshot.stats.totalManifests} manifest(s) and ${snapshot.stats.totalSitePages} page(s)`,
);
