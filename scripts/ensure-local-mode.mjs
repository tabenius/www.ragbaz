import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptsDir, "..");
const siteRoot = path.join(repoRoot, "site");
const localModeTarget = path.join(siteRoot, "assets", "local-mode.js");

function toPosix(value) {
  return value.split(path.sep).join("/");
}

function relativeLocalModeScript(htmlPath) {
  const rel = toPosix(path.relative(path.dirname(htmlPath), localModeTarget));
  return rel.startsWith(".") ? rel : `./${rel}`;
}

function walkHtml(dir, out) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const absPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkHtml(absPath, out);
      continue;
    }
    if (entry.name.endsWith(".html")) out.push(absPath);
  }
  return out;
}

const htmlFiles = walkHtml(siteRoot, []);
let updated = 0;

for (const htmlPath of htmlFiles) {
  const scriptSrc = relativeLocalModeScript(htmlPath);
  const scriptTag = `  <script src="${scriptSrc}" defer></script>\n`;
  const current = readFileSync(htmlPath, "utf8");
  const withoutOldTag = current.replace(
    /\s*<script\s+src=["'][^"']*assets\/local-mode\.js["']\s+defer><\/script>\s*/g,
    "\n",
  );

  if (!withoutOldTag.includes("</head>")) continue;

  const next = withoutOldTag.replace("</head>", `${scriptTag}</head>`);
  if (next !== current) {
    writeFileSync(htmlPath, next, "utf8");
    updated += 1;
  }
}

console.log(`ensure-local-mode: updated ${updated} HTML page(s)`);
