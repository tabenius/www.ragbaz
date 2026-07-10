import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  readProductRegistry,
  generateCompletionHtml,
  generateProductsJsModule,
} from "./lib/product-registry.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE_DIR = path.join(repoRoot, "site");
const LIB_DIR = path.join(repoRoot, "lib");

const registry = readProductRegistry();
const now = registry.version || new Date().toISOString().slice(0, 10);

// Generate /completion page
const html = generateCompletionHtml(registry, now);
writeFileSync(path.join(SITE_DIR, "completion.html"), html, "utf8");

// Generate JS module for other consumers (pricing page, dashboard, etc.)
const jsModule = generateProductsJsModule(registry);
writeFileSync(path.join(LIB_DIR, "products.generated.mjs"), jsModule, "utf8");

console.log(
  `products-page: generated site/completion.html and lib/products.generated.mjs from ${registry.products.length} products`,
);
