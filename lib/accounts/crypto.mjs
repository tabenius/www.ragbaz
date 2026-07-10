// WebCrypto helpers — run on the Cloudflare Worker (and Node build) runtime.

// Cloudflare Workers caps WebCrypto PBKDF2 at 100k iterations; deriveBits
// throws above that, so this is the strongest setting that runs on the edge.
const PBKDF2_ITERATIONS = 100_000;
const enc = new TextEncoder();

export function b64urlFromBytes(bytes) {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function bytesFromB64url(str) {
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}

function randomBytes(n) {
  const a = new Uint8Array(n);
  crypto.getRandomValues(a);
  return a;
}

/** Opaque URL-safe token (default 32 bytes). */
export function randomToken(bytes = 32) {
  return b64urlFromBytes(randomBytes(bytes));
}

export async function sha256Hex(input) {
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(input));
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** PBKDF2-HMAC-SHA256 → "pbkdf2$<iters>$<salt_b64url>$<hash_b64url>". */
export async function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = await pbkdf2(password, salt, PBKDF2_ITERATIONS);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${b64urlFromBytes(salt)}$${b64urlFromBytes(hash)}`;
}

export async function verifyPassword(password, stored) {
  if (!stored || typeof stored !== "string") return false;
  const parts = stored.split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2") return false;
  const iters = Number(parts[1]);
  if (!Number.isInteger(iters) || iters < 1) return false;
  try {
    const salt = bytesFromB64url(parts[2]);
    const expected = bytesFromB64url(parts[3]);
    const actual = await pbkdf2(password, salt, iters, expected.length);
    return timingSafeEqual(actual, expected);
  } catch {
    // e.g. stored iteration count exceeds the runtime's PBKDF2 limit —
    // treat as unverifiable rather than throwing a 500 into the login path.
    return false;
  }
}

async function pbkdf2(password, salt, iterations, length = 32) {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    key,
    length * 8,
  );
  return new Uint8Array(bits);
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

// ── HMAC session signing ───────────────────────────────────────────────
async function hmacKey(secret) {
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function hmacSign(value, secret) {
  const sig = await crypto.subtle.sign("HMAC", await hmacKey(secret), enc.encode(value));
  return b64urlFromBytes(new Uint8Array(sig));
}

export async function hmacVerify(value, signature, secret) {
  try {
    return await crypto.subtle.verify(
      "HMAC",
      await hmacKey(secret),
      bytesFromB64url(signature),
      enc.encode(value),
    );
  } catch {
    return false;
  }
}

export function timingSafeEqualText(a, b) {
  return timingSafeEqual(enc.encode(String(a ?? "")), enc.encode(String(b ?? "")));
}
