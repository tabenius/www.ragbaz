import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = process.env.RAGBAZ_CATALOG_SOURCE
  ? path.resolve(process.env.RAGBAZ_CATALOG_SOURCE)
  : path.resolve(repoRoot, "..", "..", "metadata", "products.json");
const outputPath = path.join(repoRoot, "catalog", "products.json");

const source = readFileSync(sourcePath, "utf8");
const catalog = JSON.parse(source);
if (!catalog?.version || !catalog?.evaluatedAt || !Array.isArray(catalog?.products)) {
  throw new Error(`invalid public catalog source: ${sourcePath}`);
}

writeFileSync(outputPath, `${JSON.stringify(catalog, null, 2)}\n`);
console.log(`catalog: synced ${catalog.products.length} products evaluated ${catalog.evaluatedAt}`);
