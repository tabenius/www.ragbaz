// Generated from /products.json — do not edit directly.
// Run `npm run prepare:content` to regenerate.

export const PRODUCTS = [
  {
    "slug": "konsonans-ai-governance",
    "name": "Konsonans AI Governance",
    "tag": "building",
    "tagLabel": "building",
    "short": "Policy-as-code control plane for AI agent governance under the EU AI Act.",
    "value": "Policy-as-code control plane for AI agents — typed policy gate, tamper-evident SHA-256 audit chain, human-in-the-loop approvals with SLA timeouts, Ed25519 manifest signing.",
    "pricing": "€25–250/mo per agent",
    "revenue": "pre-revenue",
    "repo": "products/kagp",
    "links": {
      "site": "/#p-governance",
      "docs": "https://doc.ragbaz.cc/docs/products/ai-governance"
    },
    "components": [
      "mcp ingress",
      "policy gate",
      "audit chain",
      "human oversight",
      "manifest signer",
      "identity + rbac"
    ]
  },
  {
    "slug": "articulate",
    "name": "Articulate",
    "tag": "live",
    "tagLabel": "live",
    "short": "Hardened headless WordPress with Rust gateway, Next.js storefront, and multi-tenant provisioning.",
    "value": "Hardened headless WordPress — Rust gateway, WASM image hardening, private origin, Next.js storefront, multi-tenant provisioning, DNS automation, GraphQL edge federation.",
    "pricing": "€0–499/mo per tenant",
    "revenue": "live",
    "repo": "products/articulate",
    "links": {
      "site": "/#p-articulate",
      "docs": "https://doc.ragbaz.cc",
      "pricing": "/pricing"
    },
    "components": [
      "gatekeeper",
      "storefront",
      "provisioner",
      "graphql edge",
      "mailstack"
    ]
  },
  {
    "slug": "mailroute",
    "name": "MailRoute",
    "tag": "beta",
    "tagLabel": "beta",
    "short": "IMAP mail-stream guard with hot-reloadable rules, quarantine, and audited rule edits.",
    "value": "IMAP mail-stream guard — hot-reloadable rule pipeline, quarantine buckets, audited rule edits (propose / apply / revert), webhook relays, SMTP intercept.",
    "pricing": "€49–199/mo per domain",
    "revenue": "pre-revenue",
    "repo": "products/mailroute",
    "links": {
      "site": "/#p-mailroute",
      "docs": "https://doc.ragbaz.cc"
    },
    "components": [
      "rule engine",
      "bucket store",
      "audit",
      "webhook relay",
      "imap proxy"
    ]
  },
  {
    "slug": "detcordon",
    "name": "DetCordon",
    "tag": "research",
    "tagLabel": "research",
    "short": "Containment-first malware observation in disposable sandboxes with structured I/O recording.",
    "value": "Containment-first malware observation — disposable browser and headless runtime sandboxes, network-isolated, I/O recording (DOM, network, filesystem) into structured indicators.",
    "pricing": "€99–399/mo per node",
    "revenue": "pre-revenue",
    "repo": "products/detcordon",
    "links": {
      "site": "/#p-detcordon",
      "docs": "https://doc.ragbaz.cc"
    },
    "components": [
      "sandbox",
      "recorder",
      "analyzer",
      "feeder"
    ]
  },
  {
    "slug": "baz-signal-stack",
    "name": "BAZ Signal Stack",
    "tag": "active-embryo",
    "tagLabel": "active embryo",
    "short": "Systematic trading toolkit — glither.hft compiler, Palantir orchestration, Luna notebook.",
    "value": "Systematic trading toolkit — glither.hft compiler dialect compiles strategies to WASM with Ed25519 audit receipts, Palantir Rust orchestration server enriches tick data, Luna Vite browser notebook for live inspection.",
    "pricing": "—",
    "revenue": "pre-revenue",
    "repo": "experiments",
    "links": {
      "site": "/#p-baz",
      "docs": "https://doc.ragbaz.cc/docs/experiments/baz-architecture"
    },
    "components": [
      "baz.hft",
      "baz.palantir",
      "baz.luna",
      "baz.cx"
    ]
  },
  {
    "slug": "matches",
    "name": "Matches",
    "tag": "live",
    "tagLabel": "live",
    "short": "Autonomous cinematic battle simulation with deterministic replay.",
    "value": "Autonomous cinematic battle simulation — agents fight in real-time with recorded replays and visual output. Grounded locomotion, tactical AI, procedural choreography.",
    "pricing": "free",
    "revenue": "open-source",
    "repo": "external",
    "links": {
      "site": "/#p-matches",
      "github": "https://github.com/tabenius/matches"
    },
    "components": [
      "viewport",
      "timeline",
      "tactical ai",
      "dsl editor",
      "procedural engine"
    ]
  },
  {
    "slug": "scipub",
    "name": "Scipub",
    "tag": "building",
    "tagLabel": "building",
    "short": "Academic publishing pipeline with literature retrieval, evaluation, and structured database.",
    "value": "Academic publishing pipeline — multi-source literature retrieval (PubMed, arXiv, Crossref), structured assessment with claim extraction, evidence grading, citation-network analysis. SQLite FTS5 database, GraphQL + REST API.",
    "pricing": "€0–99/article processing fee",
    "revenue": "pre-revenue",
    "repo": "products/scipub",
    "links": {
      "site": "/#p-scipub"
    },
    "components": [
      "retriever",
      "evaluator",
      "database",
      "api"
    ]
  },
  {
    "slug": "shipwrecks-se",
    "name": "Shipwrecks.se",
    "tag": "building",
    "tagLabel": "building",
    "short": "Baltic shipwreck explorer with 3D bathymetry viewer and historical wreck database.",
    "value": "Baltic shipwreck explorer — Leaflet interactive map of the Swedish coast with clustered wreck markers, depth contours, maritime layers. Curated registry with per-wreck provenance, photos, sonar scans.",
    "pricing": "free",
    "revenue": "public-service",
    "repo": "products/shipwrecks.se",
    "links": {
      "site": "/#p-shipwrecks"
    },
    "components": [
      "map",
      "archive",
      "backend"
    ]
  },
  {
    "slug": "esp32tolk",
    "name": "ESP32Tolk",
    "tag": "building",
    "tagLabel": "building",
    "short": "ESP32-S3 speech translation firmware — on-device STT, live translation, I2S/BT capture.",
    "value": "ESP32 speech-translator firmware — I2S digital microphone or Bluetooth A2DP capture, on-device speech-to-text via ESP-SR or Whisper.cpp (Q4 quantized), local NLLB or tiny-LLM translation, serial/UART/BLE/GATT output.",
    "pricing": "—",
    "revenue": "pre-revenue",
    "repo": "experiments",
    "links": {
      "site": "/#p-esp32tolk"
    },
    "components": [
      "capture",
      "stt engine",
      "translate",
      "output"
    ]
  }
];
