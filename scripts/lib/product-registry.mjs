import { publicProducts, readSiteCatalog } from "../../../../metadata/src/site-catalog.mjs";

const TAG_CSS_CLASS = {
  "live": "tag-live",
  "beta": "tag-beta",
  "building": "tag-building",
  "research": "tag-research",
  "active-embryo": "tag-embryo",
  "flagship": "tag-live",
};

export function readProductRegistry() {
  const catalog = readSiteCatalog();
  return {
    ...catalog,
    products: publicProducts(catalog),
  };
}

export function generateCompletionHtml(registry, updatedDate) {
  const navLinks = renderProductNavLinks(registry.products);
  const rows = registry.products.map((product) => {
    const tagClass = TAG_CSS_CLASS[product.tag] || "tag-building";
    const metrics = [
      product.completion !== null ? `<span class="metric mono">${escHtml(`${product.completion}% complete`)}</span>` : "",
      product.currentValueUsd !== null ? `<span class="metric mono">${escHtml(formatUsdCompact(product.currentValueUsd))} current</span>` : "",
      product.finishedValueUsd !== null ? `<span class="metric mono">${escHtml(formatUsdCompact(product.finishedValueUsd))} finished</span>` : "",
    ].filter(Boolean).join("");
    const links = [
      product.links?.docs ? `<a href="${escAttr(product.links.docs)}">docs</a>` : "",
      product.links?.prospect ? `<a href="${escAttr(product.links.prospect)}">prospect</a>` : "",
      product.links?.pricing ? `<a href="${escAttr(product.links.pricing)}">pricing</a>` : "",
    ].filter(Boolean).join('<span class="sep">·</span>');

    return `
          <div class="product-row">
            <div class="product-head">
              <span class="product-name">${escHtml(product.name)}</span>
              <span class="product-tag ${tagClass}">${escHtml(product.tagLabel)}</span>
              ${metrics ? `<div class="product-metrics">${metrics}</div>` : ""}
            </div>
            <span class="product-value">${escHtml(product.value)}</span>
            <div class="product-foot">
              <span class="product-price">${renderPricing(product.pricing)}</span>
              ${links ? `<span class="product-links mono">${links}</span>` : ""}
            </div>
          </div>`;
  }).join("\n");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>ragbaz — product value</title>
  <meta name="description" content="ragbaz product value summary — published studio products with value propositions, pricing, and completion signals." />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="ragbaz — product value" />
  <meta property="og:description" content="A summary of the published product catalog ragbaz ships and the value each line is aiming at." />
  <meta property="og:url" content="https://ragbaz.cc/completion" />
  <meta name="theme-color" content="#0a0908" />
  <link rel="icon" href="./assets/logo-mark.svg" />
  <link rel="stylesheet" href="./colors_and_type.css?v=2" />
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body {
      margin: 0;
      background: var(--bg-0, #0a0908);
      color: var(--fg-2, #d8c29d);
      font-family: "Noto Sans", system-ui, sans-serif;
      font-size: clamp(15px, 0.9rem + 0.2vw, 17px);
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
    }
    .mono { font-family: "Intel One Mono", ui-monospace, monospace; font-variant-numeric: tabular-nums; }
    a { color: var(--orange-1, #f3c46c); text-decoration: none; }
    a:hover { color: var(--orange-3, #ff9900); }

    .wrap { max-width: 1120px; margin: 0 auto; padding: 0 clamp(1rem, 4vw, 2.5rem); }

    header.bar {
      position: sticky; top: 0; z-index: 10;
      background: rgba(16, 16, 16, 0.82); backdrop-filter: blur(8px);
      border-bottom: 1px solid var(--border-2, #2a2a2a);
    }
    .bar .wrap { display: flex; align-items: center; gap: 1rem; height: 56px; }
    .wordmark { display: flex; align-items: center; gap: .6rem; font-family: "Intel One Mono", monospace; font-weight: 600; letter-spacing: .14em; color: var(--fg-1, #f6d7a7); text-transform: uppercase; }
    .bar .wordmark img { height: 39px; width: auto; display: block; }
    footer .wordmark img { height: 22px; width: auto; display: block; }
    .bar nav { margin-left: auto; display: flex; gap: 1.4rem; font-family: "Intel One Mono", monospace; font-size: .82rem; }
    .bar nav a { color: var(--fg-4, #9f9f9f); }
    .bar nav a:hover { color: var(--orange-1, #f3c46c); }
    .bar nav a.active { color: var(--orange-1, #f3c46c); }
    .hm-btn { display: none; background: none; border: 1px solid var(--border-2, #2a2a2a); color: var(--fg-2); font-size: 1.2rem; cursor: pointer; padding: 4px 10px; border-radius: 4px; margin-left: auto; }
    .hm-overlay { position: fixed; top: 0; right: 0; width: min(86vw, 320px); height: 100%; background: var(--bg-1, #0f0f10); border-left: 1px solid var(--border-2, #2a2a2a); z-index: 20; padding: 1.2rem; display: flex; flex-direction: column; gap: .6rem; transform: translateX(100%); transition: transform .2s ease; overflow-y: auto; }
    .hm-overlay.open { transform: translateX(0); }
    .hm-overlay .hm-head { font-family: "Intel One Mono", monospace; font-size: .72rem; text-transform: uppercase; letter-spacing: .1em; color: var(--fg-5, #737373); margin-top: .8rem; }
    .hm-overlay a { font-family: "Intel One Mono", monospace; font-size: .88rem; padding: .2rem 0; }
    .hm-overlay a.sub { padding-left: 1rem; font-size: .8rem; color: var(--fg-4, #9f9f9f); }
    .hm-close { align-self: flex-end; background: none; border: none; color: var(--fg-2); font-size: 1.4rem; cursor: pointer; padding: 0 0 .4rem; }
    .hm-scrim { position: fixed; inset: 0; background: rgba(0,0,0,.5); z-index: 19; opacity: 0; pointer-events: none; transition: opacity .2s ease; }
    .hm-scrim.open { opacity: 1; pointer-events: auto; }

    @media (max-width: 720px) {
      .bar .wrap { height: auto; padding-top: .75rem; padding-bottom: .9rem; }
      .bar nav { display: none; }
      .hm-btn { display: flex; }
    }

    footer { margin-top: clamp(2rem, 5vw, 3rem); border-top: 1px solid var(--border-2, #2a2a2a); }
    footer .wrap { display: flex; flex-wrap: wrap; gap: 1.2rem 2rem; align-items: center; padding-top: 2rem; padding-bottom: 3rem; }
    footer .links { display: flex; flex-wrap: wrap; gap: 1.4rem; font-family: "Intel One Mono", monospace; font-size: .82rem; }
    footer .meta { margin-left: auto; font-family: "Intel One Mono", monospace; font-size: .74rem; color: var(--fg-5, #737373); }
    @media (max-width: 720px) { footer .wrap { align-items: flex-start; } footer .meta { margin-left: 0; width: 100%; } }

    .page-head { padding: clamp(2.5rem, 6vw, 4rem) 0 1.5rem; }
    .page-head h1 { font-family: "Intel One Mono", monospace; font-size: 1.6rem; color: var(--fg-1, #f6d7a7); margin: 0; }
    .page-head p { max-width: 64ch; margin: .6rem 0 0; color: var(--fg-3, #d4c19a); }

    .product-grid { display: grid; gap: .8rem; padding-bottom: clamp(2rem, 5vw, 3rem); }
    .product-row {
      display: grid;
      gap: .8rem;
      background: var(--bg-2, #121212);
      border: 1px solid var(--border-2, #2a2a2a);
      border-radius: 8px;
      padding: 1rem 1.15rem;
    }
    .product-row:hover { border-color: var(--border-warm, #3a2a18); }
    .product-head { display: flex; flex-wrap: wrap; gap: .55rem .7rem; align-items: center; }
    .product-name { font-family: "Intel One Mono", monospace; font-weight: 700; color: var(--orange-1, #f3c46c); }
    .product-tag { font-family: "Intel One Mono", monospace; font-size: .72rem; text-transform: uppercase; letter-spacing: .08em; padding: 2px 8px; border-radius: 4px; }
    .tag-live { background: #16241a; color: var(--green-1, #b8bb26); border: 1px solid #4a6a3a; }
    .tag-beta { background: #1d2416; color: var(--yellow-1, #fabd2f); border: 1px solid #5a5a2a; }
    .tag-building { background: #241816; color: var(--orange-3, #ff9900); border: 1px solid #5a3a1a; }
    .tag-research { background: #16202a; color: var(--blue-1, #7ab8ff); border: 1px solid #2a4a6a; }
    .tag-embryo { background: #1a1624; color: var(--purple-1, #d3869b); border: 1px solid #3a2a5a; }
    .product-metrics { display: flex; flex-wrap: wrap; gap: .45rem; }
    .metric {
      border: 1px solid var(--border-2, #2a2a2a);
      border-radius: 999px;
      padding: .12rem .45rem;
      font-size: .72rem;
      color: var(--fg-4, #9f9f9f);
      background: var(--bg-3, #151515);
    }
    .product-value { color: var(--fg-2, #d8c29d); font-size: .92rem; overflow-wrap: anywhere; }
    .product-foot { display: flex; flex-wrap: wrap; gap: .6rem 1rem; align-items: center; justify-content: space-between; }
    .product-price { font-family: "Intel One Mono", monospace; color: var(--fg-4, #9f9f9f); font-size: .82rem; white-space: nowrap; }
    .product-price strong { color: var(--orange-3, #ff9900); }
    .product-links { display: flex; flex-wrap: wrap; gap: .45rem; color: var(--fg-4, #9f9f9f); font-size: .78rem; }
    .product-links a { color: var(--orange-1, #f3c46c); }
    .product-links .sep { color: var(--fg-5, #737373); }

    @media (max-width: 760px) {
      .product-foot { align-items: flex-start; }
    }
    @media (max-width: 540px) {
      .page-head h1 { font-size: 1.35rem; }
      .product-row { padding: .95rem 1rem; }
    }
  </style>
</head>
<body>
  <header class="bar">
    <div class="wrap">
      <span class="wordmark"><img src="./assets/logo-mark.svg" alt="RAGBAZ" />RAGBAZ</span>
      <nav>
        <a href="/">home</a>
        <a href="/pricing">pricing</a>
        <a href="/completion" class="active">completion</a>
        <a href="/school">school</a>
        <a href="/doc/">docs</a>
        <a href="/konsonans-ai-governance">konsonans ai governance</a>
      </nav>
      <button class="hm-btn mono" onclick="toggleHM()">☰</button>
    </div>
  </header>

  <div class="hm-scrim" id="hm-scrim" onclick="closeHM()"></div>
  <div class="hm-overlay" id="hm-overlay">
    <button class="hm-close" onclick="closeHM()">✕</button>
    <div class="hm-head">navigate</div>
    <a href="/" onclick="closeHM()">home</a>
    <a href="/pricing" onclick="closeHM()">pricing</a>
    <a href="/completion" class="active" onclick="closeHM()">completion</a>
    <a href="/school" onclick="closeHM()">school</a>
    <a href="/doc/" onclick="closeHM()">docs</a>
    <a href="/konsonans-ai-governance" onclick="closeHM()">konsonans ai governance</a>
    <div class="hm-head">product lines</div>
    ${navLinks}
  </div>

  <main>
    <section class="page-head">
      <div class="wrap">
        <h1 class="mono">// product value</h1>
        <p>Published product catalog, pricing signals, and completion/value metadata distributed from <span class="mono" style="color:var(--fg-4)">/metadata/products.json</span>. Internal or unpublished lines are kept out of this public view.</p>
        <p class="mono" style="font-size:.8rem"><a href="/pricing">pricing →</a> &nbsp; <a href="/#products">product lines →</a> &nbsp; <a href="/stats">live stats →</a></p>
      </div>
    </section>

    <section>
      <div class="wrap">
        <div class="product-grid">${rows}
        </div>
      </div>
    </section>
  </main>

  <footer>
    <div class="wrap">
      <span class="wordmark"><img src="./assets/logo-mark.svg" alt="RAGBAZ" />RAGBAZ</span>
      <div class="links">
        <a href="/">home</a>
        <a href="/school">school</a>
        <a href="/doc/">docs</a>
        <a href="/pricing">pricing</a>
        <a href="/completion">completion</a>
        <a href="/glossary">glossary</a>
        <a href="/stats">stats</a>
        <a href="/konsonans-ai-governance">konsonans ai governance</a>
      </div>
      <span class="meta mono">studio · oslo + stockholm · warm-solarized-dark</span>
    </div>
  </footer>
  <div class="wrap last-updated" style="margin-top:2em;text-align:right;color:var(--fg-5);font-family:mono,monospace;font-size:.74rem"><time datetime="${escHtml(updatedDate)}">${escHtml(updatedDate)}</time></div>

<script>
function toggleHM(){ var o=document.getElementById('hm-overlay'),s=document.getElementById('hm-scrim'); o.classList.toggle('open'); s.classList.toggle('open'); }
function closeHM(){ document.getElementById('hm-overlay').classList.remove('open'); document.getElementById('hm-scrim').classList.remove('open'); }
</script>
</body>
</html>`;
}

export function generateProductsJsModule(registry) {
  return `// Generated from /metadata/products.json — do not edit directly.
// Run \`npm run prepare:content\` to regenerate.

export const PRODUCTS = ${JSON.stringify(registry.products, null, 2)};
`;
}

function renderPricing(pricing) {
  if (pricing === "free") return "<strong>free</strong>";
  if (pricing === "—") return "<strong>—</strong>";
  return `<strong>${escHtml(pricing)}</strong>`;
}

function renderProductNavLinks(products) {
  return products.map((product) => {
    const label = product.name.toLowerCase();
    const href = product.links?.site || "/";
    return `<a class="sub" href="${escAttr(href)}" onclick="closeHM()">${escHtml(label)}</a>`;
  }).join("\n    ");
}

function formatUsdCompact(value) {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1).replace(/\\.0$/, "")}m`;
  if (value >= 1000) return `$${Math.round(value / 1000)}k`;
  return `$${Math.round(value)}`;
}

function escHtml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function escAttr(value) {
  return String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}
