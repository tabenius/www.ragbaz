import { json, clientIp } from "../../../lib/accounts/http.mjs";
import {
  normalizeEmail,
  isValidEmail,
  upsertPendingSubscriber,
  issueToken,
  rateLimit,
} from "../../../lib/accounts/store.mjs";
import { sendEmail, confirmSubscribeEmail } from "../../../lib/accounts/email.mjs";
import { appUrl } from "../../../lib/accounts/env.mjs";

export const dynamic = "force-dynamic";

// Uniform response — never reveal whether the email already exists.
const OK = () => json({ ok: true, message: "Check your email to confirm." });

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "invalid body" }, { status: 400 });
  }
  const email = normalizeEmail(body?.email);
  if (!isValidEmail(email)) {
    return json({ ok: false, error: "enter a valid email" }, { status: 400 });
  }
  if (!(await rateLimit(`subscribe:${clientIp(request)}`, 8))) {
    return json({ ok: false, error: "too many requests, try again soon" }, { status: 429 });
  }

  try {
    await upsertPendingSubscriber(email);
    const token = await issueToken(email, "confirm_subscribe");
    const confirmUrl = `${appUrl()}/auth/confirm?token=${encodeURIComponent(token)}&purpose=subscribe`;
    await sendEmail({ to: email, ...confirmSubscribeEmail({ confirmUrl }) });
  } catch (e) {
    console.error("[subscribe]", e?.message || e);
    // Still return OK to avoid leaking internal state / existence.
  }
  return OK();
}
