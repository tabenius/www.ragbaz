import { currentWorkspaceSnapshot } from "../../lib/workspace-store.mjs";
import { normalizeWorkspaceSnapshot } from "../../lib/workspace-index.mjs";

export const dynamic = "force-dynamic";

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

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
  return entries
    .slice(-3)
    .reverse()
    .map(
      (entry) => `
        <tr>
          <td>${escapeHtml(entry.date)}</td>
          <td>${escapeHtml(formatMoney(entry.dollars, currency))}</td>
          <td>${escapeHtml(formatCompletion(entry.completion))}</td>
          <td>${escapeHtml(entry.note || "")}</td>
        </tr>`,
    )
    .join("");
}

export async function GET() {
  const snapshot = normalizeWorkspaceSnapshot(await currentWorkspaceSnapshot());
  const tracked = snapshot.manifests.filter((manifest) => manifest.stats?.entries?.length);
  const totalDollars = tracked.reduce(
    (sum, manifest) => sum + Number(manifest.stats?.latestDollars || 0),
    0,
  );
  const averageCompletion = tracked.length
    ? tracked.reduce((sum, manifest) => sum + Number(manifest.stats?.latestCompletion || 0), 0) / tracked.length
    : 0;

  const items = tracked
    .map((manifest) => {
      const stats = manifest.stats;
      return `
        <article class="project">
          <header class="project-head">
            <div>
              <p class="eyebrow">${escapeHtml(manifest.kind)}</p>
              <h2>${escapeHtml(manifest.displayName || manifest.name || manifest.path)}</h2>
              <p class="path">${escapeHtml(manifest.path)}</p>
            </div>
            <div class="metrics">
              <div><span>Budget</span><strong>${escapeHtml(formatMoney(stats.latestDollars, stats.currency))}</strong></div>
              <div><span>Completion</span><strong>${escapeHtml(formatCompletion(stats.latestCompletion))}</strong></div>
              <div><span>Updated</span><strong>${escapeHtml(stats.updatedAt || "—")}</strong></div>
            </div>
          </header>
          <p class="meta">stats file: ${escapeHtml(manifest.statsFile || "—")}</p>
          <div class="history-wrap">
            <table>
              <thead>
                <tr><th>Date</th><th>Dollars</th><th>Completion</th><th>Note</th></tr>
              </thead>
              <tbody>${historyRows(stats.entries, stats.currency)}</tbody>
            </table>
          </div>
        </article>`;
    })
    .join("");

  return new Response(
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1"/>
    <title>RAGBAZ Stats</title>
    <link rel="icon" href="/assets/logo-mark.svg"/>
    <link rel="stylesheet" href="/colors_and_type.css?v=2"/>
    <style>
      body{margin:0;background:var(--bg-0,#0a0908);color:var(--fg-2,#d8c29d);font-family:"Noto Sans",system-ui,sans-serif}
      main{max-width:1100px;margin:0 auto;padding:1.25rem 1rem 3rem}
      h1,h2{font-family:"Intel One Mono",monospace;letter-spacing:0}
      h1{font-size:1.5rem;margin:0}
      p{line-height:1.6}
      .hero{display:grid;gap:1rem;padding:1rem 0 1.5rem}
      .summary{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:.75rem}
      .summary .panel,.project{border:1px solid var(--border-2,#2a2a2a);background:var(--bg-2,#121212);border-radius:8px}
      .summary .panel{padding:1rem}
      .summary span,.metrics span,.eyebrow,.path,.meta,th{font-family:"Intel One Mono",monospace;font-size:.72rem;text-transform:uppercase;color:var(--fg-4,#9f9f9f)}
      .summary strong,.metrics strong{display:block;margin-top:.3rem;color:var(--fg-1,#f6d7a7);font-size:1.15rem}
      .projects{display:grid;gap:1rem}
      .project{padding:1rem}
      .project-head{display:grid;gap:1rem}
      .metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:.75rem}
      .metrics div{padding:.75rem;border:1px solid var(--border-3,#2d2d2d);border-radius:8px;background:var(--bg-3,#161616)}
      .eyebrow,.path,.meta{margin:0}
      .path,.meta{font-size:.7rem}
      h2{font-size:1rem;margin:.2rem 0 .25rem;color:var(--fg-1,#f6d7a7)}
      .history-wrap{overflow:auto}
      table{width:100%;border-collapse:collapse;margin-top:.9rem}
      th,td{text-align:left;padding:.55rem 0;border-top:1px solid var(--border-3,#2d2d2d);vertical-align:top}
      td{font-size:.92rem}
      .empty{padding:1rem;border:1px solid var(--border-2,#2a2a2a);border-radius:8px;background:var(--bg-2,#121212)}
      @media (min-width:760px){
        .hero{grid-template-columns:minmax(0,1.3fr) minmax(320px,1fr);align-items:end}
        .project-head{grid-template-columns:minmax(0,1fr) minmax(320px,1fr)}
      }
    </style>
  </head>
  <body>
    <main>
      <section class="hero">
        <div>
          <p class="eyebrow">workspace snapshot</p>
          <h1>Tracked package stats</h1>
          <p>Latest budget and completion data from manifest-linked sidecar files pushed into the Worker snapshot on sync.</p>
        </div>
        <div class="summary">
          <div class="panel"><span>Tracked projects</span><strong>${escapeHtml(String(tracked.length))}</strong></div>
          <div class="panel"><span>Latest dollars</span><strong>${escapeHtml(formatMoney(totalDollars))}</strong></div>
          <div class="panel"><span>Avg completion</span><strong>${escapeHtml(formatCompletion(averageCompletion))}</strong></div>
          <div class="panel"><span>Snapshot</span><strong>${escapeHtml(snapshot.storedAt || snapshot.generatedAt || "—")}</strong></div>
        </div>
      </section>
      <section class="projects">
        ${items || '<div class="empty">No manifest-linked stats sidecars are present in the current workspace snapshot.</div>'}
      </section>
    </main>
  </body>
</html>`,
    {
      headers: {
        "cache-control": "no-store",
        "content-type": "text/html; charset=utf-8",
      },
    },
  );
}
