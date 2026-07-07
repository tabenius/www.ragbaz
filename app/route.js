import { readPage, htmlResponse } from "../lib/site-pages.mjs";

export const dynamic = "force-static";

export async function GET() {
  return htmlResponse(readPage([]));
}
