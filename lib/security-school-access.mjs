const PROTECTED_SCHOOL_PREFIXES = [
  "/school/security",
  "/school/cellular",
  "/prospects/detcordon",
  "/doc/products/detcordon",
];

const PROTECTED_EXACT_PATHS = new Set([
  "/prospects/detcordon.html",
  "/doc/products/detcordon.html",
]);

function normalizeIp(value) {
  const trimmed = String(value || "").trim().toLowerCase();
  if (!trimmed) return "";
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) return trimmed.slice(1, -1);
  return trimmed;
}

function parseIpList(...values) {
  const ips = new Set();
  for (const value of values) {
    for (const token of String(value || "").split(/[\s,;]+/)) {
      const ip = normalizeIp(token);
      if (!ip) continue;
      if (ip.includes("/") || ip.includes("*")) continue;
      ips.add(ip);
    }
  }
  return ips;
}

export function isSecuritySchoolPath(pathname) {
  if (PROTECTED_EXACT_PATHS.has(pathname)) return true;
  return PROTECTED_SCHOOL_PREFIXES.some(
    prefix => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function configuredSecuritySchoolIps(env) {
  return parseIpList(
    env?.SECURITY_SCHOOL_ALLOWED_IPS,
    env?.TAILSCALE_ALLOWED_IPS,
    env?.NETBIRD_ALLOWED_IPS,
  );
}

export function securitySchoolClientIp(request) {
  return normalizeIp(request.headers.get("cf-connecting-ip"));
}

export function securitySchoolAccessDecision(request, env) {
  const pathname = new URL(request.url).pathname;
  if (!isSecuritySchoolPath(pathname)) return { protected: false, allowed: true, clientIp: "" };

  const clientIp = securitySchoolClientIp(request);
  const allowedIps = configuredSecuritySchoolIps(env);
  return {
    protected: true,
    allowed: Boolean(clientIp && allowedIps.has(clientIp)),
    clientIp,
    configuredCount: allowedIps.size,
  };
}

export function securitySchoolDeniedResponse() {
  return new Response("Not Found\n", {
    status: 404,
    headers: {
      "cache-control": "private, no-store, max-age=0",
      "content-type": "text/plain; charset=utf-8",
      "referrer-policy": "no-referrer",
      "x-content-type-options": "nosniff",
      "x-robots-tag": "noindex, nofollow, noarchive, nosnippet",
    },
  });
}

export function applySecuritySchoolResponseHeaders(response) {
  const protectedResponse = new Response(response.body, response);
  protectedResponse.headers.set("cache-control", "private, no-store, max-age=0");
  protectedResponse.headers.set("referrer-policy", "no-referrer");
  protectedResponse.headers.set("x-robots-tag", "noindex, nofollow, noarchive, nosnippet");
  protectedResponse.headers.set("vary", appendVary(protectedResponse.headers.get("vary"), "CF-Connecting-IP"));
  return protectedResponse;
}

function appendVary(existing, value) {
  const values = new Set(String(existing || "").split(",").map(item => item.trim()).filter(Boolean));
  values.add(value);
  return [...values].join(", ");
}
