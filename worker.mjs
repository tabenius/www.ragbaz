// @ts-ignore `.open-next/worker.js` is generated at build time.
import handler from "./.open-next/worker.js";

import { recordSiteHit } from "./lib/site-traffic.mjs";
import { refreshWorkspaceSnapshotFromUpstream } from "./lib/workspace-upstream.mjs";

async function syncWorkspaceSnapshot(env) {
  if (!env?.DB) throw new Error("D1 binding DB is not configured");
  if (!String(env.WORKSPACE_GRAPHQL_UPSTREAM_URL || "").trim()) return null;
  return refreshWorkspaceSnapshotFromUpstream({
    db: env.DB,
    endpoint: env.WORKSPACE_GRAPHQL_UPSTREAM_URL,
    key: env.WORKSPACE_GRAPHQL_UPSTREAM_KEY,
  });
}

function temporarySchoolSlashRedirect(request) {
  const url = new URL(request.url);
  if (url.pathname !== "/school/") return null;
  url.pathname = "/school";
  return new Response(null, {
    status: 307,
    headers: {
      "cache-control": "no-store",
      location: `${url.pathname}${url.search}`,
    },
  });
}

function canonicalLegacyPathRedirect(request) {
  const url = new URL(request.url);
  if (url.pathname !== "/tractatus" && url.pathname !== "/tractatus/") return null;
  url.pathname = "/konsonans-ai-governance";
  return Response.redirect(url.toString(), 308);
}

function canonicalDocsPath(pathname) {
  if (pathname === "/doc/docs" || pathname === "/doc/docs/") return "/doc/";
  if (!pathname.startsWith("/doc/docs/")) return null;
  return `/doc/${pathname.slice("/doc/docs/".length)}`;
}

function canonicalDocHostRedirect(request) {
  const url = new URL(request.url);
  const host = url.hostname.toLowerCase();

  if (host === "doc.ragbaz.cc" || host === "www.doc.ragbaz.cc") {
    const redirectUrl = new URL(url.toString());
    redirectUrl.hostname = "ragbaz.cc";
    if (redirectUrl.pathname === "/") redirectUrl.pathname = "/doc/";
    else if (!redirectUrl.pathname.startsWith("/doc/") && redirectUrl.pathname !== "/doc") {
      redirectUrl.pathname = `/doc${redirectUrl.pathname}`;
    }
    const canonical = canonicalDocsPath(redirectUrl.pathname);
    if (canonical) redirectUrl.pathname = canonical;
    return Response.redirect(redirectUrl.toString(), 308);
  }

  const canonical = canonicalDocsPath(url.pathname);
  if (canonical) {
    url.pathname = canonical;
    return Response.redirect(url.toString(), 301);
  }

  return null;
}

export default {
  async fetch(request, env, ctx) {
    if (env?.DB) ctx.waitUntil(recordSiteHit(request, env.DB));
    const schoolRedirect = temporarySchoolSlashRedirect(request);
    if (schoolRedirect) return schoolRedirect;
    const legacyRedirect = canonicalLegacyPathRedirect(request);
    if (legacyRedirect) return legacyRedirect;
    const redirect = canonicalDocHostRedirect(request);
    if (redirect) return redirect;
    return handler.fetch(request, env, ctx);
  },

  async scheduled(_event, env, ctx) {
    ctx.waitUntil(syncWorkspaceSnapshot(env));
  },
};
