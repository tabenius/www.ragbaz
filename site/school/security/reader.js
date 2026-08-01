const STORAGE = {
  theme: "ragbaz.security.theme",
  font: "ragbaz.security.font",
  width: "ragbaz.security.readerWidth",
  reduced: "ragbaz.security.reducedEffects",
  treeState: "ragbaz.security.treeState"
};

const root = document.documentElement;
const body = document.body;
const tree = document.querySelector("#object-tree");
const settings = document.querySelector("#reader-settings");
const scrim = document.querySelector("#scrim");
const treeNav = document.querySelector("#tree-nav");
const collectionGrid = document.querySelector("#collection-grid");
const themeSelect = document.querySelector("#theme-select");
const fontSelect = document.querySelector("#font-select");
const widthRange = document.querySelector("#width-range");
const widthOutput = document.querySelector("#width-output");
const reducedEffects = document.querySelector("#reduced-effects");

let manifest = null;
let activeDrawer = null;

function safeStorageGet(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}

function safeStorageSet(key, value) {
  try { localStorage.setItem(key, value); } catch { /* settings remain ephemeral */ }
}

function safeStorageRemove(key) {
  try { localStorage.removeItem(key); } catch { /* no-op */ }
}

function applySettings() {
  const theme = safeStorageGet(STORAGE.theme) || "detcordon-signal-red";
  const font = safeStorageGet(STORAGE.font) || "variable-sans";
  const width = safeStorageGet(STORAGE.width) || "72";
  const reduced = safeStorageGet(STORAGE.reduced) === "true";

  root.dataset.theme = theme;
  root.dataset.font = font;
  root.style.setProperty("--reader-width", `${width}ch`);
  body.classList.toggle("reduced-effects", reduced);

  if (themeSelect) themeSelect.value = theme;
  if (fontSelect) fontSelect.value = font;
  if (widthRange) widthRange.value = width;
  if (widthOutput) widthOutput.value = `${width}ch`;
  if (reducedEffects) reducedEffects.checked = reduced;
}

function openDrawer(name) {
  closeDrawers();
  activeDrawer = name;
  const panel = name === "tree" ? tree : settings;
  panel.classList.add("is-open");
  panel.setAttribute("aria-hidden", "false");
  scrim.hidden = false;
  requestAnimationFrame(() => panel.querySelector("button, a, select, input")?.focus());
  document.querySelector(`#${name}-toggle`)?.setAttribute("aria-expanded", "true");
}

