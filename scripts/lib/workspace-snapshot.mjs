import { createHash } from "node:crypto";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseToml } from "smol-toml";

const MANIFEST_KINDS = new Map([
  ["ragbaz.component.json", "component"],
  ["package.json", "npm"],
  ["Cargo.toml", "cargo"],
  ["pyproject.toml", "pyproject"],
  ["wrangler.jsonc", "wrangler_jsonc"],
  ["wrangler.toml", "wrangler_toml"],
]);

const IGNORED_DIRS = new Set([
  ".claude",
  ".git",
  ".next",
  ".open-next",
  ".wrangler",
  ".venv",
  "__pycache__",
  "archive",
  "build",
  "coverage",
  "dist",
  "node_modules",
  "public",
  "target",
  "tmp",
  "vendor",
  "venv",
]);

function toPosix(value) {
  return value.split(path.sep).join("/");
}

function compact(values) {
  return [...new Set(values.filter(Boolean).map((value) => String(value)))];
}

function listValues(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") return [value];
  if (value && typeof value === "object") return Object.keys(value);
  return [];
}

function normalizeDirectory(relPath) {
  const directory = path.posix.dirname(relPath);
  return directory === "." ? "." : directory;
}

function workspaceArea(relPath) {
  return relPath.split("/")[0] || "workspace";
}

function fileText(filePath) {
  return readFileSync(filePath, "utf8");
}

function stripJsonComments(input) {
  let output = "";
  let inString = false;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    const next = input[i + 1];

    if (lineComment) {
      if (char === "\n") {
        lineComment = false;
        output += char;
      }
      continue;
    }

    if (blockComment) {
      if (char === "*" && next === "/") {
        blockComment = false;
        i += 1;
      }
      continue;
    }

    if (!inString && char === "/" && next === "/") {
      lineComment = true;
      i += 1;
      continue;
    }

    if (!inString && char === "/" && next === "*") {
      blockComment = true;
      i += 1;
      continue;
    }

    output += char;
    if (escaped) {
      escaped = false;
    } else if (char === "\\") {
      escaped = true;
    } else if (char === "\"") {
      inString = !inString;
    }
  }

  return output;
}

function parseJsonc(text) {
  return JSON.parse(stripJsonComments(text).replace(/,\s*([}\]])/g, "$1"));
}

function parseHtmlMeta(text, name) {
  const pattern = new RegExp(
    `<meta\\s+name=["']${name}["']\\s+content=["']([^"']*)["'][^>]*>`,
    "i",
  );
  return text.match(pattern)?.[1] || null;
}

function pagePathFromHtml(relPath) {
  if (relPath === "index.html") return "/";
  if (relPath.endsWith("/index.html")) return `/${relPath.slice(0, -"/index.html".length)}`;
  return `/${relPath.slice(0, -".html".length)}`;
}

function parseTitle(text) {
  return text.match(/<title>([^<]+)<\/title>/i)?.[1]?.trim() || null;
}

function statsReferenceFor(kind, manifest) {
  switch (kind) {
    case "component":
    case "npm":
    case "wrangler_jsonc":
      return (
        manifest?.ragbaz?.statsFile ||
        manifest?.ragbaz?.stats_file ||
        manifest?.statsFile ||
        manifest?.stats_file ||
        null
      );
    case "cargo":
      return (
        manifest?.package?.metadata?.ragbaz?.stats_file ||
        manifest?.workspace?.metadata?.ragbaz?.stats_file ||
        manifest?.package?.metadata?.ragbaz?.statsFile ||
        manifest?.workspace?.metadata?.ragbaz?.statsFile ||
        null
      );
    case "pyproject":
      return manifest?.tool?.ragbaz?.stats_file || manifest?.tool?.ragbaz?.statsFile || null;
    case "wrangler_toml":
      return manifest?.ragbaz?.stats_file || manifest?.ragbaz?.statsFile || null;
    default:
      return null;
  }
}

function parseMaybeNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function normalizeStatEntry(entry) {
  return {
    date: entry?.date ? String(entry.date) : null,
    dollars: parseMaybeNumber(entry?.dollars),
    completion: parseMaybeNumber(entry?.completion),
    note: entry?.note ? String(entry.note) : null,
  };
}

