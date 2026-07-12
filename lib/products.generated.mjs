// Generated from /metadata/products.json — do not edit directly.
// Run `npm run prepare:content` to regenerate.

export const PRODUCTS = [
  {
    "kind": "product",
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
      "docs": "/doc/products/ai-governance",
      "prospect": "/prospects/ai-governance"
    },
    "components": [
      "mcp ingress",
      "policy gate",
      "audit chain",
      "human oversight",
      "manifest signer",
      "identity + rbac"
    ],
    "published": true,
    "completion": 61,
    "completionEvaluatedAt": null,
    "finishedValueUsd": 180000,
    "currentValueUsd": 110000,
    "prospect": {
      "slug": "ai-governance",
      "order": "01 / governance prospect",
      "heroCopy": "A policy-as-code control plane for agentic systems that need traceable decisions, bounded autonomy, and operator hold points under the EU AI Act.",
      "chips": [
        "policy gate",
        "audit chain",
        "human approval"
      ],
      "cards": [
        {
          "title": "What is done",
          "intro": "The groundwork is no longer abstract positioning. There is a concrete governance surface and a published control language around it.",
          "items": [
            "A public governance specification is live with policy DSL examples for human hold points and monetary approval gates.",
            "The core control-plane shape is defined: typed policy gate, audit chain, manifest signer, and operator oversight path.",
            "Canonical docs and site routes are in place so governance material resolves under the main public ragbaz.cc surface."
          ]
        },
        {
          "title": "What is left",
          "intro": "The next milestone is to move from formal specification and route structure into a fully operational control plane.",
          "items": [
            "Ship the live GraphQL control and reporting API that runtime agents can actually call during execution.",
            "Ingest real execution receipts from agent runtimes so approvals, denials, and budget holds become first-class records.",
            "Finish the EU AI Act evidence mapping and export bundles so audits can be produced from the execution trail, not assembled afterward."
          ]
        },
        {
          "title": "Commercial frame",
          "intro": "The value is operational accountability: each action can be reviewed, signed, delayed, or rejected without rewriting the agent runtime.",
          "items": [
            "Target use: financial, compliance, and documentation workflows where bounded autonomy matters.",
            "Pricing signal: €25–250/mo per agent, matching the current product line estimate.",
            "Near-term sale shape: managed governance layer for teams already using AI agents in high-consequence operations."
          ]
        }
      ],
      "note": "The product is strongest when it stays close to execution: policy, approval, audit trail, and operator review in one path instead of scattered dashboards.",
      "ctas": [
        {
          "label": "Open governance specification",
          "href": "/konsonans-ai-governance",
          "primary": true
        },
        {
          "label": "Read docs",
          "href": "/doc/products/ai-governance",
          "primary": false
        },
        {
          "label": "Back to ragbaz.cc",
          "href": "/",
          "primary": false
        }
      ]
    }
  },
  {
    "kind": "product",
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
      "docs": "/doc/products/articulate/overview",
      "pricing": "/pricing",
      "prospect": "/prospects/articulate"
    },
    "components": [
      "gatekeeper",
      "storefront",
      "provisioner",
      "graphql edge",
      "mailstack"
    ],
    "published": true,
    "completion": 86,
    "completionEvaluatedAt": null,
    "finishedValueUsd": 320000,
    "currentValueUsd": 275000,
    "prospect": {
      "slug": "articulate",
      "order": "03 / articulate prospect",
      "heroCopy": "A hardened commerce and CMS stack that keeps WordPress private, places the public surface behind controlled runtimes, and automates the surrounding delivery path.",
      "chips": [
        "gatekeeper",
        "storefront",
        "tenant provisioner"
      ],
      "cards": [
        {
          "title": "What is done",
          "intro": "Articulate already has the shape of a managed platform rather than a one-off WordPress hardening note.",
          "items": [
            "The core product line is defined across gatekeeper, storefront, provisioner, GraphQL edge, and associated delivery surfaces.",
            "Public pricing, product framing, and Cloudflare-fronted site delivery are live and coherent under the main ragbaz.cc surface.",
            "The value proposition is already concrete: WordPress stays private while the public runtime, routing, and operational perimeter stay controlled."
          ]
        },
        {
          "title": "What is left",
          "intro": "The remaining work is mainly platform hardening and operational polish around tenancy and publishing.",
          "items": [
            "Tighten self-serve tenant onboarding, billing transitions, and production provisioning reliability.",
            "Strengthen publish, cache, rollback, and invalidation flows so content operations stay predictable under load.",
            "Complete the per-tenant operational guardrails across mail, runtime policy, and support workflows."
          ]
        },
        {
          "title": "Commercial frame",
          "intro": "This is the clearest direct-revenue surface in the current studio lineup: managed tenants, recurring service posture, and obvious customer pain.",
          "items": [
            "Pricing signal: €0–499/mo per tenant with room for higher managed/compliance-sensitive tiers.",
            "Best fit: organizations that still want WordPress as a content plane but do not want it as their public exposure point.",
            "Finished-value estimate assumes a hardened managed platform with tenant lifecycle, provisioning, and storefront delivery working as one system."
          ]
        }
      ],
      "note": "Articulate is close enough to operational shape that the remaining value is mostly in reliability, tenant ergonomics, and sharper production workflows.",
      "ctas": [
        {
          "label": "Open product line",
          "href": "/#p-articulate",
          "primary": true
        },
        {
          "label": "See pricing",
          "href": "/pricing",
          "primary": false
        },
        {
          "label": "Read docs",
          "href": "/doc/",
          "primary": false
        }
      ]
    }
  },
  {
    "kind": "product",
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
      "docs": "/doc/products/mailroute",
      "prospect": "/prospects/mailroute"
    },
    "components": [
      "rule engine",
      "bucket store",
      "audit",
      "webhook relay",
      "imap proxy"
    ],
    "published": true,
    "completion": 74,
    "completionEvaluatedAt": null,
    "finishedValueUsd": 160000,
    "currentValueUsd": 118000,
    "prospect": {
      "slug": "mailroute",
      "order": "04 / mailroute prospect",
      "heroCopy": "A mail stream guard that treats inbox delivery as an auditable rules engine, not a black box: quarantine, review, and signed events live in the same path.",
      "chips": [
        "mail security",
        "quarantine",
        "audit trail"
      ],
      "cards": [
        {
          "title": "What is done",
          "intro": "Mailroute is already framed as a concrete operator tool, not a vague filtering promise.",
          "items": [
            "The rule-driven inspection model is defined across IMAP/SMTP handling, quarantine buckets, and signed downstream event flow.",
            "Audited propose/apply/revert rule editing is part of the product shape, which is a real differentiator versus opaque hosted filtering.",
            "The public product line, docs entry points, and surrounding mail-stack work establish a credible operational direction."
          ]
        },
        {
          "title": "What is left",
          "intro": "What remains is deeper execution hardening around review workflow and message-path reliability.",
          "items": [
            "Complete the stronger SMTP intercept and delivery-control path so policy can sit earlier in the mail flow.",
            "Improve the operator review surface around quarantine decisions, exceptions, and false-positive handling.",
            "Tie message handling more directly into the broader governance and audit infrastructure so rule changes and outcomes share one evidence model."
          ]
        },
        {
          "title": "Commercial frame",
          "intro": "Mailroute sells on visibility and operator control: the ability to explain what happened to a message and why.",
          "items": [
            "Pricing signal: €49–199/mo per domain, with room for managed review and compliance-sensitive tiers.",
            "Best fit: smaller teams and controlled environments where generic hosted filtering is either too opaque or too blunt.",
            "Finished-value estimate assumes hardened policy lanes, clear review UX, and credible downstream event integrations."
          ]
        }
      ],
      "note": "The strongest version of Mailroute is not just stricter filtering. It is a mail control surface where review, evidence, and policy change history are all inspectable.",
      "ctas": [
        {
          "label": "Open product line",
          "href": "/#p-mailroute",
          "primary": true
        },
        {
          "label": "Read docs",
          "href": "/doc/",
          "primary": false
        },
        {
          "label": "Back to ragbaz.cc",
          "href": "/",
          "primary": false
        }
      ]
    }
  },
  {
    "kind": "product",
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
      "docs": "/doc/products/detcordon",
      "prospect": "/prospects/detcordon"
    },
    "components": [
      "sandbox",
      "recorder",
      "analyzer",
      "feeder"
    ],
    "published": true,
    "completion": 42,
    "completionEvaluatedAt": null,
    "finishedValueUsd": 210000,
    "currentValueUsd": 88000,
    "prospect": {
      "slug": "detcordon",
      "order": "05 / detcordon prospect",
      "heroCopy": "Containment-first observation for hostile web payloads: disposable sandboxes, isolated network posture, and structured capture of what the payload actually did.",
      "chips": [
        "sandbox",
        "recorder",
        "ioc extraction"
      ],
      "cards": [
        {
          "title": "What is done",
          "intro": "The key architectural direction is already clear, which matters more here than pretending the product is later-stage than it is.",
          "items": [
            "The system is decomposed into sandbox, recorder, analyzer, and feeder roles instead of a vague single black box.",
            "The public positioning is specific about containment-first execution, I/O capture, and structured evidence rather than generic malware analysis talk.",
            "DetCordon already sits in the studio lineup as a distinct security product with a defined investigative posture."
          ]
        },
        {
          "title": "What is left",
          "intro": "Most of the value is still ahead because the hard part is turning the architecture into a dependable operator tool.",
          "items": [
            "Finish repeatable runtime packaging for disposable browser and headless execution lanes.",
            "Refine the analyst workflow between detonation, evidence packaging, and downstream report/export steps.",
            "Stabilize indicator taxonomy and report structure so hostile runs produce output another analyst can actually reuse."
          ]
        },
        {
          "title": "Commercial frame",
          "intro": "DetCordon has a strong eventual value ceiling because analysts will pay for safer observation and better evidence handling when the workflow is credible.",
          "items": [
            "Pricing signal: €99–399/mo per node based on containment capacity and managed analysis posture.",
            "Best fit: incident-response teams, security consultancies, and internal security groups working with unknown payloads.",
            "Finished-value estimate assumes repeatable runtime packaging, analyst workflow polish, and export-grade evidence bundles."
          ]
        }
      ],
      "note": "DetCordon should stay honest about maturity: the concept is strong, but the next leap is making the evidence workflow solid enough that analysts trust it in real cases.",
      "ctas": [
        {
          "label": "Open product line",
          "href": "/#p-detcordon",
          "primary": true
        },
        {
          "label": "Open forensics school",
          "href": "/school/forensics",
          "primary": false
        },
        {
          "label": "Read docs",
          "href": "/doc/",
          "primary": false
        }
      ]
    }
  },
  {
    "kind": "product",
    "slug": "baz-signal-stack",
    "name": "BAZ Trade Signal Stack",
    "tag": "active-embryo",
    "tagLabel": "active embryo",
    "short": "Systematic trading toolkit — glither.hft compiler, Palantir orchestration, Luna notebook.",
    "value": "Systematic trading toolkit — glither.hft compiler dialect compiles strategies to WASM with Ed25519 audit receipts, Palantir Rust orchestration server enriches tick data, Luna Vite browser notebook for live inspection.",
    "pricing": "—",
    "revenue": "pre-revenue",
    "repo": "experiments",
    "links": {
      "site": "/#p-baz",
      "docs": "/doc/experiments/baz-architecture",
      "prospect": "/prospects/baz-signal-stack"
    },
    "components": [
      "baz.hft",
      "baz.palantir",
      "baz.luna",
      "baz.cx"
    ],
    "published": true,
    "completion": 47,
    "completionEvaluatedAt": null,
    "finishedValueUsd": 260000,
    "currentValueUsd": 122000,
    "prospect": {
      "slug": "baz-signal-stack",
      "order": "07 / baz trade signal stack prospect",
      "heroCopy": "A three-part systematic trading toolkit: glither.hft for strategy compilation, Palantir for orchestration and enrichment, and Luna for notebook-grade browser inspection.",
      "chips": [
        "compiler",
        "orchestration",
        "notebook widgets"
      ],
      "cards": [
        {
          "title": "What is done",
          "intro": "The stack already has a real conceptual split instead of a single overloaded prototype bucket.",
          "items": [
            "baz.hft is identified as the dialect layer around executable strategy artifacts and audit-friendly monetary planning receipts.",
            "Palantir is established as the Rust orchestration and enrichment surface rather than leaving stream handling implicit.",
            "Luna is positioned as the browser notebook and charting layer, giving the stack a concrete operator-facing inspection surface."
          ]
        },
        {
          "title": "What is left",
          "intro": "The largest remaining work is compiler/runtime maturity and keeping browser and backend execution in parity.",
          "items": [
            "Finish dialect semantics around baz.hft and glither.hft so strategies become stable, reviewable, and testable artifacts.",
            "Extend the WASM bridge so web applications can execute or inspect the same compiled parts the Pharo/runtime side uses.",
            "Harden live data adapters, signal transport, and notebook widgets so the operator surface becomes more than an architecture sketch."
          ]
        },
        {
          "title": "Commercial frame",
          "intro": "This has high eventual value because it joins language, execution, audit receipts, and operator notebook into one traceable lane.",
          "items": [
            "Current public posture: active embryo and research-heavy stack rather than ready sellable product.",
            "Best fit: teams that want executable strategy artifacts with auditability, not just disconnected notebooks and charts.",
            "Finished-value estimate assumes compiler maturity, live stream integration, and a browser/runtime bridge strong enough for daily operator use."
          ]
        }
      ],
      "note": "The value here is not just charting or indicators. It is the continuity from strategy language to execution receipt to operator notebook, with monetary planning visible the whole way through.",
      "ctas": [
        {
          "label": "Read architecture notes",
          "href": "/doc/experiments/baz-architecture",
          "primary": true
        },
        {
          "label": "Back to ragbaz.cc",
          "href": "/",
          "primary": false
        }
      ]
    }
  },
  {
    "kind": "product",
    "slug": "matches",
    "name": "Matches",
    "tag": "live",
    "tagLabel": "live",
    "short": "Autonomous cinematic battle simulation with deterministic replay.",
    "value": "Autonomous cinematic battle simulation — agents fight in real-time with recorded replays and visual output. Grounded locomotion, tactical AI, procedural choreography.",
    "pricing": "proposal",
    "revenue": "proprietary",
    "repo": "matches",
    "links": {
      "site": "/#p-matches",
      "prospect": "/prospects/matches",
      "docs": "/doc/products/matches"
    },
    "components": [
      "viewport",
      "timeline",
      "tactical ai",
      "dsl editor",
      "procedural engine"
    ],
    "published": true,
    "completion": 78,
    "completionEvaluatedAt": null,
    "finishedValueUsd": 90000,
    "currentValueUsd": 70000,
    "prospect": {
      "slug": "matches",
      "order": "02 / matches prospect",
      "heroCopy": "A browser-native studio for deterministic cinematic combat, tactical choreography, and exportable timelines that stay reproducible across runs.",
      "chips": [
        "3d viewport",
        "dsl editor",
        "render pipeline"
      ],
      "cards": [
        {
          "title": "What is done",
          "intro": "This is already positioned as an actual studio surface rather than a toy concept page.",
          "items": [
            "The browser-native simulation/editor path is active with deterministic replay, tactical AI framing, and timeline-oriented authoring.",
            "The product line is clearly articulated around viewport, procedural engine, DSL editor, and exportable state.",
            "Matches is already featured as a flagship public surface with its own prospect page and product entry."
          ]
        },
        {
          "title": "What is left",
          "intro": "The remaining work is about strengthening output quality and production workflow around the simulation core.",
          "items": [
            "Improve render/export automation so authored sequences move cleanly into offline production workflows.",
            "Broaden scenario authoring and content packaging so the system supports more than tightly curated demonstrations.",
            "Keep tactical AI inspectable as behavior depth increases, instead of letting complexity hide the simulation state."
          ]
        },
        {
          "title": "Commercial frame",
          "intro": "As a proprietary studio surface, this already demonstrates a deep interactive runtime and a dense work-focused UI.",
          "items": [
            "Current public posture: proprietary flagship surface with strong studio-signaling value.",
            "Primary use: choreography, simulation reviews, browser-based authoring, and machinima-style production experiments.",
            "Finished-value estimate assumes stronger export, content tooling, and repeatable production use under controlled commercial licensing."
          ]
        }
      ],
      "note": "Matches carries value as both a product candidate and a proof of engineering range: deterministic runtime, dense editing surface, and tangible output.",
      "ctas": [
        {
          "label": "Open product line",
          "href": "/#p-matches",
          "primary": true
        },
        {
          "label": "View completion signals",
          "href": "/completion",
          "primary": false
        },
        {
          "label": "Back to ragbaz.cc",
          "href": "/",
          "primary": false
        }
      ]
    }
  },
  {
    "kind": "product",
    "slug": "shipwrecks-se",
    "name": "ShipWrecks",
    "tag": "building",
    "tagLabel": "building",
    "short": "Baltic shipwreck explorer with 3D bathymetry viewer and historical wreck database.",
    "value": "Baltic shipwreck explorer — Leaflet interactive map of the Swedish coast with clustered wreck markers, depth contours, maritime layers. Curated registry with per-wreck provenance, photos, sonar scans.",
    "pricing": "free",
    "revenue": "public-service",
    "repo": "products/shipwrecks.se",
    "links": {
      "site": "/#p-shipwrecks",
      "docs": "/doc/products/shipwrecks-se"
    },
    "components": [
      "map",
      "archive",
      "backend"
    ],
    "published": true,
    "completion": null,
    "completionEvaluatedAt": null,
    "finishedValueUsd": null,
    "currentValueUsd": null,
    "prospect": null
  },
  {
    "kind": "product",
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
    ],
    "published": true,
    "completion": null,
    "completionEvaluatedAt": null,
    "finishedValueUsd": null,
    "currentValueUsd": null,
    "prospect": null
  }
];
