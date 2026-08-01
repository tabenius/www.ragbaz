import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";

const h = React.createElement;
const PILOT_PRICE = 24000;

const money = (value) => new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
}).format(Math.max(0, Number(value) || 0));

const number = (value, digits = 0) => new Intl.NumberFormat("en-US", {
  maximumFractionDigits: digits,
}).format(Number(value) || 0);

function parseJson(value, fallback) {
  try { return JSON.parse(value || ""); } catch { return fallback; }
}

function activateItem(item) {
  if (item.action === "tree") return document.querySelector("#tree-toggle")?.click();
  if (item.action === "settings") return document.querySelector("#settings-toggle")?.click();
  if (item.action === "policy") return document.querySelector("#show-policy")?.click();
  if (item.href?.startsWith("#")) {
    document.querySelector(item.href)?.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  if (item.href) window.location.assign(item.href);
}

function TopNavigation({ primary, menu, label }) {
  const [open, setOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const menuRef = useRef(null);

  useEffect(() => {
    const update = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      setProgress(Math.min(1, window.scrollY / max));
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  useEffect(() => {
    const close = (event) => {
      if (event.key === "Escape") setOpen(false);
      if (event.type === "pointerdown" && menuRef.current && !menuRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener("keydown", close);
    document.addEventListener("pointerdown", close);
    return () => {
      document.removeEventListener("keydown", close);
      document.removeEventListener("pointerdown", close);
    };
  }, []);

  const itemButton = (item, className) => h("button", {
    key: `${item.label}-${item.href || item.action}`,
    type: "button",
    className,
    onClick: () => { setOpen(false); activateItem(item); },
  }, item.label);

  return h(React.Fragment, null,
    h("nav", { className: "rx-primary-nav", "aria-label": label || "Primary navigation" },
      primary.map((item) => itemButton(item, "rx-nav-link")),
    ),
    h("div", { className: "rx-menu-wrap", ref: menuRef },
      h("button", {
        className: "rx-menu-button",
        type: "button",
        "aria-expanded": open,
        "aria-label": "Open more navigation",
        onClick: () => setOpen((value) => !value),
      }, h("span", { "aria-hidden": true }, "☰"), h("span", { className: "rx-menu-label" }, "Menu")),
      open && h("div", { className: "rx-menu-panel", role: "menu" },
        menu.map((item) => itemButton(item, "rx-menu-item")),
      ),
    ),
    h("span", { className: "rx-reading-progress", style: { transform: `scaleX(${progress})` } }),
  );
}

const USE_CASES = [
  { id: "detonation", personas: ["lab", "enterprise"], title: "Controlled detonation", summary: "Run suspicious web-facing workloads in disposable victim environments while evidence leaves the blast radius.", outcome: "Repeatable observation without turning the analyst workstation into the containment boundary." },
  { id: "regression", personas: ["smb", "enterprise"], title: "Security regression lanes", summary: "Replay approved fixtures against releases and compare signals, custody records, and policy changes over time.", outcome: "Make defensive behavior reviewable in CI and release governance." },
  { id: "incident", personas: ["smb", "enterprise"], title: "Incident evidence capture", summary: "Preserve bounded metadata, samples, source identity, and verifiable export bundles during investigations.", outcome: "Reduce the hand-built work between first alert, analyst triage, and retained evidence." },
  { id: "purple", personas: ["lab", "enterprise"], title: "Purple-team exercises", summary: "Give red and blue teams a shared, instrumented environment focused on detection, containment, and evidence quality.", outcome: "Convert adversarial exercises into measurable detector and runbook improvements." },
  { id: "supply", personas: ["smb", "enterprise"], title: "Supply-chain observation", summary: "Open suspect packages, updates, or web components in a bounded environment with explicit provenance.", outcome: "Add a controlled inspection stage before unknown code reaches ordinary infrastructure." },
  { id: "training", personas: ["lab"], title: "Analyst and student labs", summary: "Teach containment assumptions, telemetry quality, and chain of custody without publishing operational exploit instructions.", outcome: "Build defensive intuition while keeping the curriculum anchored in purple-team outcomes." },
  { id: "soc", personas: ["enterprise"], title: "SOC and SIEM integration", summary: "Forward redacted events, preserve tenant/source boundaries, and retain signed bundles for later verification.", outcome: "Fit experimental observation into existing security operations instead of creating a parallel evidence silo." },
  { id: "policy", personas: ["smb", "enterprise"], title: "Policy and trust-boundary validation", summary: "Compare requested configuration with runtime-confirmed posture, ingress identity, retention, and evidence state.", outcome: "Expose the gap between intended protection and effective protection before scale increases." },
];

function UseCaseExplorer() {
  const [persona, setPersona] = useState("all");
  const [active, setActive] = useState(USE_CASES[0].id);
  const visible = USE_CASES.filter((item) => persona === "all" || item.personas.includes(persona));
  const selected = USE_CASES.find((item) => item.id === active) || visible[0];

  return h("div", { className: "rx-use-cases" },
    h("div", { className: "rx-segmented", role: "tablist", "aria-label": "Use-case audience" },
      [["all", "All"], ["smb", "SMB"], ["enterprise", "Larger enterprise"], ["lab", "Security lab"]].map(([id, text]) =>
        h("button", {
          key: id,
          type: "button",
          className: persona === id ? "is-active" : "",
          onClick: () => { setPersona(id); setActive((visible.find((item) => item.personas.includes(id)) || USE_CASES[0]).id); },
        }, text),
      ),
    ),
    h("div", { className: "rx-use-case-grid" },
      h("div", { className: "rx-use-case-list" }, visible.map((item) => h("button", {
        key: item.id,
        type: "button",
        className: active === item.id ? "rx-use-case-card is-active" : "rx-use-case-card",
        onClick: () => setActive(item.id),
      }, h("strong", null, item.title), h("span", null, item.summary)))),
      selected && h("aside", { className: "rx-use-case-detail" },
        h("span", { className: "rx-kicker" }, "PURPLE-TEAM OUTCOME"),
        h("h3", null, selected.title),
        h("p", null, selected.outcome),
        h("div", { className: "rx-boundary-note" }, "The pilot validates defensive workflows and evidence handling. It does not include offensive services or public exploit material."),
      ),
    ),
  );
}

const VALUE_PRESETS = {
  smb: { label: "SMB", analysts: 3, hourly: 95, incidents: 4, hours: 7, platform: 9000 },
  mid: { label: "Mid-market", analysts: 8, hourly: 115, incidents: 10, hours: 10, platform: 32000 },
  enterprise: { label: "Large enterprise", analysts: 20, hourly: 145, incidents: 24, hours: 14, platform: 90000 },
};

function ValueSimulator() {
  const [segment, setSegment] = useState("mid");
  const [model, setModel] = useState(VALUE_PRESETS.mid);

  const updateSegment = (id) => {
    setSegment(id);
    setModel(VALUE_PRESETS[id]);
  };
  const update = (field, value) => setModel((current) => ({ ...current, [field]: Number(value) }));

  const results = useMemo(() => {
    const recoveredHours = model.incidents * 12 * model.hours;
    const analystValue = recoveredHours * model.hourly;
    const gross = analystValue + model.platform;
    const net = gross - PILOT_PRICE;
    const payback = gross > 0 ? PILOT_PRICE / (gross / 12) : 0;
    const capacity = recoveredHours / 1600;
    return { recoveredHours, analystValue, gross, net, payback, capacity };
  }, [model]);

  const scenarios = Object.entries(VALUE_PRESETS).map(([id, preset]) => {
    const gross = preset.incidents * 12 * preset.hours * preset.hourly + preset.platform;
    return { id, label: preset.label, value: gross };
  });
  const maxScenario = Math.max(...scenarios.map((item) => item.value), 1);

  const slider = (field, label, min, max, step, suffix = "") => h("label", { className: "rx-slider", key: field },
    h("span", null, label, h("output", null, `${number(model[field])}${suffix}`)),
    h("input", {
      type: "range", min, max, step, value: model[field],
      onChange: (event) => update(field, event.target.value),
    }),
  );

  return h("div", { className: "rx-value-model" },
    h("div", { className: "rx-segmented", role: "tablist", "aria-label": "Company segment" },
      Object.entries(VALUE_PRESETS).map(([id, preset]) => h("button", {
        key: id,
        type: "button",
        className: segment === id ? "is-active" : "",
        onClick: () => updateSegment(id),
      }, preset.label)),
    ),
    h("div", { className: "rx-model-grid" },
      h("div", { className: "rx-model-controls" },
        slider("analysts", "Analysts using the workflow", 1, 40, 1),
        slider("hourly", "Loaded analyst cost", 50, 250, 5, "/h"),
        slider("incidents", "Investigations or exercises per month", 1, 50, 1),
        slider("hours", "Hours reduced per case", 1, 30, 1),
        slider("platform", "Annual avoided lab / evidence overhead", 0, 180000, 3000),
      ),
      h("div", { className: "rx-model-results" },
        h("div", { className: "rx-value-hero" }, h("span", null, "MODELLED ANNUAL VALUE"), h("strong", null, money(results.gross))),
        h("dl", { className: "rx-metric-grid" },
          h("div", null, h("dt", null, "Pilot proposal"), h("dd", null, money(PILOT_PRICE))),
          h("div", null, h("dt", null, "Modelled net value"), h("dd", null, money(results.net))),
          h("div", null, h("dt", null, "Hours returned"), h("dd", null, number(results.recoveredHours))),
          h("div", null, h("dt", null, "Capacity equivalent"), h("dd", null, `${number(results.capacity, 2)} FTE`)),
          h("div", null, h("dt", null, "Simple payback"), h("dd", null, `${number(results.payback, 1)} months`)),
          h("div", null, h("dt", null, "Analyst-time component"), h("dd", null, money(results.analystValue))),
        ),
      ),
    ),
    h("div", { className: "rx-bar-chart", role: "img", "aria-label": "Illustrative annual customer value by company segment" },
      scenarios.map((item) => h("div", { className: "rx-bar-row", key: item.id },
        h("span", null, item.label),
        h("div", { className: "rx-bar-track" }, h("span", { style: { width: `${Math.max(4, item.value / maxScenario * 100)}%` } })),
        h("strong", null, money(item.value)),
      )),
    ),
    h("p", { className: "rx-disclaimer" }, "Illustrative scenario model, not a benchmark, guarantee, or contractual ROI claim. Replace every assumption with the customer’s measured workload during pilot discovery."),
  );
}

const PROGRESS = [
  { id: "june", label: "June", title: "From research code to pilot-shaped system", points: ["Multi-service Rust workspace, container packaging, and CI publishing", "TOML configuration and deployment tooling", "Web operator dashboard and pilot quickstart", "Firecracker supervisor stabilization and host preflight work"] },
  { id: "july", label: "July", title: "Trust, evidence, and operational boundaries", points: ["Signed evidence bundle contract and offline verifier", "Per-source quotas, retention, tenant/source identity, and one-way archive workflow", "OIDC access profile, SIEM forwarding, reliable event work, and TLS transport", "Warm-pool state machine, security hardening, and expanded attacker-input tests"] },
  { id: "august", label: "August", title: "SaaS-pilot and role-aware operator surface", points: ["Authenticated ingress modes and credentialed Unix datagram path", "Explicit shadow/enforce refusal semantics and pilot configuration", "Tenant lifecycle orchestration and measurable operator SLOs", "Role-aware protected-service, tenant-assurance, and operator dashboards", "Bounded event reads and contained evidence archive generation"] },
];

function ProgressTimeline() {
  const [active, setActive] = useState("august");
  const current = PROGRESS.find((item) => item.id === active) || PROGRESS[0];
  return h("div", { className: "rx-progress" },
    h("div", { className: "rx-timeline-tabs", role: "tablist", "aria-label": "Three-month progress" },
      PROGRESS.map((item, index) => h("button", {
        key: item.id,
        type: "button",
        className: active === item.id ? "is-active" : "",
        onClick: () => setActive(item.id),
      }, h("span", null, `0${index + 1}`), item.label)),
    ),
    h("article", { className: "rx-progress-card" },
      h("span", { className: "rx-kicker" }, `${current.label.toUpperCase()} 2026`),
      h("h3", null, current.title),
      h("ul", null, current.points.map((point) => h("li", { key: point }, point))),
    ),
  );
}

const COMMITS = [
  ["2026-06-30", "768e191", "platform", "Web dashboard crate"],
  ["2026-06-30", "bdd0852", "platform", "TOML configuration support"],
  ["2026-06-30", "2d9b92e", "containment", "Firecracker supervisor stabilization"],
  ["2026-07-13", "22bba94", "evidence", "Evidence bundle schema"],
  ["2026-07-13", "7a651b1", "evidence", "Evidence export command"],
  ["2026-07-13", "91e820d", "operations", "Multi-sandbox source identity"],
  ["2026-07-16", "7817a33", "operations", "Monetization, quotas, and supply-chain hardening"],
  ["2026-07-21", "b14e98d", "evidence", "Offline evidence verifier"],
  ["2026-07-22", "d3c245e", "evidence", "Verified one-way archive push"],
  ["2026-07-24", "abdd6e7", "access", "Dashboard OIDC profile"],
  ["2026-07-25", "65c0213", "operations", "Redacted SIEM forwarding"],
  ["2026-07-25", "5c04efb", "evidence", "Signed custody lineage exports"],
  ["2026-07-26", "7ffe4a9", "access", "TLS reliable-event transport"],
  ["2026-07-26", "1912e26", "access", "TLS sample transport"],
  ["2026-07-26", "8a432fd", "containment", "Warm-pool state machine"],
  ["2026-07-31", "bad83fe", "platform", "Retire vulnerable PEM dependency"],
  ["2026-08-01", "4f8b0b4", "access", "Authenticated ingress and pilot configuration"],
  ["2026-08-01", "d6d9498", "operations", "Tenant lifecycle orchestrator"],
  ["2026-08-01", "4ffce9a", "operations", "Measurable operator SLOs"],
  ["2026-08-01", "42c00ef", "evidence", "Contain evidence archive creation"],
  ["2026-08-01", "6c5723b", "platform", "Role-aware dashboard surfaces"],
].map(([date, sha, category, title]) => ({ date, sha, category, title }));

function GitLogTree() {
  const [category, setCategory] = useState("all");
  const [selected, setSelected] = useState(COMMITS.at(-1).sha);
  const visible = COMMITS.filter((commit) => category === "all" || commit.category === category);
  const chosen = COMMITS.find((commit) => commit.sha === selected) || visible.at(-1);

  return h("div", { className: "rx-git-log" },
    h("div", { className: "rx-segmented rx-git-filter" },
      ["all", "containment", "evidence", "access", "operations", "platform"].map((id) => h("button", {
        key: id,
        type: "button",
        className: category === id ? "is-active" : "",
        onClick: () => setCategory(id),
      }, id)),
    ),
    h("div", { className: "rx-git-grid" },
      h("ol", { className: "rx-commit-tree" }, visible.slice().reverse().map((commit, index) => h("li", { key: commit.sha },
        h("button", {
          type: "button",
          className: selected === commit.sha ? "is-active" : "",
          onClick: () => setSelected(commit.sha),
        },
          h("span", { className: "rx-tree-lines", "aria-hidden": true }, index % 3 === 0 ? "●─┬" : index % 3 === 1 ? "├─●" : "└─●"),
          h("code", null, commit.sha),
          h("span", null, commit.title),
          h("time", null, commit.date),
        ),
      ))),
      chosen && h("aside", { className: "rx-commit-detail" },
        h("span", { className: "rx-kicker" }, chosen.category.toUpperCase()),
        h("h3", null, chosen.title),
        h("p", null, `${chosen.date} · ${chosen.sha}`),
        h("a", { href: `https://github.com/tabenius/BAZ.detcordon/commit/${chosen.sha}`, target: "_blank", rel: "noreferrer" }, "Inspect commit on GitHub ↗"),
        h("p", { className: "rx-disclaimer" }, "Curated diligence tree. The repository remains the authoritative history."),
      ),
    ),
  );
}

function LibraryExplorer() {
  const [manifest, setManifest] = useState(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/school/security/manifest.json", { cache: "no-store", credentials: "same-origin" })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error(`manifest ${response.status}`)))
      .then(setManifest)
      .catch((reason) => setError(String(reason.message || reason)));
  }, []);

  const collections = manifest?.collections || [];
  const normalized = query.trim().toLowerCase();
  const visible = collections.filter((collection) => !normalized || [
    collection.title, collection.subtitle, collection.summary,
    ...(collection.children || []).map((child) => child.title),
  ].join(" ").toLowerCase().includes(normalized));

  return h("div", { className: "rx-library-explorer" },
    h("div", { className: "rx-library-toolbar" },
      h("label", null, h("span", null, "Search defensive collections"), h("input", {
        type: "search", value: query, placeholder: "SIM, evidence, Android, containment…",
        onChange: (event) => setQuery(event.target.value),
      })),
      h("div", { className: "rx-library-counts" },
        h("strong", null, collections.length || "—"), h("span", null, "collections"),
        h("strong", null, collections.reduce((sum, item) => sum + (item.children?.length || 0), 0) || "—"), h("span", null, "addressable child objects"),
      ),
    ),
    error && h("p", { className: "rx-error" }, `Could not load the manifest: ${error}`),
    manifest && h("div", { className: "rx-library-results" }, visible.map((collection) => h("button", {
      key: collection.id,
      type: "button",
      onClick: () => document.querySelector(`#collection-${CSS.escape(collection.id)}`)?.scrollIntoView({ behavior: "smooth", block: "start" }),
    },
      h("span", { className: "rx-status-dot", "aria-hidden": true }),
      h("span", null, h("strong", null, collection.title), h("small", null, collection.subtitle)),
      h("code", null, collection.uri.replace("crypto://ragbaz-security/", "")),
    ))),
  );
}

const PUBLICATION_STATES = [
  { id: "published", title: "Published inside VPN", detail: "Readable after the network gate. This is the only populated state in the current defensive release." },
  { id: "encrypted", title: "Encrypted", detail: "Ciphertext may exist while plaintext remains unavailable. No encrypted objects are published in the current release." },
  { id: "unlockable", title: "Unlockable for current key", detail: "A future reader could recognize an authorized key without persisting private key material in the browser." },
  { id: "unavailable", title: "Unavailable", detail: "Metadata can name an object while withholding its payload from the current reader and release." },
];

function PublicationStates() {
  const [selected, setSelected] = useState("published");
  const current = PUBLICATION_STATES.find((state) => state.id === selected);
  return h("div", { className: "rx-publication-states" },
    h("div", { className: "rx-state-rail" }, PUBLICATION_STATES.map((state) => h("button", {
      key: state.id,
      type: "button",
      className: selected === state.id ? "is-active" : "",
      onClick: () => setSelected(state.id),
    }, h("span", { "aria-hidden": true }), state.title))),
    h("article", { className: "rx-state-detail" },
      h("span", { className: "rx-kicker" }, "OBJECT PUBLICATION STATE"),
      h("h3", null, current.title),
      h("p", null, current.detail),
      h("p", { className: "rx-disclaimer" }, "The state explorer documents the architecture. It does not expose an unlock control or restricted payload."),
    ),
  );
}

const widgets = {
  "top-navigation": (node) => h(TopNavigation, {
    primary: parseJson(node.dataset.primary, []),
    menu: parseJson(node.dataset.menu, []),
    label: node.dataset.label,
  }),
  "use-case-explorer": () => h(UseCaseExplorer),
  "value-simulator": () => h(ValueSimulator),
  "progress-timeline": () => h(ProgressTimeline),
  "git-log-tree": () => h(GitLogTree),
  "library-explorer": () => h(LibraryExplorer),
  "publication-states": () => h(PublicationStates),
};

for (const node of document.querySelectorAll("[data-react-widget]")) {
  const render = widgets[node.dataset.reactWidget];
  if (!render) continue;
  createRoot(node).render(render(node));
}