function normalizeManifestStats(statsFile, payload) {
  const rawEntries = Array.isArray(payload?.entries)
    ? payload.entries
    : Array.isArray(payload?.timeline)
      ? payload.timeline
      : [];
  const entries = rawEntries
    .map(normalizeStatEntry)
    .filter((entry) => entry.date && entry.dollars !== null && entry.completion !== null)
    .sort((left, right) => left.date.localeCompare(right.date));
  const latest = entries.length ? entries[entries.length - 1] : null;
  return {
    path: statsFile,
    currency: payload?.currency ? String(payload.currency) : "USD",
    updatedAt: payload?.updatedAt
      ? String(payload.updatedAt)
      : payload?.updated_at
        ? String(payload.updated_at)
        : latest?.date || null,
    latestDollars: latest?.dollars ?? null,
    latestCompletion: latest?.completion ?? null,
    latest,
    entries,
  };
}

function parseSameFamilyFile(kind, statsPath, text) {
  if (statsPath.endsWith(".jsonc")) return parseJsonc(text);
  if (statsPath.endsWith(".json")) return JSON.parse(text);
  if (statsPath.endsWith(".toml")) return parseToml(text);
  if (kind === "component" || kind === "npm") return JSON.parse(text);
  if (kind === "wrangler_jsonc") return parseJsonc(text);
  return parseToml(text);
}

function attachManifestStats(record, { kind, manifest, absolutePath, workspaceRoot }) {
  const statsRef = statsReferenceFor(kind, manifest);
  if (!statsRef) return record;

  const resolvedPath = path.resolve(path.dirname(absolutePath), String(statsRef));
  const relativePath = toPosix(path.relative(workspaceRoot, resolvedPath));
  if (relativePath.startsWith("../")) {
    return {
      ...record,
      statsFile: String(statsRef),
      statsParseError: "stats file resolves outside /data/src",
    };
  }

  try {
    const payload = parseSameFamilyFile(kind, resolvedPath, fileText(resolvedPath));
    return {
      ...record,
      statsFile: relativePath,
      stats: normalizeManifestStats(relativePath, payload),
      statsParseError: null,
    };
  } catch (error) {
    return {
      ...record,
      statsFile: relativePath,
      statsParseError: String(error?.message || error),
    };
  }
}

function manifestBase(relPath, kind) {
  return {
    key: `${kind}:${relPath}`,
    kind,
    path: relPath,
    localPath: relPath,
    directory: normalizeDirectory(relPath),
    repoPath: normalizeDirectory(relPath),
    workspaceArea: workspaceArea(relPath),
    packageManager: null,
    tags: [],
    personas: [],
    capabilities: [],
    scripts: [],
    dependencyNames: [],
    endpointNames: [],
    publicUrls: [],
    statsFile: null,
    stats: null,
    statsParseError: null,
    manifest: null,
    parseError: null,
  };
}

function manifestFromComponent(relPath, manifest) {
  const endpoints = manifest?.endpoints && typeof manifest.endpoints === "object"
    ? Object.keys(manifest.endpoints)
    : Array.isArray(manifest?.endpoints)
      ? manifest.endpoints
      : [];

  return {
    ...manifestBase(relPath, "component"),
    name: manifest?.name || manifest?.id || path.posix.basename(normalizeDirectory(relPath)),
    displayName: manifest?.name || manifest?.id || null,
    version: manifest?.version || null,
    description: manifest?.description || null,
    componentId: manifest?.id || null,
    owner: manifest?.owner || null,
    lifecycle: manifest?.lifecycle || null,
    packageManager: "ragbaz-component",
    tags: compact([...listValues(manifest?.tags), ...listValues(manifest?.keywords)]),
    personas: compact(listValues(manifest?.personas)),
    capabilities: compact([
      ...listValues(manifest?.capabilities),
      ...listValues(manifest?.provides),
      ...listValues(manifest?.requires),
    ]),
    endpointNames: compact(endpoints),
    publicUrls: compact([
      manifest?.docs,
      manifest?.demoUrl,
      ...listValues(manifest?.urls),
    ]),
    supportTier: manifest?.supportTier || null,
    salesStatus: manifest?.salesStatus || null,
    manifest,
  };
}

