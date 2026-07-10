import { readPage, htmlResponse, pageParams } from "../../lib/site-pages.mjs";
import { notFound } from "next/navigation";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return [
    ...pageParams().map((segments) => ({ path: segments })),
    { path: ["tractatus"] },
  ];
}

export async function GET(request, { params }) {
  const { path: segments } = await params;
  if (Array.isArray(segments) && segments.length === 1 && segments[0] === "tractatus") {
    const redirectUrl = new URL(request.url);
    redirectUrl.pathname = "/konsonans-ai-governance";
    return Response.redirect(redirectUrl.toString(), 308);
  }
  const html = readPage(segments ?? []);
  if (html === null) notFound();
  return htmlResponse(html);
}
