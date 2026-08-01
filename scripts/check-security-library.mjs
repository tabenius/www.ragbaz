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
  new Request("https://ragbaz.cc/prospects/detcordon", { headers: { "cf-connecting-ip": "100.100.10.10" } }),
  {},
);
assert(emptyDecision.protected && !emptyDecision.allowed, "missing IP configuration must fail closed");

for (const protectedUrl of [
  "https://ragbaz.cc/school/security/",
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
  new Request("https://ragbaz.cc/prospects/detcordon", { headers: { "x-forwarded-for": "100.100.10.10" } }),
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

console.log(`security-library: validated ${collectionIds.size} private-network collection(s), ${objectUris.size} unique URI(s), full DetCordon prospect retention, worker-first routing, and fail-closed VPN access`);
