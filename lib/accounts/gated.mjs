// Gated artifact serving. The files are NOT public (see scripts/sync-public.mjs);
// their bytes are embedded at build time into gated-content.generated.mjs so the
// Worker can serve them at runtime after a session check (Next file tracing does
// not bundle files read via runtime readFileSync).
import { GATED_CONTENT } from "./gated-content.generated.mjs";

const MIME = {
  ".sh": "text/x-shellscript; charset=utf-8",
  ".py": "text/x-python; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".pdf": "application/pdf",
  ".zip": "application/zip",
};

/** Paths under site/ that require an account to download. */
export const GATED_PREFIXES = ["school/forensics/assets/"];

export function isGatedPath(relPath) {
  const clean = relPath.replace(/^\/+/, "");
  return GATED_PREFIXES.some((p) => clean.startsWith(p));
}

function extOf(name) {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i).toLowerCase() : "";
}

/** Return { body: Uint8Array, contentType, filename } or null. */
export function readArtifact(relPath) {
  const clean = relPath.replace(/^\/+/, "");
  const b64 = GATED_CONTENT[clean];
  if (typeof b64 !== "string") return null;
  const bin = atob(b64);
  const body = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) body[i] = bin.charCodeAt(i);
  const filename = clean.split("/").pop();
  return { body, contentType: MIME[extOf(filename)] || "application/octet-stream", filename };
}
