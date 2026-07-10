import { graphql } from "graphql";
import { htmlPage } from "../../../lib/accounts/http.mjs";
import { currentWorkspaceSnapshot } from "../../../lib/workspace-store.mjs";
import {
  graphqlSyncConfigured,
  requestGraphqlSyncAuthorized,
} from "../../../lib/workspace-auth.mjs";
import { workspaceSchema } from "../../../lib/workspace-graphql.mjs";

export const dynamic = "force-dynamic";

function corsHeaders() {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "authorization,content-type,x-ragbaz-auth-key",
  };
}

function jsonResponse(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "cache-control": "no-store",
      "content-type": "application/json; charset=utf-8",
      ...corsHeaders(),
      ...(init.headers || {}),
    },
  });
}

function htmlResponse(body, init = {}) {
  const response = htmlPage("Workspace GraphQL", body);
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(corsHeaders())) headers.set(key, value);
  for (const [key, value] of Object.entries(init.headers || {})) headers.set(key, value);
  return new Response(response.body, {
    ...init,
    status: init.status || response.status,
    headers,
  });
}

function parseJsonParam(value, label) {
  if (!value) return undefined;
  try {
    return JSON.parse(value);
  } catch {
    throw new Error(`${label} must be valid JSON`);
  }
}

async function executeGraphQL({ query, variables, operationName, request }) {
  if (!query || typeof query !== "string") {
    return jsonResponse({ errors: [{ message: "query must be a non-empty string" }] }, { status: 400 });
  }

  const snapshot = await currentWorkspaceSnapshot();
  const result = await graphql({
    schema: workspaceSchema,
    source: query,
    variableValues: variables,
    operationName,
    contextValue: {
      snapshot,
      isSyncAuthorized: requestGraphqlSyncAuthorized(request),
      syncKeyConfigured: graphqlSyncConfigured(),
    },
  });

  return jsonResponse(result, { status: result.errors?.length ? 400 : 200 });
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");
  if (!query) {
    return htmlResponse(`
<h1>Workspace GraphQL</h1>
<p>Public queries expose ragbaz page metadata and manifest/package metadata discovered under <code>/data/src</code>.</p>
<p>Authenticated updates use <code>Authorization: Bearer &lt;GRAPHQL_SYNC_KEY&gt;</code> or <code>x-ragbaz-auth-key</code> and call <code>pushWorkspaceSnapshot</code>.</p>
<p><a href="/api/graphql?query=%7Bstats%7BtotalManifests%20totalSitePages%7D%7D">Example stats query</a></p>
<pre>{ manifests(kind: COMPONENT, limit: 5) { path name componentId owner } }</pre>`);
  }

  try {
    return await executeGraphQL({
      query,
      variables: parseJsonParam(searchParams.get("variables"), "variables"),
      operationName: searchParams.get("operationName") || undefined,
      request,
    });
  } catch (error) {
    return jsonResponse({ errors: [{ message: error.message }] }, { status: 400 });
  }
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ errors: [{ message: "body must be valid JSON" }] }, { status: 400 });
  }

  return executeGraphQL({
    query: body?.query,
    variables: body?.variables,
    operationName: body?.operationName,
    request,
  });
}
