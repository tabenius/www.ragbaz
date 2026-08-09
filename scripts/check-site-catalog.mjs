import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { prospectEntries, publicProducts, readSiteCatalog, unpublishedProducts } from "../../../metadata/src/site-catalog.mjs";
import { generateCompletionHtml, generateProductsJsModule, readProductRegistry } from "./lib/product-registry.mjs";
import { renderProspectPages } from "./lib/prospect-registry.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const indexHtml = readFileSync(path.join(repoRoot, "site", "index.html"), "utf8");
const pricingHtml = readFileSync(path.join(repoRoot, "site", "pricing.html"), "utf8");
const completionHtml = readFileSync(path.join(repoRoot, "site", "completion.html"), "utf8");

function anchorFromHref(href) {
  const match = String(href || "").match(/#([A-Za-z0-9_-]+)$/);
  return match ? match[1] : null;
}

function assert(condition, message, failures) {
  if (!condition) failures.push(message);
}

// ensure-local-mode.mjs injects this tag before </head> after generation; it is
// not part of the generated output, so strip it before comparing bytes.
function stripLocalMode(html) {
  return html.replace(/\s*<script\s+src=["'][^"']*assets\/local-mode\.js["']\s+defer><\/script>\s*/g, "\n");
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const catalog = readSiteCatalog();
const failures = [];

for (const product of publicProducts(catalog)) {
  const anchor = anchorFromHref(product.links?.site);
  if (anchor) {
    assert(indexHtml.includes(`id="${anchor}"`), `index.html is missing section id "${anchor}" for ${product.slug}`, failures);
    assert(indexHtml.includes(`#${anchor}`), `index.html is missing nav/reference for #${anchor} (${product.slug})`, failures);
    assert(pricingHtml.includes(`/#${anchor}`), `pricing.html is missing /#${anchor} nav entry for ${product.slug}`, failures);
    assert(completionHtml.includes(`/#${anchor}`), `completion.html is missing /#${anchor} nav entry for ${product.slug}`, failures);

    const sectionMatch = indexHtml.match(new RegExp(`<article[^>]*id="${escapeRegExp(anchor)}"[^>]*>([\\s\\S]*?)<\\/article>`));
    assert(sectionMatch, `index.html section ${anchor} could not be parsed for ${product.slug}`, failures);
    if (sectionMatch) {
      assert(
        sectionMatch[1].includes(`<span class="st mono">${product.tagLabel}</span>`),
        `index.html section ${anchor} tag is stale for ${product.slug} (expected "${product.tagLabel}" from products.json; update the hand-authored section)`,
        failures,
      );
    }
  }
}

for (const product of unpublishedProducts(catalog)) {
  const anchor = anchorFromHref(product.links?.site);
  if (!anchor) continue;
  assert(!indexHtml.includes(`#${anchor}`), `index.html still references unpublished product ${product.slug}`, failures);
  assert(!indexHtml.includes(`id="${anchor}"`), `index.html still exposes unpublished product section ${product.slug}`, failures);
  assert(!pricingHtml.includes(`/#${anchor}`), `pricing.html still references unpublished product ${product.slug}`, failures);
  assert(!completionHtml.includes(`/#${anchor}`), `completion.html still references unpublished product ${product.slug}`, failures);
}

for (const entry of prospectEntries(catalog)) {
  const slug = entry.prospect?.slug;
  const prospectPath = path.join(repoRoot, "site", "prospects", `${slug}.html`);
  assert(existsSync(prospectPath), `missing generated prospect page for ${slug}`, failures);
}

// Byte-parity: the generated artifacts must match what the catalog currently
// produces, otherwise committed pages silently drift from /metadata/products.json.
const registry = readProductRegistry();
const updatedDate = registry.version || new Date().toISOString().slice(0, 10);

assert(
  stripLocalMode(completionHtml) === generateCompletionHtml(registry, updatedDate),
  "site/completion.html is out of sync with products.json (run `npm run prepare:content`)",
  failures,
);

for (const { slug, html } of renderProspectPages()) {
  const onDisk = readFileSync(path.join(repoRoot, "site", "prospects", `${slug}.html`), "utf8");
  assert(
    stripLocalMode(onDisk) === html,
    `site/prospects/${slug}.html is out of sync with products.json (run \`npm run prepare:content\`)`,
    failures,
  );
}

const generatedProductsJs = readFileSync(path.join(repoRoot, "lib", "products.generated.mjs"), "utf8");
assert(
  generatedProductsJs === generateProductsJsModule(registry),
  "lib/products.generated.mjs is out of sync with products.json (run `npm run prepare:content`)",
  failures,
);

if (failures.length) {
  console.error("site catalog check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("site catalog check: public/unpublished product distribution is consistent");
