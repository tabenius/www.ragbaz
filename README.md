# ragbaz.cc — Cloudflare Worker (default)

Served from the Cloudflare edge via Next.js 15 + `@opennextjs/cloudflare`.
Cloudflare routes (`ragbaz.cc`, `www.ragbaz.cc`) point at the deployed Worker.

## How it works

The site is plain HTML. Thin route handlers serve the existing HTML byte-for-byte:

- `scripts/sync-public.mjs` copies every **non-HTML** asset from `site/` into `public/`
  (`/colors_and_type.css`, `/assets/*`, `/school/**/assets/*`);
  Next serves these as static assets.
- `app/route.js` + `app/[...path]/route.js` serve the **HTML** pages.
  `generateStaticParams` enumerates every `*.html` under `site/` at build time
  and prerenders each as a static route. The resolver mirrors the old nginx
  `try_files $uri $uri.html $uri/index.html` rule.
- Unknown paths render a styled 404.
- D1 is used for accounts, newsletter state, and a workspace GraphQL snapshot.

## Deploy (production — default)

```sh
npm run deploy
```

This runs `cf:build` (sync-public + next build + opennext build) then deploys
to Cloudflare. The Worker is routed via `ragbaz.cc/*` and `www.ragbaz.cc/*`
for the `ragbaz.cc` zone (configured in `wrangler.jsonc`).

Secrets that must be set before deploy:

    npx wrangler secret put RESEND_API_KEY
    npx wrangler secret put SESSION_SECRET
    npx wrangler secret put GRAPHQL_SYNC_KEY

Apply D1 migrations after deploy:

    npx wrangler d1 migrations apply ragbaz-cc-accounts --remote

## Staging preview

```sh
npm run staging:env
npm run staging:serve
```

Runs the local OpenNext preview origin with the staging D1 binding. This origin
is for `staging.ragbaz.cc`; production remains `ragbaz.cc` and `www.ragbaz.cc`
on the Cloudflare Worker only.

## Local dev (Docker / workerd)

A Docker compose file runs the OpenNext Worker locally via `opennextjs-cloudflare preview`:

```sh
docker compose up --build
```

Listens on `127.0.0.1:8820` behind a Docker-internal Traefik proxy.
This is **for local development and staging only** — production traffic
routes through the Cloudflare edge Worker.

## GraphQL workspace index

`/api/graphql` exposes a read-only view over site pages and workspace manifests.
The bundled fallback snapshot is generated at build time. The deployed Worker
can accept an authenticated mutation to update the snapshot in D1:

    npm run graphql:push

## Manifest-linked stats

Manifests may point at a sidecar stats file (`ragbaz.statsFile` / `ragbaz.stats.toml`).
See `docs/superpowers/specs/` for the timeline-shaped payload format.
Stats are rendered by the Worker at `/stats`.
