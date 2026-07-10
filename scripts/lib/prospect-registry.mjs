import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { readProductRegistry } from "./product-registry.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const siteRoot = path.join(repoRoot, "site", "prospects");

const VALUE_CAPTION = "Internal studio value estimates in USD. Current value is derived from completion percentage and is not booked revenue.";

const PROSPECTS = [
  {
    slug: "ai-governance",
    productSlug: "konsonans-ai-governance",
    order: "01 / governance prospect",
    title: "Konsonans AI Governance",
    stageLabel: "building",
    completion: 61,
    finishedValueUsd: 180000,
    description:
      "Prospect page for the Konsonans AI Governance platform: EU AI Act controls, typed policy gates, tamper-evident audit chains, and human approval flows.",
    heroCopy:
      "A policy-as-code control plane for agentic systems that need traceable decisions, bounded autonomy, and operator hold points under the EU AI Act.",
    chips: ["policy gate", "audit chain", "human approval"],
    cards: [
      {
        title: "What is done",
        intro:
          "The groundwork is no longer abstract positioning. There is a concrete governance surface and a published control language around it.",
        items: [
          "A public governance specification is live with policy DSL examples for human hold points and monetary approval gates.",
          "The core control-plane shape is defined: typed policy gate, audit chain, manifest signer, and operator oversight path.",
          "Canonical docs and site routes are in place so governance material resolves under the main public ragbaz.cc surface.",
        ],
      },
      {
        title: "What is left",
        intro:
          "The next milestone is to move from formal specification and route structure into a fully operational control plane.",
        items: [
          "Ship the live GraphQL control and reporting API that runtime agents can actually call during execution.",
          "Ingest real execution receipts from agent runtimes so approvals, denials, and budget holds become first-class records.",
          "Finish the EU AI Act evidence mapping and export bundles so audits can be produced from the execution trail, not assembled afterward.",
        ],
      },
      {
        title: "Commercial frame",
        intro:
          "The value is operational accountability: each action can be reviewed, signed, delayed, or rejected without rewriting the agent runtime.",
        items: [
          "Target use: financial, compliance, and documentation workflows where bounded autonomy matters.",
          "Pricing signal: €25–250/mo per agent, matching the current product line estimate.",
          "Near-term sale shape: managed governance layer for teams already using AI agents in high-consequence operations.",
        ],
      },
    ],
    note:
      "The product is strongest when it stays close to execution: policy, approval, audit trail, and operator review in one path instead of scattered dashboards.",
    ctas: [
      { label: "Open governance specification", href: "/konsonans-ai-governance", primary: true },
      { label: "Read docs", href: "/doc/products/ai-governance" },
      { label: "Back to ragbaz.cc", href: "/" },
    ],
  },
  {
    slug: "matches",
    productSlug: "matches",
    order: "02 / matches prospect",
    title: "Matches",
    stageLabel: "flagship",
    completion: 78,
    finishedValueUsd: 90000,
    description:
      "Prospect page for Matches: autonomous cinematic combat runtime with deterministic simulation, timeline export, and browser-native authoring.",
    heroCopy:
      "A browser-native studio for deterministic cinematic combat, tactical choreography, and exportable timelines that stay reproducible across runs.",
    chips: ["3d viewport", "dsl editor", "render pipeline"],
    cards: [
      {
        title: "What is done",
        intro:
          "This is already positioned as an actual studio surface rather than a toy concept page.",
        items: [
          "The browser-native simulation/editor path is active with deterministic replay, tactical AI framing, and timeline-oriented authoring.",
          "The product line is clearly articulated around viewport, procedural engine, DSL editor, and exportable state.",
          "Matches is already featured as a flagship public surface with its own prospect page and product entry.",
        ],
      },
      {
        title: "What is left",
        intro:
          "The remaining work is about strengthening output quality and production workflow around the simulation core.",
        items: [
          "Improve render/export automation so authored sequences move cleanly into offline production workflows.",
          "Broaden scenario authoring and content packaging so the system supports more than tightly curated demonstrations.",
          "Keep tactical AI inspectable as behavior depth increases, instead of letting complexity hide the simulation state.",
        ],
      },
      {
        title: "Commercial frame",
        intro:
          "Even as a free/open surface, this is a serious studio asset: it demonstrates a deep interactive runtime and a dense work-focused UI.",
        items: [
          "Current public posture: free / open showcase with strong studio-signaling value.",
          "Primary use: choreography, simulation reviews, browser-based authoring, and machinima-style production experiments.",
          "Finished-value estimate assumes stronger export, content tooling, and repeatable production use rather than direct consumer monetization.",
        ],
      },
    ],
    note:
      "Matches carries value as both a product candidate and a proof of engineering range: deterministic runtime, dense editing surface, and tangible output.",
    ctas: [
      { label: "Open product line", href: "/#p-matches", primary: true },
      { label: "View source on GitHub", href: "https://github.com/tabenius/matches" },
      { label: "Back to ragbaz.cc", href: "/" },
    ],
  },
  {
    slug: "articulate",
    productSlug: "articulate",
    order: "03 / articulate prospect",
    title: "Articulate",
    stageLabel: "live",
    completion: 86,
    finishedValueUsd: 320000,
    description:
      "Prospect page for Articulate: hardened headless WordPress, private authoring origin, storefront delivery, provisioning, and DNS automation.",
    heroCopy:
      "A hardened commerce and CMS stack that keeps WordPress private, places the public surface behind controlled runtimes, and automates the surrounding delivery path.",
    chips: ["gatekeeper", "storefront", "tenant provisioner"],
    cards: [
      {
        title: "What is done",
        intro:
          "Articulate already has the shape of a managed platform rather than a one-off WordPress hardening note.",
        items: [
          "The core product line is defined across gatekeeper, storefront, provisioner, GraphQL edge, and associated delivery surfaces.",
          "Public pricing, product framing, and Cloudflare-fronted site delivery are live and coherent under the main ragbaz.cc surface.",
          "The value proposition is already concrete: WordPress stays private while the public runtime, routing, and operational perimeter stay controlled.",
        ],
      },
      {
        title: "What is left",
        intro:
          "The remaining work is mainly platform hardening and operational polish around tenancy and publishing.",
        items: [
          "Tighten self-serve tenant onboarding, billing transitions, and production provisioning reliability.",
          "Strengthen publish, cache, rollback, and invalidation flows so content operations stay predictable under load.",
          "Complete the per-tenant operational guardrails across mail, runtime policy, and support workflows.",
        ],
      },
      {
        title: "Commercial frame",
        intro:
          "This is the clearest direct-revenue surface in the current studio lineup: managed tenants, recurring service posture, and obvious customer pain.",
        items: [
          "Pricing signal: €0–499/mo per tenant with room for higher managed/compliance-sensitive tiers.",
          "Best fit: organizations that still want WordPress as a content plane but do not want it as their public exposure point.",
          "Finished-value estimate assumes a hardened managed platform with tenant lifecycle, provisioning, and storefront delivery working as one system.",
        ],
      },
    ],
    note:
      "Articulate is close enough to operational shape that the remaining value is mostly in reliability, tenant ergonomics, and sharper production workflows.",
    ctas: [
      { label: "Open product line", href: "/#p-articulate", primary: true },
      { label: "See pricing", href: "/pricing" },
      { label: "Read docs", href: "/doc/" },
    ],
  },
  {
    slug: "mailroute",
    productSlug: "mailroute",
    order: "04 / mailroute prospect",
    title: "Mailroute",
    stageLabel: "beta",
    completion: 74,
    finishedValueUsd: 160000,
    description:
      "Prospect page for Mailroute: rule-driven mail inspection, quarantine, audited rule edits, and signed event hooks.",
    heroCopy:
      "A mail stream guard that treats inbox delivery as an auditable rules engine, not a black box: quarantine, review, and signed events live in the same path.",
    chips: ["mail security", "quarantine", "audit trail"],
    cards: [
      {
        title: "What is done",
        intro:
          "Mailroute is already framed as a concrete operator tool, not a vague filtering promise.",
        items: [
          "The rule-driven inspection model is defined across IMAP/SMTP handling, quarantine buckets, and signed downstream event flow.",
          "Audited propose/apply/revert rule editing is part of the product shape, which is a real differentiator versus opaque hosted filtering.",
          "The public product line, docs entry points, and surrounding mail-stack work establish a credible operational direction.",
        ],
      },
      {
        title: "What is left",
        intro:
          "What remains is deeper execution hardening around review workflow and message-path reliability.",
        items: [
          "Complete the stronger SMTP intercept and delivery-control path so policy can sit earlier in the mail flow.",
          "Improve the operator review surface around quarantine decisions, exceptions, and false-positive handling.",
          "Tie message handling more directly into the broader governance and audit infrastructure so rule changes and outcomes share one evidence model.",
        ],
      },
      {
        title: "Commercial frame",
        intro:
          "Mailroute sells on visibility and operator control: the ability to explain what happened to a message and why.",
        items: [
          "Pricing signal: €49–199/mo per domain, with room for managed review and compliance-sensitive tiers.",
          "Best fit: smaller teams and controlled environments where generic hosted filtering is either too opaque or too blunt.",
          "Finished-value estimate assumes hardened policy lanes, clear review UX, and credible downstream event integrations.",
        ],
      },
    ],
    note:
      "The strongest version of Mailroute is not just stricter filtering. It is a mail control surface where review, evidence, and policy change history are all inspectable.",
    ctas: [
      { label: "Open product line", href: "/#p-mailroute", primary: true },
      { label: "Read docs", href: "/doc/" },
      { label: "Back to ragbaz.cc", href: "/" },
    ],
  },
  {
    slug: "detcordon",
    productSlug: "detcordon",
    order: "05 / detcordon prospect",
    title: "DetCordon",
    stageLabel: "research",
    completion: 42,
    finishedValueUsd: 210000,
    description:
      "Prospect page for DetCordon: containment-first hostile content observation, isolated sandboxes, and structured I/O evidence.",
    heroCopy:
      "Containment-first observation for hostile web payloads: disposable sandboxes, isolated network posture, and structured capture of what the payload actually did.",
    chips: ["sandbox", "recorder", "ioc extraction"],
    cards: [
      {
        title: "What is done",
        intro:
          "The key architectural direction is already clear, which matters more here than pretending the product is later-stage than it is.",
        items: [
          "The system is decomposed into sandbox, recorder, analyzer, and feeder roles instead of a vague single black box.",
          "The public positioning is specific about containment-first execution, I/O capture, and structured evidence rather than generic malware analysis talk.",
          "DetCordon already sits in the studio lineup as a distinct security product with a defined investigative posture.",
        ],
      },
      {
        title: "What is left",
        intro:
          "Most of the value is still ahead because the hard part is turning the architecture into a dependable operator tool.",
        items: [
          "Finish repeatable runtime packaging for disposable browser and headless execution lanes.",
          "Refine the analyst workflow between detonation, evidence packaging, and downstream report/export steps.",
          "Stabilize indicator taxonomy and report structure so hostile runs produce output another analyst can actually reuse.",
        ],
      },
      {
        title: "Commercial frame",
        intro:
          "DetCordon has a strong eventual value ceiling because analysts will pay for safer observation and better evidence handling when the workflow is credible.",
        items: [
          "Pricing signal: €99–399/mo per node based on containment capacity and managed analysis posture.",
          "Best fit: incident-response teams, security consultancies, and internal security groups working with unknown payloads.",
          "Finished-value estimate assumes repeatable runtime packaging, analyst workflow polish, and export-grade evidence bundles.",
        ],
      },
    ],
    note:
      "DetCordon should stay honest about maturity: the concept is strong, but the next leap is making the evidence workflow solid enough that analysts trust it in real cases.",
    ctas: [
      { label: "Open product line", href: "/#p-detcordon", primary: true },
      { label: "Open forensics school", href: "/school/forensics" },
      { label: "Read docs", href: "/doc/" },
    ],
  },
  {
    slug: "school-topics",
    order: "06 / school topics prospect",
    title: "RAGBAZ School Topics",
    stageLabel: "live",
    completion: 58,
    finishedValueUsd: 75000,
    description:
      "Prospect page for the RAGBAZ school topics: cellular trust and Android compromise-assessment forensics.",
    heroCopy:
      "A field-school surface with active modules in cellular trust and Android compromise assessment, built to stay close to product and operational research rather than drifting into generic courseware.",
    chips: ["cellular", "forensics", "teacher manual"],
    cards: [
      {
        title: "What is done",
        intro:
          "The school is already more than a placeholder: there is a clear route structure and two substantial module tracks.",
        items: [
          "The `/school` overview is live and connected into the main site navigation instead of sitting as an orphaned subsection.",
          "Cellular and forensics modules are both published, with direct page routes and operator-oriented material.",
          "The school is framed as a practical reference layer that stays connected to product and research work rather than separate educational branding.",
        ],
      },
      {
        title: "What is left",
        intro:
          "The next gains come from breadth, sequencing, and stronger learning structure around the already-live material.",
        items: [
          "Add more modules and supporting tracks below `/school` so the overview grows into a real index rather than a two-item hub.",
          "Introduce clearer exercise flow, progression signals, and module-to-module guidance where it helps repeated use.",
          "Cross-link school material more tightly with docs, product surfaces, and investigative workflows so the knowledge stays operational.",
        ],
      },
      {
        title: "Commercial frame",
        intro:
          "This is best treated as a knowledge asset and trust surface first, with indirect product value and selective premium potential later.",
        items: [
          "Current public posture: open reference material with strong credibility value for the wider studio.",
          "Best fit: practitioners, defenders, and technically serious readers working on devices and networks they control.",
          "Finished-value estimate assumes more modules, stronger curriculum structure, and tighter linkage to product/documentation surfaces.",
        ],
      },
    ],
    note:
      "The school is most useful when it behaves like an operational reference library with teaching structure, not a detached marketing microsite.",
    ctas: [
      { label: "Open school overview", href: "/school", primary: true },
      { label: "Open cellular", href: "/school/cellular" },
      { label: "Open forensics", href: "/school/forensics" },
    ],
  },
  {
    slug: "baz-signal-stack",
    productSlug: "baz-signal-stack",
    order: "07 / baz trade signal stack prospect",
    title: "BAZ Trade Signal Stack",
    stageLabel: "active embryo",
    completion: 47,
    finishedValueUsd: 260000,
    description:
      "Prospect page for the BAZ Trade Signal Stack: glither.hft, Palantir orchestration, and Luna notebook surfaces.",
    heroCopy:
      "A three-part systematic trading toolkit: glither.hft for strategy compilation, Palantir for orchestration and enrichment, and Luna for notebook-grade browser inspection.",
    chips: ["compiler", "orchestration", "notebook widgets"],
    cards: [
      {
        title: "What is done",
        intro:
          "The stack already has a real conceptual split instead of a single overloaded prototype bucket.",
        items: [
          "baz.hft is identified as the dialect layer around executable strategy artifacts and audit-friendly monetary planning receipts.",
          "Palantir is established as the Rust orchestration and enrichment surface rather than leaving stream handling implicit.",
          "Luna is positioned as the browser notebook and charting layer, giving the stack a concrete operator-facing inspection surface.",
        ],
      },
      {
        title: "What is left",
        intro:
          "The largest remaining work is compiler/runtime maturity and keeping browser and backend execution in parity.",
        items: [
          "Finish dialect semantics around baz.hft and glither.hft so strategies become stable, reviewable, and testable artifacts.",
          "Extend the WASM bridge so web applications can execute or inspect the same compiled parts the Pharo/runtime side uses.",
          "Harden live data adapters, signal transport, and notebook widgets so the operator surface becomes more than an architecture sketch.",
        ],
      },
      {
        title: "Commercial frame",
        intro:
          "This has high eventual value because it joins language, execution, audit receipts, and operator notebook into one traceable lane.",
        items: [
          "Current public posture: active embryo and research-heavy stack rather than ready sellable product.",
          "Best fit: teams that want executable strategy artifacts with auditability, not just disconnected notebooks and charts.",
          "Finished-value estimate assumes compiler maturity, live stream integration, and a browser/runtime bridge strong enough for daily operator use.",
        ],
      },
    ],
    note:
      "The value here is not just charting or indicators. It is the continuity from strategy language to execution receipt to operator notebook, with monetary planning visible the whole way through.",
    ctas: [
      { label: "Read architecture notes", href: "/doc/experiments/baz-architecture", primary: true },
      { label: "Back to ragbaz.cc", href: "/" },
    ],
  },
];

