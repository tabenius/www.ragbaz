import { json, clientIp } from "../../../lib/accounts/http.mjs";
import {
  normalizeEmail,
  isValidEmail,
  getAccountByEmail,
  rateLimit,
} from "../../../lib/accounts/store.mjs";
import { verifyPassword } from "../../../lib/accounts/crypto.mjs";
import { startSession } from "../../../lib/accounts/session.mjs";

export const dynamic = "force-dynamic";

const INVALID = () =>
  json({ ok: false, error: "invalid email or password" }, { status: 401 });

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "invalid body" }, { status: 400 });
  }
  const email = normalizeEmail(body?.email);
  const password = String(body?.password || "");
  if (!isValidEmail(email) || !password) return INVALID();

  if (!(await rateLimit(`login:${clientIp(request)}`, 10))) {
    return json({ ok: false, error: "too many attempts, try again soon" }, { status: 429 });
  }

  const account = await getAccountByEmail(email);
  // Verify even when the account is missing to keep timing ~uniform.
  const ok = await verifyPassword(
    password,
    account?.password_hash || "pbkdf2$210000$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
  );
  if (!account || !account.password_hash || !ok) return INVALID();

  await startSession({ id: account.id, email: account.email });
  return json({ ok: true, email: account.email });
}
