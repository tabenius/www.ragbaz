import { json } from "../../../lib/accounts/http.mjs";
import { clearSession } from "../../../lib/accounts/session.mjs";

export const dynamic = "force-dynamic";

export async function POST() {
  await clearSession();
  return json({ ok: true });
}
