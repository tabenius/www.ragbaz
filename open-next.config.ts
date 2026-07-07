import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

/*
 * OpenNext Cloudflare configuration.
 *
 * The whole site is prerendered at build time (static route handlers over
 * the HTML in site/), so the read-only static-assets incremental cache is
 * enough: prerendered responses are bundled with the Worker's assets and
 * never written at runtime. No R2 bucket, queue, or tag cache required.
 */
export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
});