function manifestFromPackageJson(relPath, manifest) {
  return {
    ...manifestBase(relPath, "npm"),
    name: manifest?.name || path.posix.basename(normalizeDirectory(relPath)),
    displayName: manifest?.name || null,
    version: manifest?.version || null,
    description: manifest?.description || null,
    packageManager: manifest?.packageManager || "npm",
    tags: compact(manifest?.keywords || []),
    scripts: compact(Object.keys(manifest?.scripts || {})),
    dependencyNames: compact([
      ...Object.keys(manifest?.dependencies || {}),
      ...Object.keys(manifest?.devDependencies || {}),
      ...Object.keys(manifest?.peerDependencies || {}),
      ...Object.keys(manifest?.optionalDependencies || {}),
    ]),
    manifest,
  };
}

function manifestFromCargo(relPath, manifest) {
  const packageData = manifest?.package || manifest?.workspace?.package || {};
  const dependencyNames = compact([
    ...Object.keys(manifest?.dependencies || {}),
    ...Object.keys(manifest?.["dev-dependencies"] || {}),
    ...Object.keys(manifest?.workspace?.dependencies || {}),
  ]);

  return {
    ...manifestBase(relPath, "cargo"),
    name: packageData?.name || path.posix.basename(normalizeDirectory(relPath)),
    displayName: packageData?.name || null,
    version: packageData?.version || null,
    description: packageData?.description || null,
    packageManager: "cargo",
    dependencyNames,
    manifest,
  };
}

function manifestFromPyproject(relPath, manifest) {
  const project = manifest?.project || {};
  return {
    ...manifestBase(relPath, "pyproject"),
    name: project?.name || path.posix.basename(normalizeDirectory(relPath)),
    displayName: project?.name || null,
    version: project?.version || null,
    description: project?.description || null,
    packageManager: "python",
    dependencyNames: compact(project?.dependencies || []),
    manifest,
  };
}

function routeStrings(routes) {
  if (!Array.isArray(routes)) return [];
  return compact(
    routes.map((route) => {
      if (typeof route === "string") return route;
      if (route && typeof route === "object") {
        return route.pattern || route.route || route.custom_domain || route.zone_name || null;
      }
      return null;
    }),
  );
}

function manifestFromWrangler(relPath, manifest, kind) {
  return {
    ...manifestBase(relPath, kind),
    name: manifest?.name || path.posix.basename(normalizeDirectory(relPath)),
    displayName: manifest?.name || null,
    version: manifest?.compatibility_date || null,
    description: manifest?.main || manifest?.routes?.[0] || null,
    packageManager: "wrangler",
    publicUrls: routeStrings(manifest?.routes),
    manifest,
  };
}

function manifestFromWorkspaceMeta(relPath, manifest) {
  const products = Array.isArray(manifest?.products) ? manifest.products : [];
  return {
    ...manifestBase(relPath, "workspace_meta"),
    name: manifest?.workspace?.name || "RAGBAZ Product Catalog",
    displayName: manifest?.workspace?.name || "RAGBAZ Product Catalog",
    version: manifest?.schemaVersion || null,
    description: `${products.length} product catalog entr${products.length === 1 ? "y" : "ies"}`,
    packageManager: "json",
    tags: compact(manifest?.allowedFlags || []),
    dependencyNames: compact(products.map((product) => product?.path)),
    manifest,
  };
}

function parseManifestRecord(kind, relPath, absolutePath, workspaceRoot) {
  const text = fileText(absolutePath);
  try {
    const manifest = kind === "component" || kind === "npm" || kind === "workspace_meta"
      ? JSON.parse(text)
      : kind === "wrangler_jsonc"
        ? parseJsonc(text)
        : parseToml(text);

    let record;
    switch (kind) {
      case "component":
        record = manifestFromComponent(relPath, manifest);
        break;
      case "npm":
        record = manifestFromPackageJson(relPath, manifest);
        break;
      case "cargo":
        record = manifestFromCargo(relPath, manifest);
        break;
      case "workspace_meta":
        record = manifestFromWorkspaceMeta(relPath, manifest);
        break;
      case "pyproject":
        record = manifestFromPyproject(relPath, manifest);
        break;
      case "wrangler_jsonc":
      case "wrangler_toml":
        record = manifestFromWrangler(relPath, manifest, kind);
        break;
      default:
        record = { ...manifestBase(relPath, kind), manifest };
    }

    return attachManifestStats(record, { kind, manifest, absolutePath, workspaceRoot });
  } catch (error) {
    return {
      ...manifestBase(relPath, kind),
      name: path.posix.basename(normalizeDirectory(relPath)),
      packageManager: kind,
      parseError: String(error?.message || error),
    };
  }
}

