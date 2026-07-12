import { docsNotFoundPage, htmlResponse, pageParams, resolvePage } from "../../lib/site-pages.mjs";
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
    return new Response("Redirecting to /konsonans-ai-governance", {
      status: 308,
      headers: {
        "content-type": "text/plain; charset=utf-8",
        location: "/konsonans-ai-governance",
      },
    });
  }
  const page = resolvePage(segments ?? []);
  if (page === null) {
    if (Array.isArray(segments) && segments[0] === "doc") {
      const docs404 = docsNotFoundPage();
      return docs404 ? htmlResponse(docs404, 404) : new Response("Not found", { status: 404 });
    }
    notFound();
  }
  return htmlResponse(page);
}
