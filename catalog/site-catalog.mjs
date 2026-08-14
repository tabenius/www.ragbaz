import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const catalogRoot = path.dirname(fileURLToPath(import.meta.url));
const CANONICAL_PATH = path.join(catalogRoot, "products.json");

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function asString(value) {
  return value === null || value === undefined ? null : String(value);
}

function asNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeCard(card) {
  return {
    title: asString(card?.title) || "",
    intro: asString(card?.intro) || "",
    items: asArray(card?.items).map((item) => String(item)),
  };
}

function normalizeCta(cta) {
  return {
    label: asString(cta?.label) || "",
    href: asString(cta?.href) || "/",
    primary: Boolean(cta?.primary),
  };
}

function normalizeProspect(prospect) {
  if (!prospect || typeof prospect !== "object") return null;
  return {
    slug: asString(prospect.slug) || null,
    order: asString(prospect.order) || null,
    heroCopy: asString(prospect.heroCopy) || "",
    chips: asArray(prospect.chips).map((chip) => String(chip)),
    cards: asArray(prospect.cards).map(normalizeCard),
    note: asString(prospect.note) || "",
    ctas: asArray(prospect.ctas).map(normalizeCta),
  };
}

function roundValue(value) {
  return Math.round(value / 1000) * 1000;
}

function normalizeEntry(entry, kind) {
  const completion = asNumber(entry?.completion);
  const finishedValueUsd = asNumber(entry?.finishedValueUsd);
  const currentValueUsd = completion !== null && finishedValueUsd !== null
    ? roundValue((finishedValueUsd * completion) / 100)
    : null;

  return {
    kind,
    slug: asString(entry?.slug) || "",
    name: asString(entry?.name) || "",
    tag: asString(entry?.tag) || "building",
    tagLabel: asString(entry?.tagLabel) || asString(entry?.tag) || "building",
    short: asString(entry?.short) || "",
    value: asString(entry?.value) || "",
    pricing: asString(entry?.pricing) || "—",
    revenue: asString(entry?.revenue) || "internal",
    repo: asString(entry?.repo) || null,
    links: entry?.links && typeof entry.links === "object" ? entry.links : {},
    components: asArray(entry?.components).map((component) => String(component)),
    published: entry?.published !== false,
    completion,
    completionEvaluatedAt: asString(entry?.completionEvaluatedAt) || null,
    finishedValueUsd,
    currentValueUsd,
    prospect: normalizeProspect(entry?.prospect),
  };
}

export function readSiteCatalog() {
  const raw = readJson(CANONICAL_PATH);
  return {
    version: asString(raw?.version) || null,
    evaluatedAt: asString(raw?.evaluatedAt) || null,
    description: asString(raw?.description) || "",
    products: asArray(raw?.products).map((entry) => normalizeEntry(entry, "product")),
    tracks: asArray(raw?.tracks).map((entry) => normalizeEntry(entry, "track")),
  };
}

export function publicProducts(catalog) {
  return asArray(catalog?.products).filter((product) => product.published);
}

export function unpublishedProducts(catalog) {
  return asArray(catalog?.products).filter((product) => !product.published);
}

export function prospectEntries(catalog) {
  return [
    ...publicProducts(catalog),
    ...asArray(catalog?.tracks),
  ].filter((entry) => entry.prospect?.slug);
}

export function publicCatalogStats(catalog) {
  const tracks = asArray(catalog?.tracks);
  const published = publicProducts(catalog);
  const withProspects = [...published, ...tracks].filter((entry) => entry.prospect?.slug);

  return {
    publishedProducts: published.length,
    tracks: tracks.length,
    prospectEntries: withProspects.length,
  };
}

export function publicSiteCatalog(catalog) {
  return {
    version: asString(catalog?.version) || null,
    evaluatedAt: asString(catalog?.evaluatedAt) || null,
    description: asString(catalog?.description) || "",
    products: publicProducts(catalog),
    tracks: asArray(catalog?.tracks),
    stats: publicCatalogStats(catalog),
  };
}

export function siteCatalogStats(catalog) {
  const products = asArray(catalog?.products);
  const tracks = asArray(catalog?.tracks);
  const published = products.filter((product) => product.published);
  const withProspects = [...published, ...tracks].filter((entry) => entry.prospect?.slug);

  return {
    totalProducts: products.length,
    publishedProducts: published.length,
    unpublishedProducts: products.length - published.length,
    tracks: tracks.length,
    prospectEntries: withProspects.length,
  };
}
