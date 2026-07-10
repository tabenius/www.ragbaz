import { json, clientIp } from "../../../../lib/accounts/http.mjs";
import {
  peekToken,
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

  // Accept a confirm token from either the subscribe or account flow. Validate
  // without consuming, so a failure below leaves the link usable for a retry;
  // the token is only burned once the account actually exists.
  const purpose = (await peekToken(token, "confirm_account"))
    ? "confirm_account"
    : (await peekToken(token, "confirm_subscribe"))
      ? "confirm_subscribe"
      : null;
  if (!purpose) {
    return json({ ok: false, error: "link is invalid or expired" }, { status: 400 });
  }

  try {
    const hash = await hashPassword(password);
    const consumed = await consumeToken(token, purpose);
    if (!consumed) {
      return json({ ok: false, error: "link is invalid or expired" }, { status: 400 });
    }
    const account = await upsertVerifiedAccountWithPassword(consumed.email, hash);
    // A confirmed email also confirms any pending newsletter subscription.
    await confirmSubscriber(consumed.email).catch(() => {});

    await startSession({ id: account.id, email: account.email });
    return json({ ok: true, email: account.email });
  } catch (err) {
    console.error("set-password failed:", err?.message || err);
    return json({ ok: false, error: "account creation failed — please try again" }, { status: 500 });
  }
}
