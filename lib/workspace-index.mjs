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

function sortBySlug(a, b) {
  return String(a.slug || "").localeCompare(String(b.slug || ""));
}

function normalizePagePath(value) {
  const path = String(value || "/") || "/";
  if (path === "/") return "/";
  return path.endsWith("/") ? path.slice(0, -1) || "/" : path;
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
  const pagePath = normalizePagePath(page?.path || "/");
  const pageUrl = normalizePagePath(page?.url || page?.path || "/");
  return {
    path: pagePath,
    localPath: String(page?.localPath || ""),
    section: page?.section ? String(page.section) : null,
    title: page?.title ? String(page.title) : null,
    description: page?.description ? String(page.description) : null,
    url: pageUrl,
  };
}

function normalizeCatalogCard(card) {
  return {
    title: card?.title ? String(card.title) : "",
    intro: card?.intro ? String(card.intro) : "",
    items: arrayOfStrings(card?.items),
  };
}

function normalizeCatalogCta(cta) {
  return {
    label: cta?.label ? String(cta.label) : "",
    href: cta?.href ? String(cta.href) : "/",
    primary: Boolean(cta?.primary),
  };
}

function normalizeCatalogProspect(prospect) {
  if (!prospect || typeof prospect !== "object") return null;
  return {
    slug: prospect?.slug ? String(prospect.slug) : null,
    order: prospect?.order ? String(prospect.order) : null,
    heroCopy: prospect?.heroCopy ? String(prospect.heroCopy) : "",
    chips: arrayOfStrings(prospect?.chips),
    cards: Array.isArray(prospect?.cards) ? prospect.cards.map(normalizeCatalogCard) : [],
    note: prospect?.note ? String(prospect.note) : "",
    ctas: Array.isArray(prospect?.ctas) ? prospect.ctas.map(normalizeCatalogCta) : [],
  };
}

function normalizeCatalogLinks(links) {
  if (!links || typeof links !== "object") return {};
  return Object.fromEntries(
    Object.entries(links)
      .map(([key, value]) => [String(key), value === null || value === undefined ? "" : String(value)])
      .filter(([, value]) => value),
  );
}

function normalizeCatalogEntry(entry, fallbackKind, catalogEvaluatedAt = null) {
  return {
    kind: entry?.kind ? String(entry.kind) : fallbackKind,
    slug: entry?.slug ? String(entry.slug) : "",
    name: entry?.name ? String(entry.name) : "",
    tag: entry?.tag ? String(entry.tag) : "building",
    tagLabel: entry?.tagLabel ? String(entry.tagLabel) : entry?.tag ? String(entry.tag) : "building",
    short: entry?.short ? String(entry.short) : "",
    value: entry?.value ? String(entry.value) : "",
    pricing: entry?.pricing ? String(entry.pricing) : "—",
    revenue: entry?.revenue ? String(entry.revenue) : "internal",
    repo: entry?.repo ? String(entry.repo) : null,
    links: normalizeCatalogLinks(entry?.links),
    components: arrayOfStrings(entry?.components),
    completion: numberOrNull(entry?.completion),
    completionEvaluatedAt: entry?.completionEvaluatedAt
      ? String(entry.completionEvaluatedAt)
      : numberOrNull(entry?.completion) !== null
        ? catalogEvaluatedAt
        : null,
    finishedValueUsd: numberOrNull(entry?.finishedValueUsd),
    currentValueUsd: numberOrNull(entry?.currentValueUsd),
    prospect: normalizeCatalogProspect(entry?.prospect),
  };
}

function normalizePublicCatalogStats(stats, products, tracks) {
  return {
    publishedProducts: Number.isFinite(Number(stats?.publishedProducts))
      ? Math.max(0, Math.floor(Number(stats.publishedProducts)))
      : products.length,
    tracks: Number.isFinite(Number(stats?.tracks))
      ? Math.max(0, Math.floor(Number(stats.tracks)))
      : tracks.length,
    prospectEntries: Number.isFinite(Number(stats?.prospectEntries))
      ? Math.max(0, Math.floor(Number(stats.prospectEntries)))
      : [...products, ...tracks].filter((entry) => entry.prospect?.slug).length,
  };
}

