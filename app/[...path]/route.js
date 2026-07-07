import { readPage, htmlResponse, pageParams } from "../../lib/site-pages.mjs";
import { notFound } from "next/navigation";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return pageParams().map((segments) => ({ path: segments }));
}

export async function GET(_request, { params }) {
  const { path: segments } = await params;
  const html = readPage(segments ?? []);
  if (html === null) notFound();
  return htmlResponse(html);
}
