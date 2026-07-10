import { getOperationAST, graphql, parse } from "graphql";
import { htmlPage } from "../../../lib/accounts/http.mjs";
import {
  workspaceGraphqlUpstreamKey,
  workspaceGraphqlUpstreamUrl,
} from "../../../lib/accounts/env.mjs";
import { currentWorkspaceSnapshot } from "../../../lib/workspace-store.mjs";
import {
  graphqlSyncConfigured,
  requestGraphqlSyncAuthorized,
} from "../../../lib/workspace-auth.mjs";
import { workspaceSchema } from "../../../lib/workspace-graphql.mjs";

export const dynamic = "force-dynamic";

const MAX_QUERY_BYTES = 64 * 1024;
const MAX_BODY_BYTES = 1024 * 1024;

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

function byteLength(value) {
  return new TextEncoder().encode(String(value || "")).length;
}

function assertWithinByteLimit(value, maxBytes, label) {
  if (byteLength(value) <= maxBytes) return;
  const error = new Error(`${label} exceeds the maximum size`);
  error.statusCode = 413;
  throw error;
}

function errorResponse(message, status = 400, headers = {}) {
  return jsonResponse({ errors: [{ message }] }, { status, headers });
}

function statusForGraphqlResult(result) {
  if (!result?.errors?.length) return 200;
  return result.errors.reduce((status, error) => {
    const explicit = Number(error?.extensions?.http?.status);
    if (Number.isInteger(explicit) && explicit >= 400) return Math.max(status, explicit);
    return Math.max(status, error?.path?.length ? 500 : 400);
  }, 400);
}

function operationType(query, operationName) {
  const document = parse(query);
  const operation = getOperationAST(document, operationName);
  if (!operation) throw new Error("query does not include an executable operation");
  return operation.operation;
}

async function executeGraphQL({ query, variables, operationName, request }) {
  if (!query || typeof query !== "string") {
    return errorResponse("query must be a non-empty string");
  }
  assertWithinByteLimit(query, MAX_QUERY_BYTES, "query");

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
      workspaceUpstreamUrl: workspaceGraphqlUpstreamUrl(),
      workspaceUpstreamKey: workspaceGraphqlUpstreamKey(),
    },
  });

  return jsonResponse(result, { status: statusForGraphqlResult(result) });
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
<p>Authenticated updates use <code>Authorization: Bearer &lt;GRAPHQL_SYNC_KEY&gt;</code> or <code>x-ragbaz-auth-key</code> and call <code>pushWorkspaceSnapshot</code> or <code>refreshWorkspaceSnapshot</code>.</p>
<p><a href="/api/graphql?query=%7Bstats%7BtotalManifests%20totalSitePages%7D%7D">Example stats query</a></p>
<pre>{ manifests(kind: COMPONENT, limit: 5) { path name componentId owner } }</pre>`);
  }

  try {
    assertWithinByteLimit(query, MAX_QUERY_BYTES, "query");
    const parsedOperation = operationType(query, searchParams.get("operationName") || undefined);
    if (parsedOperation !== "query") {
      return errorResponse("only query operations are allowed over GET", 405, { allow: "GET,POST,OPTIONS" });
    }
    return await executeGraphQL({
      query,
      variables: parseJsonParam(searchParams.get("variables"), "variables"),
      operationName: searchParams.get("operationName") || undefined,
      request,
    });
  } catch (error) {
    return errorResponse(error.message, error.statusCode || 400);
  }
}

export async function POST(request) {
  const contentLength = Number(request.headers.get("content-length") || "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return errorResponse("request body exceeds the maximum size", 413);
  }

  let bodyText;
  try {
    bodyText = await request.text();
  } catch {
    return errorResponse("body must be valid JSON");
  }

  if (byteLength(bodyText) > MAX_BODY_BYTES) {
    return errorResponse("request body exceeds the maximum size", 413);
  }

  let body;
  try {
    body = JSON.parse(bodyText);
  } catch {
    return errorResponse("body must be valid JSON");
  }

  return executeGraphQL({
    query: body?.query,
    variables: body?.variables,
    operationName: body?.operationName,
    request,
  });
}
