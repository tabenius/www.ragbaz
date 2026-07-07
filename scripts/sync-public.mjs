// Copy every non-HTML file from site/ into public/ so Next serves them as
// static assets at their original URLs (/colors_and_type.css, /assets/...,
// /school/forensics/assets/...). HTML pages are served by the app router
// instead, which emulates nginx's `try_files $uri $uri.html $uri/` rule.
import { cpSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const site = path.join(root, "..", "site");
const pub = path.join(root, "..", "public");

rmSync(pub, { recursive: true, force: true });
mkdirSync(pub, { recursive: true });

let copied = 0;
function walk(rel) {
  for (const entry of readdirSync(path.join(site, rel), { withFileTypes: true })) {
    const relPath = path.join(rel, entry.name);
    if (entry.isDirectory()) {
      walk(relPath);
    } else if (!entry.name.endsWith(".html")) {
      mkdirSync(path.dirname(path.join(pub, relPath)), { recursive: true });
      cpSync(path.join(site, relPath), path.join(pub, relPath));
      copied += 1;
    }
  }
}
walk(".");
console.log(`sync-public: copied ${copied} non-HTML files from site/ to public/`);
