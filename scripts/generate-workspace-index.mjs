import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildWorkspaceSnapshot,
  writeGeneratedWorkspaceIndex,
} from "./lib/workspace-snapshot.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = path.join(repoRoot, "lib", "workspace-index.generated.mjs");
const snapshot = buildWorkspaceSnapshot();

writeGeneratedWorkspaceIndex(snapshot, outputPath);
console.log(
  `workspace-index: wrote ${snapshot.stats.totalManifests} manifest(s) and ${snapshot.stats.totalSitePages} page(s)`,
);
