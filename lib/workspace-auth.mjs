import { timingSafeEqualText } from "./accounts/crypto.mjs";
import { graphqlSyncKey } from "./accounts/env.mjs";

export function graphqlSyncConfigured() {
  return Boolean(graphqlSyncKey());
}

function requestSyncKey(request) {
  const auth = request.headers.get("authorization") || "";
  if (auth.toLowerCase().startsWith("bearer ")) return auth.slice(7).trim();
  return request.headers.get("x-ragbaz-auth-key") || "";
}

export function requestGraphqlSyncAuthorized(request) {
  const configuredKey = graphqlSyncKey();
  if (!configuredKey) return false;
  const presentedKey = requestSyncKey(request);
  if (!presentedKey) return false;
  return timingSafeEqualText(presentedKey, configuredKey);
}
