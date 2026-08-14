import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const docsRoot = process.env.RAGBAZ_DOCS_ROOT
  ? path.resolve(process.env.RAGBAZ_DOCS_ROOT)
  : path.resolve(repoRoot, "..", "..", "doc.ragbaz.cc");
const docsBuildDir = path.join(docsRoot, "build");
const embeddedDocsDir = path.join(repoRoot, "embedded-docs");

const result = spawnSync("npm", ["--prefix", docsRoot, "run", "build"], {
  stdio: "inherit",
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

if (!existsSync(docsBuildDir)) {
  throw new Error(`embedded docs build missing: ${docsBuildDir}`);
}

rmSync(embeddedDocsDir, { recursive: true, force: true });
mkdirSync(path.dirname(embeddedDocsDir), { recursive: true });
cpSync(docsBuildDir, embeddedDocsDir, { recursive: true });

console.log("embedded-docs: copied doc.ragbaz.cc/build into embedded-docs/");
