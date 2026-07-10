// Transactional email via Resend. Falls back to console logging in dev
// (when RESEND_API_KEY is unset) so the full flow is testable without sending.
import { getEnv } from "./env.mjs";

export async function sendEmail({ to, subject, text, html }) {
  const env = getEnv();
  const from = env.RESEND_FROM || "ragbaz <no-reply@ragbaz.cc>";
  const key = env.RESEND_API_KEY;

  if (!key) {
    console.log(
      `\n[email:dev] no RESEND_API_KEY — not sending.\n  to: ${to}\n  subject: ${subject}\n  text:\n${text}\n`,
    );
    return { ok: true, dev: true };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, text, html: html || undefined }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error(`[email] Resend ${res.status}: ${detail}`);
    return { ok: false, status: res.status };
  }
  return { ok: true };
}

const SHELL = (title, bodyHtml) =>
  `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:520px;margin:0 auto;color:#1a1a1a">
<h2 style="font-weight:600">${title}</h2>${bodyHtml}
<p style="color:#888;font-size:12px;margin-top:2rem">ragbaz · oslo + stockholm</p></div>`;

export function confirmSubscribeEmail({ confirmUrl, plan }) {
  const planPrefix = plan ? ` (${plan})` : "";
  return {
    subject: `Confirm your ragbaz updates subscription${planPrefix}`,
    text: `Confirm you want ragbaz updates${plan ? ` for ${plan}` : ""} (very low volume — only substantial news):\n\n${confirmUrl}\n\nIf this wasn't you, ignore this email.`,
    html: SHELL(
      "Confirm your subscription",
      `<p>Confirm you want ragbaz updates${plan ? ` for <strong>${plan}</strong>` : ""} — very low volume, only substantial news.</p>
<p><a href="${confirmUrl}" style="background:#ff9900;color:#1a1208;padding:.6rem 1rem;border-radius:6px;text-decoration:none;font-weight:600">Confirm subscription</a></p>
<p style="color:#888;font-size:13px">If this wasn't you, ignore this email.</p>`,
    ),
  };
}

export function confirmAccountEmail({ confirmUrl }) {
  return {
    subject: "Confirm your email for a ragbaz account",
    text: `Confirm your email to finish creating your ragbaz account, then set a password:\n\n${confirmUrl}\n\nIf this wasn't you, ignore this email.`,
    html: SHELL(
      "Confirm your email",
      `<p>Confirm your email to finish creating your ragbaz account and set a password.</p>
<p><a href="${confirmUrl}" style="background:#ff9900;color:#1a1208;padding:.6rem 1rem;border-radius:6px;text-decoration:none;font-weight:600">Confirm &amp; set password</a></p>
<p style="color:#888;font-size:13px">If this wasn't you, ignore this email.</p>`,
    ),
  };
}
