import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const manifestPath = path.join(root, "..", "site", "school", "security", "manifest.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const OWNER = "ragbaz@proton.me";
const errors = [];

const fail = (message) => errors.push(message);
const assert = (condition, message) => { if (!condition) fail(message); };

assert(manifest.version === 1, "manifest version must be 1");
assert(manifest.library?.baseUri === "crypto://ragbaz-security", "library baseUri must be crypto://ragbaz-security");
assert(manifest.library?.ownerReader === OWNER, `ownerReader must be ${OWNER}`);
assert(manifest.library?.restrictedPolicy?.privateKeyProvisioned === false, "no restricted private key may be marked provisioned yet");
assert(manifest.library?.restrictedPolicy?.clientKeyPersistence === "forbidden", "client key persistence must remain forbidden");
assert(manifest.library?.restrictedPolicy?.plaintextCache === "forbidden", "plaintext caching must remain forbidden");

const collectionIds = new Set();
const objectUris = new Set();
for (const collection of manifest.collections || []) {
  assert(!collectionIds.has(collection.id), `duplicate collection id: ${collection.id}`);
  collectionIds.add(collection.id);

  assert(String(collection.uri || "").startsWith("crypto://ragbaz-security/"), `invalid collection URI: ${collection.uri}`);
  assert(!objectUris.has(collection.uri), `duplicate object URI: ${collection.uri}`);
  objectUris.add(collection.uri);

  const childIds = new Set();
  for (const child of collection.children || []) {
    assert(!childIds.has(child.id), `duplicate child id in ${collection.id}: ${child.id}`);
    childIds.add(child.id);
  }
}

const restrictedIds = new Set();
for (const object of manifest.reservedObjects || []) {
  assert(!restrictedIds.has(object.id), `duplicate reserved object id: ${object.id}`);
  restrictedIds.add(object.id);

  assert(object.state === "reserved-no-content", `${object.id}: state must remain reserved-no-content`);
  assert(object.exists === false, `${object.id}: exists must remain false until reviewed content is created`);
  assert(object.ciphertext === null, `${object.id}: ciphertext must remain null while no content exists`);
  assert(Array.isArray(object.recipientFingerprints) && object.recipientFingerprints.length === 0, `${object.id}: no recipient fingerprint should exist before key provisioning`);
  assert(Array.isArray(object.authorizedReaders) && object.authorizedReaders.length === 1 && object.authorizedReaders[0] === OWNER, `${object.id}: only ${OWNER} may be authorized`);
  assert(String(object.uri || "").startsWith("crypto://ragbaz-security/"), `${object.id}: invalid URI`);
  assert(!objectUris.has(object.uri), `duplicate object URI: ${object.uri}`);
  objectUris.add(object.uri);
}

const serialized = JSON.stringify(manifest).toLowerCase();
const forbiddenMarkers = [
  "-----begin pgp private key block-----",
  "-----begin openssh private key-----",
  "secret-subkeys.asc",
  "private-key.asc",
  "private_key.asc",
  "xkcd-password-output"
];
for (const marker of forbiddenMarkers) {
  assert(!serialized.includes(marker), `manifest contains forbidden secret marker: ${marker}`);
}

if (errors.length) {
  console.error("security-library: policy validation failed");
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

console.log(`security-library: validated ${collectionIds.size} collection(s), ${restrictedIds.size} owner-only reserved object(s), and ${objectUris.size} unique URI(s)`);
