import { Suspense, cache } from "react";

import { normalizeWorkspaceSnapshot } from "../../lib/workspace-index.mjs";
import { loadTrafficStats } from "../../lib/site-traffic.mjs";
import { currentWorkspaceSnapshot } from "../../lib/workspace-store.mjs";
import { statsPageStyles } from "./styles.mjs";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "RAGBAZ Stats",
  description: "Tracked package budget and completion data sourced from the current workspace snapshot.",
};

const getWorkspaceStatsSnapshot = cache(async () => {
  return normalizeWorkspaceSnapshot(await currentWorkspaceSnapshot());
});

const getTrafficStats = cache(async () => loadTrafficStats({ days: 14 }));

function formatMoney(value, currency = "USD") {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function formatCompletion(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "—";
  return `${Number(value).toFixed(0)}%`;
}

function historyRows(entries, currency) {
  return entries.slice(-3).reverse().map((entry) => (
    <tr key={`${entry.date}-${entry.note || ""}`}>
      <td>{entry.date}</td>
      <td>{formatMoney(entry.dollars, currency)}</td>
      <td>{formatCompletion(entry.completion)}</td>
      <td>{entry.note || ""}</td>
    </tr>
  ));
}

function SummarySkeleton() {
  return (
    <div className="summary summary-skeleton" aria-hidden="true">
      {Array.from({ length: 4 }).map((_, index) => (
        <div className="panel" key={index}>
          <div className="skeleton skeleton-line short" />
          <div className="skeleton skeleton-line medium" />
        </div>
      ))}
    </div>
  );
}

function TrafficSkeleton() {
  return (
    <div className="traffic-grid" aria-hidden="true">
      {Array.from({ length: 3 }).map((_, index) => (
        <div className="traffic-widget traffic-skeleton-card" key={index}>
          <div className="skeleton skeleton-line short" />
          <div className="skeleton skeleton-line medium" />
          <div className="skeleton row" style={{ height: "5.5rem", borderRadius: "10px" }} />
        </div>
      ))}
    </div>
  );
}

function ProjectSkeleton({ count = 3 }) {
  return (
    <div className="projects" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <article className="project project-skeleton" key={index}>
          <div className="project-skeleton-head">
            <div style={{ display: "grid", gap: ".55rem" }}>
              <div className="skeleton skeleton-line short" />
              <div className="skeleton skeleton-line medium" />
              <div className="skeleton skeleton-line long" />
            </div>
            <div className="project-skeleton-metrics">
              {Array.from({ length: 3 }).map((__, metricIndex) => (
                <div className="metric" key={metricIndex}>
                  <div className="skeleton skeleton-line short" />
                  <div className="skeleton skeleton-line medium" />
                </div>
              ))}
            </div>
          </div>
          <div className="skeleton skeleton-line medium" />
          <div className="table-skeleton">
            {Array.from({ length: 4 }).map((__, rowIndex) => (
              <div className="skeleton row" key={rowIndex} />
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}

function TrafficBars({ series, tone = "orange" }) {
  const width = 280;
  const height = 84;
  const padding = 10;
  const chartHeight = 52;
  const baseY = 64;
  const barGap = 4;
  const barWidth = Math.max(8, Math.floor((width - padding * 2 - barGap * (series.length - 1)) / series.length));
  const values = series.map((entry) => entry.value);
  const maxValue = Math.max(...values, 1);

  return (
    <svg className="traffic-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Daily traffic chart">
      <line className="grid" x1={padding} x2={width - padding} y1={baseY} y2={baseY} />
      <line className="grid" x1={padding} x2={width - padding} y1={padding + 8} y2={padding + 8} />
      {series.map((entry, index) => {
        const heightValue = Math.max(4, Math.round((entry.value / maxValue) * chartHeight));
        const x = padding + index * (barWidth + barGap);
        const y = baseY - heightValue;
        return (
          <rect
            className={`bar${tone === "blue" ? " blue" : ""}`}
            key={entry.day}
            x={x}
            y={y}
            width={barWidth}
            height={heightValue}
            rx="3"
          />
        );
      })}
      <text className="axis" x={padding} y={78}>{series[0]?.day.slice(5) || ""}</text>
      <text className="axis" x={width - padding} y={78} textAnchor="end">{series[series.length - 1]?.day.slice(5) || ""}</text>
    </svg>
  );
}

async function SummaryPanels() {
  const snapshot = await getWorkspaceStatsSnapshot();
  const tracked = snapshot.manifests.filter((manifest) => manifest.stats?.entries?.length);
  const totalDollars = tracked.reduce((sum, manifest) => sum + Number(manifest.stats?.latestDollars || 0), 0);
  const averageCompletion = tracked.length
    ? tracked.reduce((sum, manifest) => sum + Number(manifest.stats?.latestCompletion || 0), 0) / tracked.length
    : 0;

  return (
    <div className="summary">
      <div className="panel"><span>Tracked projects</span><strong>{tracked.length}</strong></div>
      <div className="panel"><span>Latest dollars</span><strong>{formatMoney(totalDollars)}</strong></div>
      <div className="panel"><span>Avg completion</span><strong>{formatCompletion(averageCompletion)}</strong></div>
      <div className="panel"><span>Snapshot</span><strong>{snapshot.storedAt || snapshot.generatedAt || "—"}</strong></div>
    </div>
  );
}

async function ProjectList() {
  const snapshot = await getWorkspaceStatsSnapshot();
  const tracked = snapshot.manifests.filter((manifest) => manifest.stats?.entries?.length);

  if (!tracked.length) {
    return <div className="empty">No manifest-linked stats sidecars are present in the current workspace snapshot.</div>;
  }

  return (
    <div className="projects">
      {tracked.map((manifest) => {
        const stats = manifest.stats;
        return (
          <article className="project" key={manifest.key}>
            <header className="project-head">
              <div>
                <p className="eyebrow">{manifest.kind}</p>
                <h2>{manifest.displayName || manifest.name || manifest.path}</h2>
                <p className="path">{manifest.path}</p>
              </div>
              <div className="metrics">
                <div><span>Budget</span><strong>{formatMoney(stats.latestDollars, stats.currency)}</strong></div>
                <div><span>Completion</span><strong>{formatCompletion(stats.latestCompletion)}</strong></div>
                <div><span>Updated</span><strong>{stats.updatedAt || "—"}</strong></div>
              </div>
            </header>
            <p className="meta">stats file: {manifest.statsFile || "—"}</p>
            <div className="history-wrap">
              <table>
                <thead>
                  <tr><th>Date</th><th>Dollars</th><th>Completion</th><th>Note</th></tr>
                </thead>
                <tbody>{historyRows(stats.entries, stats.currency)}</tbody>
              </table>
            </div>
          </article>
        );
      })}
    </div>
  );
}

async function TrafficWidgets() {
  const traffic = await getTrafficStats();

  if (!traffic.available) {
    return <div className="traffic-empty">Traffic rollups are not available yet. Apply migration <code>0004_page_hit_rollups.sql</code> and let the Worker collect a few requests.</div>;
  }

  const dailyUniques = traffic.daily.map((entry) => ({ day: entry.day, value: entry.uniques }));
  const dailyHits = traffic.daily.map((entry) => ({ day: entry.day, value: entry.hits }));

  return (
    <div className="traffic-grid">
      <section className="traffic-widget">
        <div className="traffic-widget-head">
          <div>
            <span className="eyebrow">Traffic</span>
            <strong>{traffic.totals.uniques.toLocaleString()}</strong>
          </div>
          <span className="sub">14d uniques</span>
        </div>
        <TrafficBars series={dailyUniques} tone="blue" />
      </section>
      <section className="traffic-widget">
        <div className="traffic-widget-head">
          <div>
            <span className="eyebrow">Requests</span>
            <strong>{traffic.totals.hits.toLocaleString()}</strong>
          </div>
          <span className="sub">14d hits</span>
        </div>
        <TrafficBars series={dailyHits} tone="orange" />
      </section>
      <section className="traffic-widget">
        <div className="traffic-widget-head">
          <div>
            <span className="eyebrow">Paths</span>
            <strong>{traffic.topPaths.length}</strong>
          </div>
          <span className="sub">ranked by uniques</span>
        </div>
        <ol className="traffic-list">
          {traffic.topPaths.map((entry) => (
            <li key={entry.path}>
              <code>{entry.path}</code>
              <span className="mono">{entry.uniques}u</span>
              <span className="mono">{entry.hits}h</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

export default function StatsPage() {
  return (
    <main className="rb-stats">
      <style>{statsPageStyles}</style>
      <section className="hero">
        <div>
          <p className="eyebrow">workspace snapshot</p>
          <h1>Tracked package stats</h1>
          <p>Latest budget and completion data from manifest-linked sidecar files in the current Worker snapshot.</p>
        </div>
        <Suspense fallback={<SummarySkeleton />}>
          <SummaryPanels />
        </Suspense>
      </section>
      <section className="traffic">
        <Suspense fallback={<TrafficSkeleton />}>
          <TrafficWidgets />
        </Suspense>
      </section>
      <Suspense fallback={<ProjectSkeleton count={4} />}>
        <ProjectList />
      </Suspense>
    </main>
  );
}
