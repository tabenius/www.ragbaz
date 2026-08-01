import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(here, "..");
const siteRoot = path.join(repoRoot, "site");
const embeddedDocsRoot = path.join(repoRoot, "embedded-docs");
const outputRoot = path.join(repoRoot, "dist", "security-school-private");

const REQUIRED_SOURCES = [
  "school/security/index.html",
  "school/security/manifest.json",
  "school/security/detcordon/self-hosted-pilot/index.html",
  "school/security/on-digital-robbery/index.html",
  "school/cellular/index.html",
];

const OPTIONAL_SITE_PATHS = [
  "assets",
  "school/security",
  "school/cellular",
  "prospects/detcordon.html",
  "prospects/detcordon",
  "doc/products/detcordon.html",
  "doc/products/detcordon",
];

const OPTIONAL_ROOT_ASSET_EXTENSIONS = new Set([
  ".css",
  ".js",
  ".json",
  ".svg",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".woff2",
]);

function copyPath(source, target) {
  if (!existsSync(source)) return false;
  mkdirSync(path.dirname(target), { recursive: true });
  cpSync(source, target, { recursive: true });
  return true;
}

function assertRequiredSources() {
  const missing = REQUIRED_SOURCES.filter((relativePath) => !existsSync(path.join(siteRoot, relativePath)));
  if (missing.length) {
    throw new Error(`Private-origin bundle is missing required source paths:\n- ${missing.join("\n- ")}`);
  }
}

function copyRootAssets() {
  for (const entry of readdirSync(siteRoot, { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    const extension = path.extname(entry.name).toLowerCase();
    if (!OPTIONAL_ROOT_ASSET_EXTENSIONS.has(extension)) continue;
    copyPath(path.join(siteRoot, entry.name), path.join(outputRoot, entry.name));
  }
}

function copyEmbeddedDetCordonDocs() {
  if (!existsSync(embeddedDocsRoot)) return;
  const candidates = [
    "products/detcordon",
    "products/detcordon.html",
  ];
  for (const relativePath of candidates) {
    copyPath(
      path.join(embeddedDocsRoot, relativePath),
      path.join(outputRoot, "doc", relativePath),
    );
  }
}

function rejectBuildOnlySources(directory) {
  if (!existsSync(directory)) return;
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      rejectBuildOnlySources(absolutePath);
      continue;
    }
    if (entry.name.endsWith(".entry.js")) {
      throw new Error(`Build-only browser source escaped into the private bundle: ${absolutePath}`);
    }
  }
}

function writeOriginMetadata() {
  const metadata = {
    publication: "RAGBAZ Security School",
    transport: "tailscale-serve",
    originNode: {
      name: "konsonans",
      localBackend: "http://127.0.0.1:8788",
      addressSource: "host-local private-origin.env",
    },
    approvedReaderNodes: ["mo", "quux1tab"],
    protectedPrefixes: [
      "/school/security",
      "/school/cellular",
      "/prospects/detcordon",
      "/doc/products/detcordon",
    ],
  };
  writeFileSync(
    path.join(outputRoot, "_private-origin.json"),
    `${JSON.stringify(metadata, null, 2)}\n`,
  );
}

function writePrivateRoot() {
  writeFileSync(
    path.join(outputRoot, "index.html"),
    `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="robots" content="noindex,nofollow,noarchive,nosnippet" />
  <meta http-equiv="refresh" content="0;url=/school/security/" />
  <title>RAGBAZ Security School</title>
</head>
<body><p><a href="/school/security/">Open RAGBAZ Security School</a></p></body>
</html>\n`,
  );
  writeFileSync(
    path.join(outputRoot, "404.html"),
    `<!doctype html><meta charset="utf-8"><meta name="robots" content="noindex"><title>Not Found</title><h1>Not Found</h1>\n`,
  );
}

assertRequiredSources();
rmSync(outputRoot, { recursive: true, force: true });
mkdirSync(outputRoot, { recursive: true });

let copied = 0;
for (const relativePath of OPTIONAL_SITE_PATHS) {
  const sourcePath = path.join(siteRoot, relativePath);
  const targetPath = path.join(outputRoot, relativePath);
  if (copyPath(sourcePath, targetPath)) copied += 1;
}
copyRootAssets();
copyEmbeddedDetCordonDocs();
writeOriginMetadata();
writePrivateRoot();
rejectBuildOnlySources(outputRoot);

const totalBytes = (() => {
  let bytes = 0;
  const stack = [outputRoot];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const absolutePath = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(absolutePath);
      else bytes += statSync(absolutePath).size;
    }
  }
  return bytes;
})();

console.log(
  `security-private-origin: copied ${copied} protected source path(s) into ${outputRoot} (${Math.round(totalBytes / 1024)} KiB)`,
);