function collectSitePages(siteRoot) {
  const pages = [];

  function walk(relDir) {
    const directory = relDir ? path.join(siteRoot, relDir) : siteRoot;
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const relPath = relDir ? path.join(relDir, entry.name) : entry.name;
      if (entry.isDirectory()) {
        walk(relPath);
        continue;
      }
      if (!entry.name.endsWith(".html")) continue;
      const posixRelPath = toPosix(relPath);
      const html = fileText(path.join(siteRoot, relPath));
      const pagePath = pagePathFromHtml(posixRelPath);
      pages.push({
        path: pagePath,
        localPath: `site/${posixRelPath}`,
        section: pagePath === "/" ? "root" : pagePath.split("/").filter(Boolean)[0] || "root",
        title: parseTitle(html),
        description: parseHtmlMeta(html, "description"),
        url: pagePath,
      });
    }
  }

  walk("");
  return pages.sort((left, right) => left.path.localeCompare(right.path));
}

function shouldIgnore(entryName) {
  return IGNORED_DIRS.has(entryName);
}

function collectManifestRecords(workspaceRoot) {
  const manifests = [];

  function walk(relDir) {
    const directory = relDir ? path.join(workspaceRoot, relDir) : workspaceRoot;
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (shouldIgnore(entry.name)) continue;
        const relPath = relDir ? path.join(relDir, entry.name) : entry.name;
        walk(relPath);
        continue;
      }

      const relPath = toPosix(relDir ? path.join(relDir, entry.name) : entry.name);
      const kind = relPath === "meta.json" ? "workspace_meta" : MANIFEST_KINDS.get(entry.name);
      if (!kind) continue;
      manifests.push(parseManifestRecord(kind, relPath, path.join(directory, entry.name), workspaceRoot));
    }
  }

  walk("");
  return manifests.sort((left, right) => left.path.localeCompare(right.path));
}

function buildStats(manifests, sitePages) {
  const counts = new Map();
  for (const manifest of manifests) {
    counts.set(manifest.kind, (counts.get(manifest.kind) || 0) + 1);
  }
  return {
    totalManifests: manifests.length,
    totalSitePages: sitePages.length,
    byKind: [...counts.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([kind, count]) => ({ kind, count })),
  };
}

export function repoRootFromImportMeta(importMetaUrl) {
  return path.resolve(path.dirname(fileURLToPath(importMetaUrl)), "..", "..");
}

export function defaultWorkspaceRoot(importMetaUrl = import.meta.url) {
  return path.resolve(repoRootFromImportMeta(importMetaUrl), "..", "..");
}

export function defaultSiteRoot(importMetaUrl = import.meta.url) {
  return path.join(repoRootFromImportMeta(importMetaUrl), "site");
}

export function snapshotDigest(snapshot) {
  return createHash("sha256")
    .update(
      JSON.stringify({
        version: snapshot.version,
        manifests: snapshot.manifests,
        sitePages: snapshot.sitePages,
      }),
    )
    .digest("hex");
}

export function buildWorkspaceSnapshot({
  workspaceRoot = defaultWorkspaceRoot(),
  siteRoot = defaultSiteRoot(),
  sourceRevision = null,
} = {}) {
  const manifests = collectManifestRecords(workspaceRoot);
  const sitePages = collectSitePages(siteRoot);
  const snapshot = {
    version: 1,
    generatedAt: new Date().toISOString(),
    sourceRevision,
    storedAt: null,
    manifests,
    sitePages,
  };
  snapshot.stats = buildStats(manifests, sitePages);
  snapshot.digest = snapshotDigest(snapshot);
  return snapshot;
}

export function writeGeneratedWorkspaceIndex(snapshot, outputPath) {
  writeFileSync(
    outputPath,
    `// AUTO-GENERATED by scripts/generate-workspace-index.mjs. Do not edit.\n` +
      `export const WORKSPACE_SNAPSHOT = ${JSON.stringify(snapshot, null, 2)};\n`,
  );
}
