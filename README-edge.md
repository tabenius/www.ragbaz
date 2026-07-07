# ragbaz.cc — Cloudflare edge worker (OpenNext)

Serves the static `site/` from the Cloudflare edge via Next.js + `@opennextjs/cloudflare`,
replacing (or fronting) the nginx/docker deploy.

## How it works

The site is plain HTML. Rather than rewrite each page as JSX, thin **route handlers**
serve the existing HTML byte-for-byte:

- `scripts/sync-public.mjs` copies every **non-HTML** asset from `site/` into `public/`
  (`/colors_and_type.css`, `/assets/*`, `/school/**/assets/*`) — Next serves these as
  static assets at their original URLs.
- `app/route.js` + `app/[...path]/route.js` serve the **HTML** pages. `generateStaticParams`
  enumerates every `*.html` under `site/` at build time and prerenders each as a static
  route (`dynamicParams = false`, `force-static`). The resolver mirrors the old nginx
  `try_files $uri $uri.html $uri/index.html` rule, so `/pricing` → `pricing.html`,
  `/school/` → `school/index.html`.
- `app/healthz/route.js` → `ok` (parity with the nginx healthcheck).
- Unknown paths render `app/not-found.js` (styled 404) with a 404 status.

Everything is prerendered — no server rendering, no D1/R2/KV, just the read-only
static-assets incremental cache bundled with the Worker.

## Commands

    npm install
    npm run build       # sync-public + next build
    npm run preview     # + opennext build + local workerd (wrangler dev)
    npm run deploy      # + opennext build + deploy to Cloudflare

Deploys to `ragbaz-cc.ragbaz.workers.dev`. Pointing the `ragbaz.cc` apex at the Worker
(custom domain / route) is a separate DNS step, intentionally not automated here.
