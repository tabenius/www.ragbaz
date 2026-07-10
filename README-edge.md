# ragbaz.cc — Cloudflare edge worker (OpenNext)

Serves the static `site/` from the Cloudflare edge via Next.js + `@opennextjs/cloudflare`,
with a local OpenNext preview origin reserved for `staging.ragbaz.cc`.

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

Most of the site is prerendered. D1 is used only for:

- accounts + newsletter state
- the workspace GraphQL snapshot used by other RAGBAZ sites

Static HTML/assets still ship via the read-only static-assets incremental cache
bundled with the Worker.

## Commands

    npm install
    npm run build       # sync-public + next build
    npm run preview     # + opennext build + local workerd (wrangler dev)
    npm run deploy      # + opennext build + deploy to Cloudflare
    npm run staging:env
    npm run staging:serve
    npm run graphql:push
    npm run hooks:install

## GraphQL workspace index

`/api/graphql` exposes a read-only view over:

- `site/**/*.html` page metadata
- manifest/package metadata discovered under `/data/src`

The bundled fallback snapshot is generated at build time by
`scripts/generate-workspace-index.mjs`.

The deployed Worker can also accept an authenticated mutation that replaces the
stored snapshot in D1. Configure it with the Worker secret
`GRAPHQL_SYNC_KEY`, then run `npm run graphql:push` locally to push a fresh
workspace snapshot to Cloudflare. The tracked post-commit hook calls the same
script once installed via `npm run hooks:install`.

## Manifest-linked stats

Manifests may point at a sidecar stats file that uses the same family of format
as the manifest:

- JSON / JSONC manifests: `ragbaz.statsFile` or `ragbaz.stats_file`
- `Cargo.toml`: `[package.metadata.ragbaz] stats_file = "ragbaz.stats.toml"`
- `pyproject.toml`: `[tool.ragbaz] stats_file = "ragbaz.stats.toml"`
- `wrangler.toml`: `[ragbaz] stats_file = "ragbaz.stats.toml"`

The sidecar payload is timeline-shaped:

```json
{
  "currency": "USD",
  "entries": [
    { "date": "2026-07-09", "dollars": 25000, "completion": 40, "note": "prototype" }
  ]
}
```

These values are included in the GraphQL snapshot and rendered by the Worker at
`/stats`.

`wrangler.jsonc` declares the public `ragbaz.cc/*` and `www.ragbaz.cc/*`
Cloudflare routes for the Worker. The local Docker/compose runtime is no longer
the old nginx site:
it runs `opennextjs-cloudflare preview` with a persistent local D1 state and is
intended to sit behind `staging.ragbaz.cc`.

Create `.env.staging.local` once with `npm run staging:env`; it generates
`SESSION_SECRET` via `xkcd-password` and is consumed by both `npm run staging:serve`
and `docker compose up`.
