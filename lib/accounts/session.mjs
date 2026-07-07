// Stateless signed-cookie sessions. No DB table.
import { cookies } from "next/headers";
import { b64urlFromBytes, bytesFromB64url, hmacSign, hmacVerify } from "./crypto.mjs";
import { sessionSecret } from "./env.mjs";

const COOKIE = "rb_session";
const TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days
const enc = new TextEncoder();
const dec = new TextDecoder();

function encodePayload(obj) {
  return b64urlFromBytes(enc.encode(JSON.stringify(obj)));
}
function decodePayload(str) {
  return JSON.parse(dec.decode(bytesFromB64url(str)));
}

/** Set the session cookie for an account. */
export async function startSession({ id, email }) {
  const payload = { sub: id, email, exp: Math.floor(Date.now() / 1000) + TTL_SECONDS };
  const body = encodePayload(payload);
  const sig = await hmacSign(body, sessionSecret());
  const jar = await cookies();
  jar.set(COOKIE, `${body}.${sig}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: TTL_SECONDS,
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.set(COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

/** Return { sub, email } for a valid session, else null. */
export async function getSession() {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  return readSessionValue(raw);
}

/** Parse+verify a raw cookie value (usable outside the cookies() context). */
export async function readSessionValue(raw) {
  if (!raw || !raw.includes(".")) return null;
  const [body, sig] = raw.split(".");
  if (!(await hmacVerify(body, sig, sessionSecret()))) return null;
  let payload;
  try {
    payload = decodePayload(body);
  } catch {
    return null;
  }
  if (!payload?.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
  return { sub: payload.sub, email: payload.email };
}

export const SESSION_COOKIE = COOKIE;
