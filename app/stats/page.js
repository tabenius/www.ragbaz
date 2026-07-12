import { Suspense, cache } from "react";

import { normalizeWorkspaceSnapshot } from "../../lib/workspace-index.mjs";
import { loadTrafficStats } from "../../lib/site-traffic.mjs";
import { currentWorkspaceSnapshot } from "../../lib/workspace-store.mjs";
import { statsPageStyles } from "./styles.mjs";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "RAGBAZ Stats",
  description: "Published catalog and tracked package budget/completion data sourced from the current workspace snapshot.",
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
      {Array.from({ length: 7 }).map((_, index) => (
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
  const catalogEntries = [...snapshot.publicCatalog.products, ...snapshot.publicCatalog.tracks];
  const tracked = snapshot.manifests.filter((manifest) => manifest.stats?.entries?.length);
  const manifestDollars = tracked.reduce((sum, manifest) => sum + Number(manifest.stats?.latestDollars || 0), 0);
  const catalogCurrentValue = catalogEntries.reduce((sum, entry) => sum + Number(entry.currentValueUsd || 0), 0);
  const averageCompletion = catalogEntries.length
    ? catalogEntries.reduce((sum, entry) => sum + Number(entry.completion || 0), 0) / catalogEntries.length
    : 0;

  return (
    <div className="summary">
      <div className="panel"><span>Published products</span><strong>{snapshot.stats.publishedProducts}</strong></div>
      <div className="panel"><span>Catalog tracks</span><strong>{snapshot.stats.catalogTracks}</strong></div>
      <div className="panel"><span>Catalog current value</span><strong>{formatMoney(catalogCurrentValue)}</strong></div>
      <div className="panel"><span>Avg completion</span><strong>{formatCompletion(averageCompletion)}</strong></div>
      <div className="panel"><span>Tracked manifests</span><strong>{tracked.length}</strong></div>
      <div className="panel"><span>Manifest dollars</span><strong>{formatMoney(manifestDollars)}</strong></div>
      <div className="panel"><span>Snapshot</span><strong>{snapshot.storedAt || snapshot.generatedAt || "—"}</strong></div>
    </div>
  );
}

function renderCatalogLinks(entry) {
  return Object.entries(entry.links || {})
    .filter(([label, href]) => href && label !== "github")
    .slice(0, 4)
    .map(([label, href]) => (
      <a key={`${entry.slug}-${label}`} href={href}>{label}</a>
    ));
}

async function CatalogList() {
  const snapshot = await getWorkspaceStatsSnapshot();
  const entries = [...snapshot.publicCatalog.products, ...snapshot.publicCatalog.tracks];

  if (!entries.length) {
    return <div className="catalog-empty">No published catalog entries are present in the current workspace snapshot.</div>;
  }

  return (
    <div className="projects">
      {entries.map((entry) => (
        <article className="project catalog-item" key={`${entry.kind}:${entry.slug}`}>
          <header className="project-head">
            <div>
              <p className="eyebrow">{entry.kind} · {entry.tagLabel}</p>
              <h2>{entry.name}</h2>
              <p className="path">{entry.slug}</p>
            </div>
            <div className="metrics">
              <div><span>Pricing</span><strong>{entry.pricing || "—"}</strong></div>
              <div><span>Completion</span><strong>{formatCompletion(entry.completion)}</strong></div>
              <div><span>Current value</span><strong>{formatMoney(entry.currentValueUsd)}</strong></div>
              <div><span>Finished value</span><strong>{formatMoney(entry.finishedValueUsd)}</strong></div>
            </div>
          </header>
          <p className="catalog-summary">{entry.value}</p>
          <div className="catalog-links">{renderCatalogLinks(entry)}</div>
        </article>
      ))}
    </div>
  );
}

async function ManifestProjectList() {
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
          <h1>Catalog and package stats</h1>
          <p>Published catalog metadata and manifest-linked budget/completion sidecars distributed from the current Worker snapshot.</p>
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
      <section className="catalog-section">
        <div className="section-head">
          <p className="eyebrow">published catalog</p>
          <h2>Public product surface</h2>
          <p>Entries below come from the public ragbaz catalog that drives completion, prospects, and Worker GraphQL responses.</p>
        </div>
        <Suspense fallback={<ProjectSkeleton count={3} />}>
          <CatalogList />
        </Suspense>
      </section>
      <section className="manifests-section">
        <div className="section-head">
          <p className="eyebrow">manifest sidecars</p>
          <h2>Tracked package stats</h2>
          <p>These rows come from manifest-linked stats sidecars discovered under <code>/data/src</code>.</p>
        </div>
        <Suspense fallback={<ProjectSkeleton count={4} />}>
          <ManifestProjectList />
        </Suspense>
      </section>
    </main>
  );
}
