import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  configuredSecuritySchoolIps,
  isSecuritySchoolPath,
  securitySchoolAccessDecision,
} from "../lib/security-school-access.mjs";

const root = path.dirname(fileURLToPath(import.meta.url));
const manifestPath = path.join(root, "..", "site", "school", "security", "manifest.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
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

assert(isSecuritySchoolPath("/school/security"), "root Security School path must be protected");
assert(isSecuritySchoolPath("/school/security/manifest.json"), "Security School assets must be protected");
assert(!isSecuritySchoolPath("/school/cellular/"), "the existing cellular route must not be accidentally gated by this prefix rule");

const emptyDecision = securitySchoolAccessDecision(
  new Request("https://ragbaz.cc/school/security/", { headers: { "cf-connecting-ip": "100.100.10.10" } }),
  {},
);
assert(emptyDecision.protected && !emptyDecision.allowed, "missing IP configuration must fail closed");

const allowedDecision = securitySchoolAccessDecision(
  new Request("https://ragbaz.cc/school/security/", { headers: { "cf-connecting-ip": "100.100.10.10" } }),
  { TAILSCALE_ALLOWED_IPS: "100.100.10.10" },
);
assert(allowedDecision.allowed, "an exact configured Tailscale IP must be allowed");

const netbirdDecision = securitySchoolAccessDecision(
  new Request("https://ragbaz.cc/school/security/manifest.json", { headers: { "cf-connecting-ip": "100.88.4.9" } }),
  { NETBIRD_ALLOWED_IPS: "100.88.4.9" },
);
assert(netbirdDecision.allowed, "an exact configured NetBird IP must be allowed");

const spoofedDecision = securitySchoolAccessDecision(
  new Request("https://ragbaz.cc/school/security/", { headers: { "x-forwarded-for": "100.100.10.10" } }),
  { TAILSCALE_ALLOWED_IPS: "100.100.10.10" },
);
assert(!spoofedDecision.allowed, "browser-supplied forwarding headers must not grant access");

const wildcardIps = configuredSecuritySchoolIps({ SECURITY_SCHOOL_ALLOWED_IPS: "100.64.0.0/10,*" });
assert(wildcardIps.size === 0, "CIDRs and wildcards must be rejected; configure exact peer or gateway IPs");

if (errors.length) {
  console.error("security-library: policy validation failed");
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

console.log(`security-library: validated ${collectionIds.size} private-network defensive collection(s), ${objectUris.size} unique URI(s), and fail-closed VPN IP access`);