export function generateProspectPages() {
  const registry = readProductRegistry();
  const products = new Map(registry.products.map((product) => [product.slug, product]));

  for (const [index, prospect] of PROSPECTS.entries()) {
    const product = prospect.productSlug ? products.get(prospect.productSlug) || null : null;
    const html = renderProspectPage({ prospect, product, index, total: PROSPECTS.length });
    writeFileSync(path.join(siteRoot, `${prospect.slug}.html`), html, "utf8");
  }
}

function renderProspectPage({ prospect, product, index, total }) {
  const previous = index > 0 ? PROSPECTS[index - 1] : null;
  const next = index < total - 1 ? PROSPECTS[index + 1] : null;
  const currentValueUsd = roundValue((prospect.finishedValueUsd * prospect.completion) / 100);
  const valueSummary = product?.value || prospect.note;
  const pricing = product?.pricing || "internal value only";
  const revenue = product?.revenue || "internal";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escHtml(prospect.title)} — prospect</title>
  <meta name="description" content="${escHtml(prospect.description)}" />
  <link rel="icon" href="/assets/logo-mark.svg" />
  <link rel="stylesheet" href="/colors_and_type.css?v=2" />
  <link rel="stylesheet" href="/prospects/prospect.css" />
</head>
<body>
  <main class="prospect-shell">
    <div class="wrap">
      <section class="prospect-head">
        <div class="kicker mono">${escHtml(prospect.order)}</div>
        <h1 class="hero-title">${escHtml(prospect.title)}</h1>
        <p class="hero-copy">${escHtml(prospect.heroCopy)}</p>
        <div class="hero-chips">${prospect.chips.map((chip) => `<span class="chip mono">${escHtml(chip)}</span>`).join("")}</div>
      </section>

      <section class="status-grid" aria-label="project status">
        ${renderStatusCard("status", prospect.stageLabel, `${prospect.stageLabel} lane`, valueSummary)}
        ${renderCompletionCard(prospect.completion)}
        ${renderStatusCard("current value", formatUsdCompact(currentValueUsd), "derived from current completion", "Estimated present studio asset value at the current scope and maturity level.")}
        ${renderStatusCard("finished estimate", formatUsdCompact(prospect.finishedValueUsd), `pricing signal ${escHtmlText(pricing)}`, `Target studio asset value at the planned finished scope. Revenue status: ${escHtmlText(revenue)}.`)}
      </section>
      <p class="status-caption">${escHtml(VALUE_CAPTION)}</p>

      <section class="prospect-grid">
        ${prospect.cards.map(renderCard).join("\n")}
      </section>

      <section class="prospect-note">
        <p>${escHtml(prospect.note)}</p>
        <div class="cta-row">
          ${prospect.ctas.map((cta) => `<a class="btn${cta.primary ? " primary" : ""}" href="${escAttr(cta.href)}">${escHtml(cta.label)}</a>`).join("")}
        </div>
      </section>

      <nav class="pager">
        ${previous ? `<a href="/prospects/${escAttr(previous.slug)}">← previous prospect: ${escHtml(previous.title.toLowerCase())}</a>` : "<span>← first prospect</span>"}
        ${next ? `<a href="/prospects/${escAttr(next.slug)}">next prospect: ${escHtml(next.title.toLowerCase())} →</a>` : "<span>last prospect →</span>"}
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
  return `<article class="status-card"><div class="label mono">${escHtml(label)}</div><div class="value">${escHtml(value)}</div><div class="subvalue mono">${escHtml(subvalue)}</div><p>${escHtml(description)}</p></article>`;
}

function renderCompletionCard(completion) {
  return `<article class="status-card"><div class="label mono">completion</div><div class="value">${completion}%</div><div class="status-meter" aria-hidden="true"><span style="width:${completion}%"></span></div><div class="subvalue mono">finished scope progress</div><p>Completion estimate across public surface, working system parts, and remaining implementation depth.</p></article>`;
}

function roundValue(value) {
  return Math.round(value / 1000) * 1000;
}

function formatUsdCompact(value) {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1).replace(/\.0$/, "")}m`;
  if (value >= 1000) return `$${Math.round(value / 1000)}k`;
  return `$${Math.round(value)}`;
}

function escHtmlText(value) {
  return String(value || "");
}

function escAttr(value) {
  return String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

function escHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
