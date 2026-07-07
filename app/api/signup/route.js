import { json, clientIp } from "../../../lib/accounts/http.mjs";
import {
  normalizeEmail,
  isValidEmail,
  issueToken,
  rateLimit,
} from "../../../lib/accounts/store.mjs";
import { sendEmail, confirmAccountEmail } from "../../../lib/accounts/email.mjs";
import { appUrl } from "../../../lib/accounts/env.mjs";

export const dynamic = "force-dynamic";

// Start account creation: email a confirmation link. Does NOT touch the
// newsletter subscribers table (accounts and newsletter are separate lists).
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
  if (!(await rateLimit(`signup:${clientIp(request)}`, 8))) {
    return json({ ok: false, error: "too many requests, try again soon" }, { status: 429 });
  }

  try {
    const token = await issueToken(email, "confirm_account");
    const confirmUrl = `${appUrl()}/auth/confirm?token=${encodeURIComponent(token)}&purpose=account`;
    await sendEmail({ to: email, ...confirmAccountEmail({ confirmUrl }) });
  } catch (e) {
    console.error("[signup]", e?.message || e);
  }
  return OK();
}
