import { htmlResponse, resolvePage } from "../lib/site-pages.mjs";

export const dynamic = "force-static";

export async function GET() {
  return htmlResponse(resolvePage([]));
}
