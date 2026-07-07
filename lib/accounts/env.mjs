// Access Worker bindings/env from route handlers under OpenNext.
import { getCloudflareContext } from "@opennextjs/cloudflare";

export function getEnv() {
  try {
    return getCloudflareContext().env ?? {};
  } catch {
    // Outside the Worker (e.g. `next build` static analysis) — no bindings.
    return {};
  }
}

export function getDb() {
  const db = getEnv().DB;
  if (!db) throw new Error("D1 binding DB is not configured");
  return db;
}

export function appUrl() {
  return getEnv().APP_URL || "http://localhost:8787";
}

export function sessionSecret() {
  // Dev fallback only; production sets SESSION_SECRET as a secret.
  return getEnv().SESSION_SECRET || "dev-only-insecure-session-secret";
}
