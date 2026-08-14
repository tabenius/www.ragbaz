# Public catalog snapshot

`products.json` is the deployable public snapshot of the workspace catalog.
Keeping it in this repository makes clean CI and Cloudflare builds independent
of the local `/data/src` directory layout.

The workspace source remains `/data/src/metadata/products.json`. After changing
that source, run `npm run catalog:sync`, review the diff, regenerate the site,
and commit the source and snapshot changes together when both repositories are
published through the same workflow.
