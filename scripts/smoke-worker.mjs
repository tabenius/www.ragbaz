#!/usr/bin/env node

const siteOrigins = (process.env.RAGBAZ_SMOKE_ORIGINS ||
  "https://ragbaz.cc,https://www.ragbaz.cc")
  .split(",")
  .map((origin) => origin.trim().replace(/\/+$/, ""))
  .filter(Boolean);

const siteChecks = [
  { path: "/healthz", expectStatus: 200, expectText: "ok" },
  { path: "/", expectStatus: 200, expectText: "RAGBAZ" },
  { path: "/doc", expectStatus: 200 },
  { path: "/pricing", expectStatus: 200 },
  { path: "/prospects/ai-governance", expectStatus: 200 },
];

const timeoutMs = Number.parseInt(process.env.RAGBAZ_SMOKE_TIMEOUT_MS || "10000", 10);
let failures = 0;

async function check(origin, spec) {
  const url = `${origin}${spec.path}`;
  const started = Date.now();
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(timeoutMs),
      headers: { "user-agent": "ragbaz-edge-smoke/1.0" },
    });
    const body = await response.text();
    const elapsed = Date.now() - started;
    const statusOk = response.status === spec.expectStatus;
    const bodyOk = !spec.expectText || body.includes(spec.expectText);
    if (!statusOk || !bodyOk) {
      failures += 1;
      console.error(
        `[fail] ${url} status=${response.status} expected=${spec.expectStatus} body_match=${bodyOk} elapsed_ms=${elapsed}`,
      );
      return;
    }
    console.log(`[pass] ${url} status=${response.status} elapsed_ms=${elapsed}`);
  } catch (error) {
    failures += 1;
    console.error(`[fail] ${url} ${error.message}`);
  }
}

for (const origin of siteOrigins) {
  for (const spec of siteChecks) {
    await check(origin, spec);
  }
}

if (failures > 0) {
  console.error(`ragbaz edge smoke failed: ${failures} check(s) failed`);
  process.exit(1);
}

console.log(`ragbaz edge smoke passed: ${siteOrigins.length * siteChecks.length} check(s)`);
