import { htmlPage } from "../../../lib/accounts/http.mjs";
import { unsubscribeByToken } from "../../../lib/accounts/store.mjs";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const token = new URL(request.url).searchParams.get("token") || "";
  const ok = await unsubscribeByToken(token).catch(() => false);
  return htmlPage(
    "unsubscribe",
    ok
      ? `<h1>unsubscribed</h1><p class="msg ok">You won't receive ragbaz updates anymore.</p><p><a href="/">↩ ragbaz.cc</a></p>`
      : `<h1>unsubscribe</h1><p class="msg err">That link is invalid or already used.</p><p><a href="/">↩ ragbaz.cc</a></p>`,
  );
}
