// Build-time access to the static HTML in site/ and the embedded Docusaurus
// atlas build. Everything is resolved during Next's static generation; no
// filesystem access happens on the Worker at request time.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const SITE_DIR = path.join(process.cwd(), "site");
const DOCS_DIR = path.join(process.cwd(), "embedded-docs");

function walkHtml(rootDir, rel, out) {
  for (const entry of readdirSync(path.join(rootDir, rel), { withFileTypes: true })) {
    const relPath = rel ? `${rel}/${entry.name}` : entry.name;
    if (entry.isDirectory()) walkHtml(rootDir, relPath, out);
    else if (entry.name.endsWith(".html")) out.push(relPath);
  }
  return out;
}

function routeForSiteHtml(rel) {
  if (rel === "index.html") return "";
  if (rel.endsWith("/index.html")) return rel.slice(0, -"/index.html".length);
  if (rel.endsWith(".html")) return rel.slice(0, -".html".length);
  return rel;
}

function routeForDocsHtml(rel) {
  if (rel === "index.html") return "doc";
  if (rel.endsWith("/index.html")) return `doc/${rel.slice(0, -"/index.html".length)}`;
  return `doc/${rel}`;
}

function buildPageIndex(rootDir, kind, routeForHtml) {
  if (!existsSync(rootDir)) return [];
  return walkHtml(rootDir, "", []).map((relPath) => ({
    kind,
    route: routeForHtml(relPath),
    filePath: path.join(rootDir, relPath),
  }));
}

const PAGE_ENTRIES = [
  ...buildPageIndex(SITE_DIR, "site", routeForSiteHtml),
  ...buildPageIndex(DOCS_DIR, "docs", routeForDocsHtml),
];

const PAGE_INDEX = new Map(PAGE_ENTRIES.map((entry) => [entry.route, entry]));

/** URL path segments for every page except the root, e.g. ["school","forensics","lab-1"]. */
export function pageParams() {
  return [...PAGE_INDEX.keys()]
    .filter(Boolean)
    .sort()
    .map((route) => route.split("/"));
}

/** Resolve URL segments to page HTML and metadata, or null. */
export function resolvePage(segments) {
  const route = segments.join("/");
  const entry = PAGE_INDEX.get(route);
  if (!entry) return null;
  return {
    kind: entry.kind,
    route,
    html: readFileSync(entry.filePath, "utf8"),
  };
}

export function docsNotFoundPage() {
  const entry = PAGE_INDEX.get("doc/404.html");
  if (!entry) return null;
  return {
    kind: "docs",
    route: entry.route,
    html: readFileSync(entry.filePath, "utf8"),
  };
}

// Injected on every non-doc page so the floating account menu and (where
// present) the subscribe widget are wired up. Kept in one place so the static
// site/ files stay clean.
const ACCOUNT_CHROME =
  '<link rel="stylesheet" href="/assets/account.css"/>' +
  '<script src="/assets/account.js" defer></script>';

export function htmlResponse(page, status = 200) {
  if (!page?.html) return new Response("Not found", { status });
  const injected = page.kind === "docs"
    ? page.html
    : page.html.includes("</body>")
      ? page.html.replace("</body>", `${ACCOUNT_CHROME}</body>`)
      : page.html + ACCOUNT_CHROME;
  return new Response(injected, {
    status,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
