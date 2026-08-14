// Sync the hand-written homepage product articles with the canonical catalog
// (catalog/products.json): status tag text and the completion meter
// in each
// article header. Copy stays hand-written; the data-driven badges do not.
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readSiteCatalog } from "../catalog/site-catalog.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const indexPath = path.join(repoRoot, "site", "index.html");

const catalog = readSiteCatalog();
const evaluatedAt = catalog.evaluatedAt || catalog.version || "";

let html = readFileSync(indexPath, "utf8");
let synced = 0;

const entries = [...catalog.products.filter((p) => p.published), ...(catalog.tracks || [])];
for (const entry of entries) {
  const site = entry.links?.site || "";
  const anchor = site.match(/#(p-[a-z0-9-]+)$/)?.[1];
  if (!anchor) continue;

  const headRe = new RegExp(
    `(<article class="prod[^"]*" id="${anchor}">\\s*<div class="hd"><h3>[^<]*</h3>)` +
      `(?:<span class="pct mono"[^>]*>.*?</span>)?` +
      `<span class="st mono">[^<]*</span>`,
    "s",
  );
  if (!headRe.test(html)) {
    console.warn(`sync-product-badges: no article header found for #${anchor} (${entry.slug})`);
    continue;
  }

  const date = entry.completionEvaluatedAt || evaluatedAt;
  const meter =
    Number.isFinite(entry.completion) && entry.completion !== null
      ? `<span class="pct mono" title="completion — evaluated ${date}">` +
        `<span class="track"><span class="fill" style="width:${entry.completion}%"></span></span>` +
        `${entry.completion}% complete</span>`
      : "";
  html = html.replace(headRe, `$1${meter}<span class="st mono">${entry.tagLabel}</span>`);
  synced += 1;

  // Every product with a prospect page gets a "prospectus →" link at the end
  // of its description (skipped when the article already links it).
  const prospect = entry.links?.prospect;
  if (prospect) {
    const articleRe = new RegExp(
      `(<article class="prod[^"]*" id="${anchor}">.*?<div class="desc">.*?)(</div>)`,
      "s",
    );
    const article = html.match(articleRe);
    if (article && !article[1].includes(`href="${prospect}"`)) {
      html = html.replace(articleRe, `$1 <a class="link" href="${prospect}">prospectus →</a>$2`);
    }
  }
}

writeFileSync(indexPath, html, "utf8");
console.log(`sync-product-badges: synced ${synced} product header(s) from catalog/products.json (evaluated ${evaluatedAt})`);
