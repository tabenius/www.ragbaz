import { WORKSPACE_SNAPSHOT } from "./workspace-index.generated.mjs";

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 500;

function clampLimit(limit) {
  const numeric = Number(limit || DEFAULT_LIMIT);
  if (!Number.isFinite(numeric) || numeric < 1) return DEFAULT_LIMIT;
  return Math.min(Math.floor(numeric), MAX_LIMIT);
}

function lower(value) {
  return String(value || "").toLowerCase();
}

function arrayOfStrings(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item)).filter(Boolean);
}

function sortByPath(a, b) {
  return String(a.path || "").localeCompare(String(b.path || ""));
}

function numberOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function normalizeStatEntry(entry) {
  return {
    date: entry?.date ? String(entry.date) : null,
    dollars: numberOrNull(entry?.dollars),
    completion: numberOrNull(entry?.completion),
    note: entry?.note ? String(entry.note) : null,
  };
}

function normalizeManifestStats(stats) {
  if (!stats || typeof stats !== "object") return null;
  const entries = Array.isArray(stats.entries)
    ? stats.entries
      .map(normalizeStatEntry)
      .filter((entry) => entry.date)
      .sort((left, right) => left.date.localeCompare(right.date))
    : [];
  const latest = stats.latest ? normalizeStatEntry(stats.latest) : entries[entries.length - 1] || null;
  return {
    path: stats.path ? String(stats.path) : null,
    currency: stats.currency ? String(stats.currency) : "USD",
    updatedAt: stats.updatedAt ? String(stats.updatedAt) : null,
    latestDollars: numberOrNull(stats.latestDollars ?? latest?.dollars),
    latestCompletion: numberOrNull(stats.latestCompletion ?? latest?.completion),
    latest,
    entries,
  };
}

function normalizeManifest(manifest) {
  return {
    key: String(manifest?.key || `${manifest?.kind || "unknown"}:${manifest?.path || ""}`),
    kind: String(manifest?.kind || "unknown"),
    path: String(manifest?.path || ""),
    localPath: String(manifest?.localPath || manifest?.path || ""),
    directory: String(manifest?.directory || "."),
    repoPath: String(manifest?.repoPath || manifest?.directory || "."),
    workspaceArea: String(manifest?.workspaceArea || "workspace"),
    name: manifest?.name ? String(manifest.name) : null,
    displayName: manifest?.displayName ? String(manifest.displayName) : null,
    version: manifest?.version ? String(manifest.version) : null,
    description: manifest?.description ? String(manifest.description) : null,
    componentId: manifest?.componentId ? String(manifest.componentId) : null,
    owner: manifest?.owner ? String(manifest.owner) : null,
    lifecycle: manifest?.lifecycle ? String(manifest.lifecycle) : null,
    packageManager: manifest?.packageManager ? String(manifest.packageManager) : null,
    tags: arrayOfStrings(manifest?.tags),
    personas: arrayOfStrings(manifest?.personas),
    capabilities: arrayOfStrings(manifest?.capabilities),
    scripts: arrayOfStrings(manifest?.scripts),
    dependencyNames: arrayOfStrings(manifest?.dependencyNames),
    endpointNames: arrayOfStrings(manifest?.endpointNames),
    publicUrls: arrayOfStrings(manifest?.publicUrls),
    supportTier: manifest?.supportTier ? String(manifest.supportTier) : null,
    salesStatus: manifest?.salesStatus ? String(manifest.salesStatus) : null,
    statsFile: manifest?.statsFile ? String(manifest.statsFile) : null,
    statsParseError: manifest?.statsParseError ? String(manifest.statsParseError) : null,
    stats: normalizeManifestStats(manifest?.stats),
    parseError: manifest?.parseError ? String(manifest.parseError) : null,
    manifest: manifest?.manifest && typeof manifest.manifest === "object" ? manifest.manifest : null,
  };
}

function normalizeSitePage(page) {
  return {
    path: String(page?.path || "/"),
    localPath: String(page?.localPath || ""),
    section: page?.section ? String(page.section) : null,
    title: page?.title ? String(page.title) : null,
    description: page?.description ? String(page.description) : null,
    url: String(page?.url || page?.path || "/"),
  };
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

export function normalizeWorkspaceSnapshot(snapshot) {
  const manifests = [];
  const manifestList = Array.isArray(snapshot?.manifests)
    ? snapshot.manifests.map(normalizeManifest).sort(sortByPath)
    : manifests;
  const sitePages = Array.isArray(snapshot?.sitePages)
    ? snapshot.sitePages.map(normalizeSitePage).sort(sortByPath)
    : [];

  return {
    version: Number.isInteger(snapshot?.version) ? snapshot.version : 1,
    generatedAt: snapshot?.generatedAt ? String(snapshot.generatedAt) : null,
    digest: snapshot?.digest ? String(snapshot.digest) : null,
    sourceRevision: snapshot?.sourceRevision ? String(snapshot.sourceRevision) : null,
    storedAt: snapshot?.storedAt ? String(snapshot.storedAt) : null,
    manifests: manifestList,
    sitePages,
    stats: buildStats(manifestList, sitePages),
  };
}

function textMatches(value, needle) {
  return lower(value).includes(lower(needle));
}

function manifestMatchesQuery(manifest, query) {
  if (!query) return true;
  const haystack = [
    manifest.path,
    manifest.name,
    manifest.displayName,
    manifest.description,
    manifest.componentId,
    manifest.owner,
    manifest.lifecycle,
    manifest.packageManager,
    manifest.tags.join(" "),
    manifest.personas.join(" "),
    manifest.capabilities.join(" "),
    manifest.dependencyNames.join(" "),
    manifest.endpointNames.join(" "),
    manifest.publicUrls.join(" "),
    manifest.statsFile,
  ].join("\n");
  return textMatches(haystack, query);
}

function sitePageMatchesQuery(page, query) {
  if (!query) return true;
  return textMatches([page.path, page.title, page.description, page.section].join("\n"), query);
}

export function bundledWorkspaceSnapshot() {
  return normalizeWorkspaceSnapshot(WORKSPACE_SNAPSHOT);
}

export function filterWorkspaceManifests(snapshot, { kind, pathPrefix, query, tag, limit } = {}) {
  return normalizeWorkspaceSnapshot(snapshot).manifests
    .filter((manifest) => !kind || manifest.kind === kind)
    .filter((manifest) => !pathPrefix || manifest.path.startsWith(pathPrefix))
    .filter((manifest) => !tag || manifest.tags.includes(tag))
    .filter((manifest) => manifestMatchesQuery(manifest, query))
    .slice(0, clampLimit(limit));
}

export function findWorkspaceManifest(snapshot, { path, componentId, name } = {}) {
  return normalizeWorkspaceSnapshot(snapshot).manifests.find((manifest) => {
    if (path && manifest.path !== path) return false;
    if (componentId && manifest.componentId !== componentId) return false;
    if (name && manifest.name !== name) return false;
    return Boolean(path || componentId || name);
  }) || null;
}

export function filterWorkspaceSitePages(snapshot, { section, query, limit } = {}) {
  return normalizeWorkspaceSnapshot(snapshot).sitePages
    .filter((page) => !section || page.section === section)
    .filter((page) => sitePageMatchesQuery(page, query))
    .slice(0, clampLimit(limit));
}

export function getWorkspaceSitePage(snapshot, pagePath) {
  return normalizeWorkspaceSnapshot(snapshot).sitePages.find((page) => page.path === pagePath) || null;
}
