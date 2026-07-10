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

// The RAGBAZ Atlas (Docusaurus, baseUrl /doc/) is served by its own origin,
// which only exposes the /doc/ prefix; the worker fronts it so the docs live
// under ragbaz.cc/doc/ instead of a subdomain.
const DOCS_ORIGIN = "https://doc.ragbaz.cc";

function proxyDocs(request) {
  const url = new URL(request.url);
  if (url.pathname === "/doc") {
    url.pathname = "/doc/";
    return Response.redirect(url.toString(), 301);
  }
  if (!url.pathname.startsWith("/doc/")) return null;
  const upstream = new URL(url.pathname + url.search, DOCS_ORIGIN);
  return fetch(new Request(upstream, request));
}

export default {
  async fetch(request, env, ctx) {
    if (env?.DB) ctx.waitUntil(recordSiteHit(request, env.DB));
    const docs = proxyDocs(request);
    if (docs) return docs;
    return handler.fetch(request, env, ctx);
  },

  async scheduled(_event, env, ctx) {
    ctx.waitUntil(syncWorkspaceSnapshot(env));
  },
};
