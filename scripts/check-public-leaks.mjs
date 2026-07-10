import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const targets = [
  path.join(repoRoot, "app"),
  path.join(repoRoot, "site"),
  path.join(repoRoot, "public"),
  path.join(repoRoot, "lib", "workspace-index.generated.mjs"),
  path.join(repoRoot, "..", "..", "meta.json"),
];

const patterns = [
  { label: "tailscale keyword", regex: /\btailscale\b/i },
  { label: "tail alias", regex: /\b[a-z0-9-]+-tail\b/i },
  { label: "internal 100.x address", regex: /\b100\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/ },
  { label: "known konsonans tail address", regex: /\b100\.102\.135\.43\b/ },
  { label: "known fillmeup tail address", regex: /\b100\.82\.132\.78\b/ },
];

const textExtensions = new Set([
  ".css",
  ".html",
  ".js",
  ".json",
  ".md",
  ".mjs",
  ".svg",
  ".txt",
]);

function collectFiles(target, files = []) {
  let stats;
  try {
    stats = statSync(target);
  } catch {
    return files;
  }

  if (stats.isDirectory()) {
    for (const entry of readdirSync(target, { withFileTypes: true })) {
      collectFiles(path.join(target, entry.name), files);
    }
    return files;
  }

  if (textExtensions.has(path.extname(target))) {
    files.push(target);
  }
  return files;
}

const failures = [];
for (const filePath of targets.flatMap((target) => collectFiles(target))) {
  const text = readFileSync(filePath, "utf8");
  for (const pattern of patterns) {
    const match = text.match(pattern.regex);
    if (!match) continue;
    failures.push({
      filePath: path.relative(repoRoot, filePath),
      label: pattern.label,
      value: match[0],
    });
  }
}

if (failures.length) {
  console.error("public leak check failed:");
  for (const failure of failures) {
    console.error(`- ${failure.filePath}: ${failure.label} -> ${failure.value}`);
  }
  process.exit(1);
}

console.log("public leak check: no tailscale or internal 100.x references found");
