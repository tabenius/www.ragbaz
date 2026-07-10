import { getDb, maybeDb } from "./accounts/env.mjs";
import { clientIp } from "./accounts/http.mjs";

function missingTable(error) {
  return /no such table:\s*page_hit_(seen|rollups)/i.test(String(error?.message || error));
}

function dayString(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function dayOffset(offset) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + offset);
  return dayString(date);
}

function canonicalPathname(input) {
  const pathname = typeof input === "string" ? new URL(input, "https://ragbaz.cc").pathname : input.pathname;
  if (!pathname || pathname === "/") return "/";
  return pathname.endsWith("/") ? pathname.slice(0, -1) || "/" : pathname;
}

function trackedPath(pathname) {
  if (!pathname) return false;
  if (pathname.startsWith("/api/")) return false;
  if (pathname.startsWith("/_next/")) return false;
  if (pathname === "/healthz") return false;
  if (/\.[a-z0-9]+$/i.test(pathname)) return false;
  return true;
}

function fillSeries(rows, days) {
  const byDay = new Map(rows.map((row) => [row.day, row]));
  return Array.from({ length: days }).map((_, index) => {
    const day = dayOffset(index - (days - 1));
    const row = byDay.get(day);
    return {
      day,
      hits: Number(row?.hits || 0),
      uniques: Number(row?.uniques || 0),
    };
  });
}

async function visitorHash(request, day) {
  const input = `${day}:${clientIp(request)}:${request.headers.get("user-agent") || ""}`;
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, "0")).join("");
}

export function shouldTrackSiteHit(request) {
  if (request.method !== "GET" && request.method !== "HEAD") return false;
  return trackedPath(canonicalPathname(new URL(request.url)));
}

export async function recordSiteHit(request, db = getDb()) {
  if (!shouldTrackSiteHit(request)) return;

  const day = dayString();
  const path = canonicalPathname(new URL(request.url));
  const hash = await visitorHash(request, day);
  const firstSeen = Math.floor(Date.now() / 1000);

  try {
    const seen = await db
      .prepare(
        `INSERT OR IGNORE INTO page_hit_seen (day, path, visitor_hash, first_seen_at)
         VALUES (?, ?, ?, ?)`,
      )
      .bind(day, path, hash, firstSeen)
      .run();

    const uniqueIncrement = Number(seen?.meta?.changes || 0) > 0 ? 1 : 0;

    await db
      .prepare(
        `INSERT INTO page_hit_rollups (day, path, hits, uniques)
         VALUES (?, ?, 1, ?)
         ON CONFLICT(day, path) DO UPDATE SET
           hits = hits + 1,
           uniques = uniques + excluded.uniques`,
      )
      .bind(day, path, uniqueIncrement)
      .run();
  } catch (error) {
    if (missingTable(error)) return;
    throw error;
  }
}

export async function loadTrafficStats({ days = 14 } = {}) {
  const db = maybeDb();
  if (!db) {
    return {
      available: false,
      totals: { hits: 0, uniques: 0 },
      daily: fillSeries([], days),
      topPaths: [],
    };
  }

  const startDay = dayOffset(-(days - 1));

  try {
    const [dailyRows, topRows] = await Promise.all([
      db
        .prepare(
          `SELECT day, SUM(hits) AS hits, SUM(uniques) AS uniques
             FROM page_hit_rollups
            WHERE day >= ?
            GROUP BY day
            ORDER BY day ASC`,
        )
        .bind(startDay)
        .all(),
      db
        .prepare(
          `SELECT path, SUM(hits) AS hits, SUM(uniques) AS uniques
             FROM page_hit_rollups
            WHERE day >= ?
            GROUP BY path
            ORDER BY uniques DESC, hits DESC, path ASC
            LIMIT 6`,
        )
        .bind(startDay)
        .all(),
    ]);

    const daily = fillSeries(Array.isArray(dailyRows?.results) ? dailyRows.results : [], days);
    const totals = daily.reduce(
      (sum, row) => ({
        hits: sum.hits + Number(row.hits || 0),
        uniques: sum.uniques + Number(row.uniques || 0),
      }),
      { hits: 0, uniques: 0 },
    );

    return {
      available: true,
      totals,
      daily,
      topPaths: Array.isArray(topRows?.results)
        ? topRows.results.map((row) => ({
          path: row.path,
          hits: Number(row.hits || 0),
          uniques: Number(row.uniques || 0),
        }))
        : [],
    };
  } catch (error) {
    if (missingTable(error)) {
      return {
        available: false,
        totals: { hits: 0, uniques: 0 },
        daily: fillSeries([], days),
        topPaths: [],
      };
    }
    throw error;
  }
}
