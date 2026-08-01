import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(here, "..");
const robberyPath = path.join(repoRoot, "site", "school", "security", "on-digital-robbery", "index.html");

let html = readFileSync(robberyPath, "utf8");

const assetMarker = '<link rel="stylesheet" href="../interactive.css" />';
if (!html.includes(assetMarker)) {
  html = html.replace(
    "</head>",
    `  ${assetMarker}\n  <link rel="stylesheet" href="./interactive-overrides.css" />\n  <script src="../react-widgets.js" defer></script>\n</head>`,
  );
}

const legacyHeader = /  <header class="topbar">[\s\S]*?  <\/header>\n/;
const enhancedHeader = `  <header class="topbar">\n    <a class="brand" href="../" aria-label="RAGBAZ Security School home"><img src="../../../assets/detcordon-mark.svg" alt="" width="42" height="42" /><span><strong>RAGBAZ</strong><small>On Digital Robbery</small></span></a>\n    <div\n      data-react-widget="top-navigation"\n      data-label="On Digital Robbery navigation"\n      data-primary='[{"label":"Threat model","href":"#threat-landscape"},{"label":"Trust rings","href":"#privilege-rings"},{"label":"Payments","href":"#payment-paradigms"},{"label":"Controls","href":"#defensive-matrix"}]'\n      data-menu='[{"label":"Document tree","href":"#document-tree"},{"label":"Reading settings","href":"#reading-settings"},{"label":"Publication boundary","href":"#removed-material"},{"label":"Security School library","href":"/school/security/"},{"label":"Self-hosted pilot prospect","href":"/school/security/detcordon/self-hosted-pilot"},{"label":"Contact RAGBAZ","href":"mailto:ragbaz@proton.me"}]'\n    ></div>\n  </header>\n\n  <section class="article-reading-settings" id="reading-settings" aria-labelledby="reading-settings-title">\n    <div><p class="eyebrow">LOCAL READER SETTINGS</p><h2 id="reading-settings-title">Adjust the typeset edition.</h2><p>Theme, font, and line measure remain on this device. No private key, decrypted object, or content credential is requested.</p></div>\n    <div class="controls" aria-label="Reading settings">\n      <label>Theme<select id="theme"><option value="detcordon-signal-red">Signal Red</option><option value="ragbaz-gruvbox-slate">Gruvbox Slate</option><option value="tufte-darkgray-mokia">Tufte Darkgray</option><option value="arctic-cipher-blue">Arctic Cipher</option><option value="monastic-oxide">Monastic Oxide</option><option value="phosphor-night-ops">Phosphor Night</option></select></label>\n      <label>Font<select id="font"><option value="literary-serif">Literary Serif</option><option value="variable-sans">Variable Sans</option><option value="technical-mono">Technical Mono</option></select></label>\n      <label>Width<input id="measure" type="range" min="58" max="88" step="2" value="72" /></label>\n    </div>\n  </section>\n`;

if (!html.includes('data-label="On Digital Robbery navigation"')) {
  if (!legacyHeader.test(html)) throw new Error("On Digital Robbery topbar marker not found");
  html = html.replace(legacyHeader, enhancedHeader);
}

if (!html.includes('id="publication-state-explorer"')) {
  const firstContent = '      <section class="content" id="threat-landscape">';
  const stateExplorer = `      <section class="content interactive-boundary" id="publication-state-explorer">\n        <p class="eyebrow">Publication state</p><h2>Understand what this defensive edition exposes—and what it does not.</h2>\n        <p>This interactive state model describes the object-addressable publication architecture. The current release contains readable defensive material inside the VPN boundary and no proof-of-concept payloads, ciphertext, private keys, or unlock interface.</p>\n        <div data-react-widget="publication-states"></div>\n      </section>\n\n`;
  if (!html.includes(firstContent)) throw new Error("On Digital Robbery first content marker not found");
  html = html.replace(firstContent, `${stateExplorer}${firstContent}`);
}

if (!html.includes('id="document-tree"')) {
  html = html.replace('<aside class="tree" aria-label="Document object tree">', '<aside class="tree" id="document-tree" aria-label="Document object tree">');
}

writeFileSync(robberyPath, html);
console.log("security-publications: augmented On Digital Robbery with shared React navigation and state explorer");