function normalizePublicCatalog(catalog) {
  const evaluatedAt = catalog?.evaluatedAt ? String(catalog.evaluatedAt) : null;
  const products = Array.isArray(catalog?.products)
    ? catalog.products.map((entry) => normalizeCatalogEntry(entry, "product", evaluatedAt)).sort(sortBySlug)
    : [];
  const tracks = Array.isArray(catalog?.tracks)
    ? catalog.tracks.map((entry) => normalizeCatalogEntry(entry, "track", evaluatedAt)).sort(sortBySlug)
    : [];
  return {
    version: catalog?.version ? String(catalog.version) : null,
    evaluatedAt,
    description: catalog?.description ? String(catalog.description) : "",
    products,
    tracks,
    stats: normalizePublicCatalogStats(catalog?.stats, products, tracks),
  };
}

function buildStats(manifests, sitePages, publicCatalog) {
  const counts = new Map();
  for (const manifest of manifests) {
    counts.set(manifest.kind, (counts.get(manifest.kind) || 0) + 1);
  }
  return {
    totalManifests: manifests.length,
    totalSitePages: sitePages.length,
    publishedProducts: publicCatalog.stats.publishedProducts,
    catalogTracks: publicCatalog.stats.tracks,
    prospectEntries: publicCatalog.stats.prospectEntries,
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
  const publicCatalog = normalizePublicCatalog(snapshot?.publicCatalog);

  return {
    version: Number.isInteger(snapshot?.version) ? snapshot.version : 1,
    generatedAt: snapshot?.generatedAt ? String(snapshot.generatedAt) : null,
    digest: snapshot?.digest ? String(snapshot.digest) : null,
    sourceRevision: snapshot?.sourceRevision ? String(snapshot.sourceRevision) : null,
    storedAt: snapshot?.storedAt ? String(snapshot.storedAt) : null,
    manifests: manifestList,
    sitePages,
    publicCatalog,
    stats: buildStats(manifestList, sitePages, publicCatalog),
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

function catalogEntryMatchesQuery(entry, query) {
  if (!query) return true;
  return textMatches([
    entry.slug,
    entry.name,
    entry.tag,
    entry.tagLabel,
    entry.short,
    entry.value,
    entry.pricing,
    entry.revenue,
    entry.repo,
    entry.components.join(" "),
    Object.values(entry.links || {}).join(" "),
    entry.prospect?.heroCopy,
    entry.prospect?.note,
  ].join("\n"), query);
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
  const needle = normalizePagePath(pagePath);
  return normalizeWorkspaceSnapshot(snapshot).sitePages.find((page) => page.path === needle) || null;
}

export function publicWorkspaceCatalog(snapshot) {
  return normalizeWorkspaceSnapshot(snapshot).publicCatalog;
}

export function filterPublicProducts(snapshot, { query, tag, limit } = {}) {
  return normalizeWorkspaceSnapshot(snapshot).publicCatalog.products
    .filter((entry) => !tag || entry.tag === tag)
    .filter((entry) => catalogEntryMatchesQuery(entry, query))
    .slice(0, clampLimit(limit));
}

export function findPublicProduct(snapshot, { slug } = {}) {
  if (!slug) return null;
  return normalizeWorkspaceSnapshot(snapshot).publicCatalog.products.find((entry) => entry.slug === slug) || null;
}

export function filterPublicTracks(snapshot, { query, limit } = {}) {
  return normalizeWorkspaceSnapshot(snapshot).publicCatalog.tracks
    .filter((entry) => catalogEntryMatchesQuery(entry, query))
    .slice(0, clampLimit(limit));
}
