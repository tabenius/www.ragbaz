import { json } from "../../../lib/accounts/http.mjs";
import { getSession } from "../../../lib/accounts/session.mjs";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return json({ authenticated: false }, { status: 200 });
  return json({ authenticated: true, email: session.email });
}