function closeDrawers() {
  for (const [name, panel] of [["tree", tree], ["settings", settings]]) {
    panel.classList.remove("is-open");
    panel.setAttribute("aria-hidden", "true");
    document.querySelector(`#${name}-toggle`)?.setAttribute("aria-expanded", "false");
  }
  scrim.hidden = true;
  activeDrawer = null;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderThemes() {
  themeSelect.replaceChildren();
  for (const theme of manifest.themes) {
    const option = document.createElement("option");
    option.value = theme.id;
    option.textContent = theme.label;
    themeSelect.append(option);
  }
  applySettings();
}

function renderCollections() {
  collectionGrid.replaceChildren();

  for (const collection of manifest.collections) {
    const card = document.createElement("article");
    card.className = "collection-card";
    card.id = `collection-${collection.id}`;
    card.dataset.classification = collection.classification;

    const children = collection.children
      .map(child => `<li>${escapeHtml(child.title)} <small>· ${escapeHtml(child.classification)}</small></li>`)
      .join("");

    card.innerHTML = `
      <div class="card-top">
        <span class="status-pill">${escapeHtml(collection.status)}</span>
        <span class="status-pill">${escapeHtml(collection.classification)}</span>
      </div>
      <h3>${escapeHtml(collection.title)}</h3>
      <p class="card-subtitle">${escapeHtml(collection.subtitle)}</p>
      <p class="card-summary">${escapeHtml(collection.summary)}</p>
      <p class="object-uri">${escapeHtml(collection.uri)}</p>
      <ul class="child-list">${children}</ul>
      <div class="card-actions"><a class="go-link" href="${escapeHtml(collection.href)}">Open collection →</a></div>
    `;

    collectionGrid.append(card);
  }
}

function readTreeState() {
  try { return JSON.parse(safeStorageGet(STORAGE.treeState) || "{}"); }
  catch { return {}; }
}

function writeTreeState() {
  const state = {};
  treeNav.querySelectorAll("details.tree-group").forEach(group => {
    state[group.dataset.id] = group.open;
  });
  safeStorageSet(STORAGE.treeState, JSON.stringify(state));
}

function renderTree() {
  treeNav.replaceChildren();
  const saved = readTreeState();

  for (const collection of manifest.collections) {
    const group = document.createElement("details");
    group.className = "tree-group";
    group.dataset.id = collection.id;
    group.open = saved[collection.id] ?? true;

    const summary = document.createElement("summary");
    summary.textContent = collection.title;
    group.append(summary);

    const children = document.createElement("div");
    children.className = "tree-children";

    const collectionButton = document.createElement("button");
    collectionButton.className = "tree-link";
    collectionButton.type = "button";
    collectionButton.dataset.target = `collection-${collection.id}`;
    collectionButton.textContent = `Go to ${collection.title}`;
    children.append(collectionButton);

    for (const child of collection.children) {
      const childRow = document.createElement("span");
      childRow.className = "tree-child";
      childRow.textContent = child.title;
      children.append(childRow);
    }

    group.append(children);
    group.addEventListener("toggle", writeTreeState);
    treeNav.append(group);
  }
}

function scrollToTarget(id) {
  const target = document.getElementById(id);
  if (!target) return;
  closeDrawers();
  target.scrollIntoView({ behavior: body.classList.contains("reduced-effects") ? "auto" : "smooth", block: "start" });
  target.animate?.(
    [{ outlineColor: "transparent" }, { outlineColor: "var(--accent)" }, { outlineColor: "transparent" }],
    { duration: 900, easing: "ease-out" }
  );
}

function bindEvents() {
  document.querySelector("#tree-toggle")?.addEventListener("click", () => openDrawer("tree"));
  document.querySelector("#tree-edge-tab")?.addEventListener("click", () => openDrawer("tree"));
  document.querySelector("#tree-close")?.addEventListener("click", closeDrawers);
  document.querySelector("#settings-toggle")?.addEventListener("click", () => openDrawer("settings"));
  document.querySelector("#settings-close")?.addEventListener("click", closeDrawers);
  scrim.addEventListener("click", closeDrawers);

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && activeDrawer) closeDrawers();
  });

  document.querySelector("#show-policy")?.addEventListener("click", () => {
    const note = document.querySelector("#policy-note");
    note.hidden = false;
    note.scrollIntoView({ behavior: body.classList.contains("reduced-effects") ? "auto" : "smooth", block: "center" });
  });
  document.querySelector(".close-note")?.addEventListener("click", () => {
    document.querySelector("#policy-note").hidden = true;
  });

  treeNav.addEventListener("click", event => {
    const control = event.target.closest("[data-target]");
    if (control) scrollToTarget(control.dataset.target);
  });

  themeSelect.addEventListener("change", () => {
    root.dataset.theme = themeSelect.value;
    safeStorageSet(STORAGE.theme, themeSelect.value);
  });
  fontSelect.addEventListener("change", () => {
    root.dataset.font = fontSelect.value;
    safeStorageSet(STORAGE.font, fontSelect.value);
  });
  widthRange.addEventListener("input", () => {
    root.style.setProperty("--reader-width", `${widthRange.value}ch`);
    widthOutput.value = `${widthRange.value}ch`;
    safeStorageSet(STORAGE.width, widthRange.value);
  });
  reducedEffects.addEventListener("change", () => {
    body.classList.toggle("reduced-effects", reducedEffects.checked);
    safeStorageSet(STORAGE.reduced, String(reducedEffects.checked));
  });
  document.querySelector("#settings-reset")?.addEventListener("click", () => {
    Object.values(STORAGE).forEach(safeStorageRemove);
    applySettings();
    renderTree();
  });
}

function setupActiveNavigation() {
  if (!("IntersectionObserver" in window)) return;
  const buttons = [...treeNav.querySelectorAll("[data-target]")];
  const byTarget = new Map(buttons.map(button => [button.dataset.target, button]));
  const targets = [...byTarget.keys()].map(id => document.getElementById(id)).filter(Boolean);

  const observer = new IntersectionObserver(entries => {
    const visible = entries
      .filter(entry => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    buttons.forEach(button => button.classList.toggle("is-active", button.dataset.target === visible.target.id));
  }, { rootMargin: "-20% 0px -62% 0px", threshold: [0.05, 0.25, 0.5] });

  targets.forEach(target => observer.observe(target));
}

async function init() {
  applySettings();
  bindEvents();

  try {
    const response = await fetch("./manifest.json", { cache: "no-store", credentials: "same-origin" });
    if (!response.ok) throw new Error(`manifest request failed with ${response.status}`);
    manifest = await response.json();

    renderThemes();
    renderCollections();
    renderTree();
    setupActiveNavigation();
  } catch (error) {
    collectionGrid.innerHTML = `<div class="loading-card">Could not load the local object manifest: ${escapeHtml(error.message)}</div>`;
  }
}

init();
