import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  configuredSecuritySchoolIps,
  isSecuritySchoolPath,
  securitySchoolAccessDecision,
} from "../lib/security-school-access.mjs";

const root = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(root, "..");
const manifestPath = path.join(repoRoot, "site", "school", "security", "manifest.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const wrangler = readFileSync(path.join(repoRoot, "wrangler.jsonc"), "utf8");
const worker = readFileSync(path.join(repoRoot, "worker.mjs"), "utf8");
const packageJson = readFileSync(path.join(repoRoot, "package.json"), "utf8");
const syncPublic = readFileSync(path.join(repoRoot, "scripts", "sync-public.mjs"), "utf8");
const publicationAugmenter = readFileSync(path.join(repoRoot, "scripts", "augment-security-publications.mjs"), "utf8");
const securityIndex = readFileSync(path.join(repoRoot, "site", "school", "security", "index.html"), "utf8");
const interactiveCss = readFileSync(path.join(repoRoot, "site", "school", "security", "interactive.css"), "utf8");
const widgetEntry = readFileSync(path.join(repoRoot, "site", "school", "security", "react-widgets.entry.js"), "utf8");
const pilotProspect = readFileSync(path.join(repoRoot, "site", "school", "security", "detcordon", "self-hosted-pilot", "index.html"), "utf8");
const robberyArticle = readFileSync(path.join(repoRoot, "site", "school", "security", "on-digital-robbery", "index.html"), "utf8");
const robberyOverrides = readFileSync(path.join(repoRoot, "site", "school", "security", "on-digital-robbery", "interactive-overrides.css"), "utf8");
const detcordonProspect = readFileSync(path.join(repoRoot, "site", "prospects", "detcordon.html"), "utf8");
const errors = [];

const fail = (message) => errors.push(message);
const assert = (condition, message) => { if (!condition) fail(message); };

assert(manifest.version === 1, "manifest version must be 1");
assert(manifest.library?.baseUri === "crypto://ragbaz-security", "library baseUri must be crypto://ragbaz-security");
assert(manifest.library?.publicationMode === "private-network-only", "Security School must remain private-network-only");
assert(manifest.library?.securityPolicy?.networkAccess === "netbird-or-tailscale-ip-allowlist", "network access must use the NetBird/Tailscale IP allowlist");
assert(manifest.library?.securityPolicy?.denyByDefault === true, "network access must deny by default");
assert(manifest.library?.securityPolicy?.encryptedObjectsPublished === false, "encrypted objects must not be published in this release");
assert(manifest.library?.securityPolicy?.unlockInterfaceEnabled === false, "unlock UI must remain disabled");
assert(manifest.library?.securityPolicy?.clientKeyMaterialAccepted === false, "client key material must not be accepted");
assert(manifest.library?.securityPolicy?.persistentPlaintextStorage === false, "persistent plaintext storage must remain disabled");
assert(!Object.hasOwn(manifest, "reservedObjects"), "reserved PoC or implementation objects must not be present in this release");

const collectionIds = new Set();
const objectUris = new Set();
for (const collection of manifest.collections || []) {
  assert(!collectionIds.has(collection.id), `duplicate collection id: ${collection.id}`);
  collectionIds.add(collection.id);
  assert(collection.status === "published", `${collection.id}: status must be published`);
  assert(collection.classification === "network-restricted-defensive", `${collection.id}: classification must remain network-restricted-defensive`);
  assert(String(collection.href || "").startsWith("/"), `${collection.id}: href must be site-root-relative`);
  assert(String(collection.uri || "").startsWith("crypto://ragbaz-security/"), `invalid collection URI: ${collection.uri}`);
  assert(!objectUris.has(collection.uri), `duplicate object URI: ${collection.uri}`);
  objectUris.add(collection.uri);

  const childIds = new Set();
  for (const child of collection.children || []) {
    assert(!childIds.has(child.id), `duplicate child id in ${collection.id}: ${child.id}`);
    childIds.add(child.id);
    assert(child.classification === "defensive", `${collection.id}/${child.id}: child classification must remain defensive`);
  }
}

const serialized = JSON.stringify(manifest).toLowerCase();
for (const marker of [
  "controlled-poc",
  "restricted-implementation",
  "reserved-no-content",
  "recipientfingerprints",
  "ciphertext",
  "privatekeyprovisioned",
  "-----begin pgp private key block-----",
  "-----begin openssh private key-----",
  "secret-subkeys.asc",
  "private-key.asc",
  "private_key.asc",
  "xkcd-password-output",
]) {
  assert(!serialized.includes(marker), `manifest contains forbidden restricted-release marker: ${marker}`);
}

for (const protectedPath of [
  "/school/security",
  "/school/security/manifest.json",
  "/school/security/react-widgets.js",
  "/school/security/on-digital-robbery",
  "/school/security/on-digital-robbery/interactive-overrides.css",
  "/school/security/detcordon/self-hosted-pilot",
  "/school/security/detcordon/self-hosted-pilot/prospect.css",
  "/school/cellular",
  "/school/cellular/",
  "/prospects/detcordon",
  "/prospects/detcordon.html",
  "/prospects/detcordon/technical/asset.json",
  "/doc/products/detcordon",
  "/doc/products/detcordon/",
  "/doc/products/detcordon.html",
]) {
  assert(isSecuritySchoolPath(protectedPath), `${protectedPath} must be protected`);
}
assert(!isSecuritySchoolPath("/prospects/mailroute"), "unrelated prospect routes must remain outside this gate");

const emptyDecision = securitySchoolAccessDecision(
  new Request("https://ragbaz.cc/school/security/detcordon/self-hosted-pilot", { headers: { "cf-connecting-ip": "100.100.10.10" } }),
  {},
);
assert(emptyDecision.protected && !emptyDecision.allowed, "missing IP configuration must fail closed");

for (const protectedUrl of [
  "https://ragbaz.cc/school/security/",
  "https://ragbaz.cc/school/security/react-widgets.js",
  "https://ragbaz.cc/school/security/on-digital-robbery/",
  "https://ragbaz.cc/school/security/detcordon/self-hosted-pilot",
  "https://ragbaz.cc/school/cellular/",
  "https://ragbaz.cc/prospects/detcordon",
  "https://ragbaz.cc/prospects/detcordon.html",
  "https://ragbaz.cc/doc/products/detcordon",
]) {
  const allowedDecision = securitySchoolAccessDecision(
    new Request(protectedUrl, { headers: { "cf-connecting-ip": "100.100.10.10" } }),
    { TAILSCALE_ALLOWED_IPS: "100.100.10.10" },
  );
  assert(allowedDecision.allowed, `${protectedUrl} must allow an exact configured Tailscale IP`);
}

const netbirdDecision = securitySchoolAccessDecision(
  new Request("https://ragbaz.cc/school/security/manifest.json", { headers: { "cf-connecting-ip": "100.88.4.9" } }),
  { NETBIRD_ALLOWED_IPS: "100.88.4.9" },
);
assert(netbirdDecision.allowed, "an exact configured NetBird IP must be allowed");

const spoofedDecision = securitySchoolAccessDecision(
  new Request("https://ragbaz.cc/school/security/detcordon/self-hosted-pilot", { headers: { "x-forwarded-for": "100.100.10.10" } }),
  { TAILSCALE_ALLOWED_IPS: "100.100.10.10" },
);
assert(!spoofedDecision.allowed, "browser-supplied forwarding headers must not grant access");

const wildcardIps = configuredSecuritySchoolIps({ SECURITY_SCHOOL_ALLOWED_IPS: "100.64.0.0/10,*" });
assert(wildcardIps.size === 0, "CIDRs and wildcards must be rejected; configure exact peer or gateway IPs");

for (const requiredProspectText of [
  "DetectionOnly WAF tap",
  "Docker/Firecracker victim",
  "105 passing tests",
  "age-encrypted",
  "TLS for inter-service event/sample/heartbeat traffic",
  "Multi-sandbox managed-lab scaling",
]) {
  assert(detcordonProspect.includes(requiredProspectText), `full DetCordon prospect content is missing: ${requiredProspectText}`);
}
assert(!detcordonProspect.includes("public-safe overview"), "DetCordon prospect must not be a redacted public-safe edition");

for (const requiredIndexText of [
  'data-react-widget="top-navigation"',
  'data-react-widget="library-explorer"',
  'data-react-widget="publication-states"',
  "/school/security/detcordon/self-hosted-pilot",
  "./react-widgets.js",
]) {
  assert(securityIndex.includes(requiredIndexText), `Security School interactive shell is missing: ${requiredIndexText}`);
}

for (const requiredPilotText of [
  "$24,000",
  "$12,000",
  'data-react-widget="top-navigation"',
  'data-react-widget="use-case-explorer"',
  'data-react-widget="value-simulator"',
  'data-react-widget="progress-timeline"',
  'data-react-widget="git-log-tree"',
  "/school/security/react-widgets.js",
  "proposed terms are non-contractual",
]) {
  assert(pilotProspect.includes(requiredPilotText), `self-hosted pilot prospect is missing: ${requiredPilotText}`);
}

for (const requiredRobberyText of [
  'data-label="On Digital Robbery navigation"',
  'id="reading-settings"',
  'id="publication-state-explorer"',
  'data-react-widget="publication-states"',
  'id="document-tree"',
  '../react-widgets.js',
  'Self-hosted pilot prospect',
]) {
  assert(robberyArticle.includes(requiredRobberyText), `On Digital Robbery interactive reader is missing: ${requiredRobberyText}`);
}
assert(robberyOverrides.includes(".article-reading-settings"), "On Digital Robbery must style its responsive reading-settings panel");
assert(publicationAugmenter.includes("On Digital Robbery navigation"), "nested publication augmenter must install the shared React navigation shell");

const browserSurface = `${securityIndex}\n${pilotProspect}\n${robberyArticle}\n${widgetEntry}`.toLowerCase();
for (const remoteRuntime of ["unpkg.com", "cdn.jsdelivr.net", "esm.sh", "cdnjs.cloudflare.com", "react.development.js"]) {
  assert(!browserSurface.includes(remoteRuntime), `security publication must not load a remote JavaScript runtime: ${remoteRuntime}`);
}
assert(widgetEntry.includes('from "react"'), "React widget entry must use the locally installed React package");
assert(widgetEntry.includes('from "react-dom/client"'), "React widget entry must use the locally installed React DOM package");
assert(interactiveCss.includes("--rx-topbar-height: 70px"), "interactive top navigation must use a comfortable 70px desktop bar");
assert(interactiveCss.includes("@media (max-width: 760px)"), "interactive publication styles must include a mobile breakpoint");
assert(interactiveCss.includes("@media (min-width: 1600px)"), "interactive publication styles must include a large-screen breakpoint");
assert(packageJson.indexOf("augment-security-publications.mjs") < packageJson.indexOf("build-security-react-widgets.mjs"), "nested HTML augmentation must run before React widget bundling");
assert(packageJson.indexOf("build-security-react-widgets.mjs") < packageJson.indexOf("check-security-library.mjs"), "React widget bundle must be built before security publication validation");
assert(syncPublic.includes('entry.name.endsWith(".entry.js")'), "sync-public must withhold unbundled React entry source files");

assert(wrangler.includes('"run_worker_first"'), "wrangler assets must invoke the Worker before protected assets");
for (const routePattern of [
  '"/school/security"',
  '"/school/security/*"',
  '"/school/cellular"',
  '"/school/cellular/*"',
  '"/prospects/detcordon"',
  '"/prospects/detcordon.html"',
  '"/prospects/detcordon/*"',
  '"/doc/products/detcordon"',
  '"/doc/products/detcordon.html"',
  '"/doc/products/detcordon/*"',
]) {
  assert(wrangler.includes(routePattern), `wrangler must run the Worker first for ${routePattern}`);
}
assert(worker.includes("securitySchoolAccessDecision(request, env)"), "worker must evaluate protected publication access before routing");
assert(worker.indexOf("securitySchoolAccessDecision(request, env)") < worker.indexOf("handler.fetch(request, env, ctx)"), "worker access decision must run before the OpenNext handler");

if (errors.length) {
  console.error("security-library: policy validation failed");
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

console.log(`security-library: validated ${collectionIds.size} private-network collection(s), ${objectUris.size} unique URI(s), responsive React navigation across every /school/security HTML page, interactive publication widgets, self-hosted pilot economics, full DetCordon prospect retention, worker-first routing, and fail-closed VPN access`);
