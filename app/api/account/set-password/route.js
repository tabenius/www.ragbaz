import { json, clientIp } from "../../../../lib/accounts/http.mjs";
import {
  consumeToken,
  upsertVerifiedAccountWithPassword,
  confirmSubscriber,
  rateLimit,
} from "../../../../lib/accounts/store.mjs";
import { hashPassword } from "../../../../lib/accounts/crypto.mjs";
import { startSession } from "../../../../lib/accounts/session.mjs";

export const dynamic = "force-dynamic";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "invalid body" }, { status: 400 });
  }
  const token = String(body?.token || "");
  const password = String(body?.password || "");

  if (password.length < 8) {
    return json({ ok: false, error: "password must be at least 8 characters" }, { status: 400 });
  }
  if (!(await rateLimit(`setpw:${clientIp(request)}`, 10))) {
    return json({ ok: false, error: "too many requests" }, { status: 429 });
  }

  // Accept a confirm token from either the subscribe or account flow.
  const consumed =
    (await consumeToken(token, "confirm_account")) ||
    (await consumeToken(token, "confirm_subscribe"));
  if (!consumed) {
    return json({ ok: false, error: "link is invalid or expired" }, { status: 400 });
  }

  const hash = await hashPassword(password);
  const account = await upsertVerifiedAccountWithPassword(consumed.email, hash);
  // A confirmed email also confirms any pending newsletter subscription.
  await confirmSubscriber(consumed.email).catch(() => {});

  await startSession({ id: account.id, email: account.email });
  return json({ ok: true, email: account.email });
}
