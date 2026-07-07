// Build-time access to the static HTML in site/.
//
// Serving rule mirrors the nginx config this site shipped with:
//   try_files $uri $uri.html $uri/index.html
// so /pricing -> site/pricing.html and /school/ -> site/school/index.html.
// Everything is resolved at build time (force-static routes); no filesystem
// access happens on the Worker.
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const SITE_DIR = path.join(process.cwd(), "site");

function walk(rel, out) {
  for (const entry of readdirSync(path.join(SITE_DIR, rel), {
    withFileTypes: true,
  })) {
    const relPath = rel ? `${rel}/${entry.name}` : entry.name;
    if (entry.isDirectory()) walk(relPath, out);
    else if (entry.name.endsWith(".html")) out.push(relPath);
  }
  return out;
}

/** URL path segments for every page except the root, e.g. ["school","forensics","lab-1"]. */
export function pageParams() {
  return walk("", [])
    .map((rel) => rel.replace(/\.html$/, "").replace(/\/index$/, ""))
    .filter((clean) => clean !== "index")
    .map((clean) => clean.split("/"));
}

/** Resolve URL segments to page HTML, or null. */
export function readPage(segments) {
  const rel = segments.join("/");
  if (!/^[\w./-]*$/.test(rel) || rel.includes("..")) return null;
  for (const candidate of rel === ""
    ? ["index.html"]
    : [`${rel}.html`, `${rel}/index.html`]) {
    try {
      return readFileSync(path.join(SITE_DIR, candidate), "utf8");
    } catch {
      /* try next */
    }
  }
  return null;
}

// Injected on every page so the floating account menu and (where present) the
// subscribe widget are wired up. Kept in one place so the static site/ files
// stay clean.
const ACCOUNT_CHROME =
  '<link rel="stylesheet" href="/assets/account.css"/>' +
  '<script src="/assets/account.js" defer></script>';

export function htmlResponse(html) {
  if (html == null) return new Response("Not found", { status: 404 });
  const injected = html.includes("</body>")
    ? html.replace("</body>", `${ACCOUNT_CHROME}</body>`)
    : html + ACCOUNT_CHROME;
  return new Response(injected, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
