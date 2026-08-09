import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { prospectEntries, readSiteCatalog } from "../../../../metadata/src/site-catalog.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const siteRoot = path.join(repoRoot, "site", "prospects");

const VALUE_CAPTION = "Internal studio value estimates in USD. Current value is derived from completion percentage and is not booked revenue.";
const MATURITY_CAPTION = "Maturity is described qualitatively; no single completion percentage or derived current-value estimate is published.";

export function renderProspectPages() {
  const catalog = readSiteCatalog();
  const entries = prospectEntries(catalog).sort((left, right) => {
    const leftOrder = left.prospect?.order || left.slug;
    const rightOrder = right.prospect?.order || right.slug;
    return leftOrder.localeCompare(rightOrder);
  });

  return entries.map((entry, index) => ({
    slug: entry.prospect.slug,
    html: renderProspectPage({ entry, entries, index }),
  }));
}

export function generateProspectPages() {
  for (const { slug, html } of renderProspectPages()) {
    writeFileSync(path.join(siteRoot, `${slug}.html`), html, "utf8");
  }
}

function renderProspectPage({ entry, entries, index }) {
  const previous = index > 0 ? entries[index - 1] : null;
  const next = index < entries.length - 1 ? entries[index + 1] : null;
  const hasCompletionEstimate =
    entry.completion !== null
    && entry.completion !== undefined
    && Number.isFinite(Number(entry.completion));
  const statusCards = [
    renderStatusCard("status", entry.tagLabel, `${entry.tagLabel} lane`, entry.value),
    ...(hasCompletionEstimate
      ? [
          renderCompletionCard(entry.completion),
          renderStatusCard("current value", formatUsdCompact(entry.currentValueUsd), "derived from current completion", "Estimated present studio asset value at the current scope and maturity level."),
        ]
      : []),
    renderStatusCard("finished estimate", formatUsdCompact(entry.finishedValueUsd), `pricing signal ${escHtmlText(entry.pricing)}`, `Target studio asset value at the planned finished scope. Revenue status: ${escHtmlText(entry.revenue)}.`),
  ].join("\n        ");
  const statusCaption = hasCompletionEstimate ? VALUE_CAPTION : MATURITY_CAPTION;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escHtml(entry.name)} — prospect</title>
  <meta name="description" content="${escHtml(entry.prospect?.heroCopy || entry.short || entry.value)}" />
  <link rel="icon" href="/assets/logo-mark.svg" />
  <link rel="stylesheet" href="/colors_and_type.css?v=2" />
  <link rel="stylesheet" href="/prospects/prospect.css" />
  <script src="../assets/local-mode.js" defer></script>
</head>
<body>
  <main class="prospect-shell">
    <div class="wrap">
      <section class="prospect-head">
        <div class="kicker mono">${escHtml(entry.prospect.order || entry.slug)}</div>
        <h1 class="hero-title">${escHtml(entry.name)}</h1>
        <p class="hero-copy">${escHtml(entry.prospect?.heroCopy || entry.short || entry.value)}</p>
        <div class="hero-chips">${(entry.prospect?.chips || []).map((chip) => `<span class="chip mono">${escHtml(chip)}</span>`).join("")}</div>
      </section>

      <section class="status-grid" aria-label="project status">
        ${statusCards}
      </section>
      <p class="status-caption">${escHtml(statusCaption)}</p>

      <section class="prospect-grid">
        ${(entry.prospect?.cards || []).map(renderCard).join("\n")}
      </section>

      <section class="prospect-note">
        <p>${escHtml(entry.prospect?.note || entry.value)}</p>
        <div class="cta-row">
          ${(entry.prospect?.ctas || []).map((cta) => `<a class="btn${cta.primary ? " primary" : ""}" href="${escAttr(cta.href)}">${escHtml(cta.label)}</a>`).join("")}
        </div>
      </section>

      <nav class="pager">
        ${previous ? `<a href="/prospects/${escAttr(previous.prospect.slug)}">← previous prospect: ${escHtml(previous.name.toLowerCase())}</a>` : "<span>← first prospect</span>"}
        ${next ? `<a href="/prospects/${escAttr(next.prospect.slug)}">next prospect: ${escHtml(next.name.toLowerCase())} →</a>` : "<span>last prospect →</span>"}
      </nav>
    </div>
  </main>
</body>
</html>
`;
}

function renderCard(card) {
  return `<article class="prospect-card"><h2>${escHtml(card.title)}</h2><p>${escHtml(card.intro)}</p><ul>${card.items.map((item) => `<li>${escHtml(item)}</li>`).join("")}</ul></article>`;
}

function renderStatusCard(label, value, subvalue, description) {
  return `<article class="status-card"><div class="label mono">${escHtml(label)}</div><div class="value">${escHtml(value || "—")}</div><div class="subvalue mono">${escHtml(subvalue || "—")}</div><p>${escHtml(description || "")}</p></article>`;
}

function renderCompletionCard(completion) {
  const safeCompletion = Math.min(100, Math.max(0, Number(completion)));
  return `<article class="status-card"><div class="label mono">completion</div><div class="value">${safeCompletion}%</div><div class="status-meter" aria-hidden="true"><span style="width:${safeCompletion}%"></span></div><div class="subvalue mono">finished scope progress</div><p>Completion estimate across public surface, working system parts, and remaining implementation depth.</p></article>`;
}

function formatUsdCompact(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "—";
  if (numeric >= 1000000) return `$${(numeric / 1000000).toFixed(1).replace(/\.0$/, "")}m`;
  if (numeric >= 1000) return `$${Math.round(numeric / 1000)}k`;
  return `$${Math.round(numeric)}`;
}

function escHtmlText(value) {
  return String(value || "");
}

function escAttr(value) {
  return String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

function escHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
