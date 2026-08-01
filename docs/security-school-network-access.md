# RAGBAZ Security School network access

`/school/security` is a deny-by-default private publication surface. The Cloudflare Worker must run before every matching HTML page, manifest, script, stylesheet, and nested asset. Requests are accepted only when Cloudflare's trusted `CF-Connecting-IP` exactly matches one of the configured addresses.

## Required configuration

Configure one or more exact addresses through Wrangler secrets. Values may be separated by commas, spaces, or semicolons.

```sh
printf '%s' '203.0.113.10' | npx wrangler secret put TAILSCALE_ALLOWED_IPS
printf '%s' '198.51.100.20' | npx wrangler secret put NETBIRD_ALLOWED_IPS
```

A shared variable is also supported:

```sh
printf '%s' '203.0.113.10,198.51.100.20' \
  | npx wrangler secret put SECURITY_SCHOOL_ALLOWED_IPS
```

For staging, append `--env staging` to each command.

An empty or missing allowlist denies every request. CIDR ranges and wildcard entries are intentionally rejected; configure individual peer, gateway, or exit-node addresses.

## Which address to configure

When a browser visits the public `https://ragbaz.cc/school/security/` route through Cloudflare, Cloudflare normally sees the public egress address used by the request. It does not normally see the browser's private NetBird or Tailscale overlay address.

For the public hostname, configure the stable public egress IP of the approved NetBird gateway, Tailscale exit node, or other VPN gateway. Ensure approved readers route the request through that gateway.

For true overlay-address enforcement, serve the collection from a private origin or reverse proxy reachable only on the NetBird/Tailscale network, and use split DNS for a private hostname. Path-level split DNS is not possible, so that model should use a dedicated private hostname or make the whole host private.

## Enforcement properties

- The Worker checks access before analytics, redirects, OpenNext routing, and static assets.
- `wrangler.jsonc` uses `assets.run_worker_first` for `/school/security` and `/school/security/*`.
- Only `CF-Connecting-IP` is trusted. Browser-supplied forwarding headers do not grant access.
- Refused requests return a non-cacheable `404 Not Found` rather than advertising the private collection.
- Allowed responses are marked `private, no-store` and `noindex, nofollow, noarchive, nosnippet`.
- The first release contains no PoC, exploit instructions, private keys, ciphertext, or unlock interface.

## Verification

After deployment, test the same URL from both sides of the boundary:

```sh
curl -i https://ragbaz.cc/school/security/
curl -i https://ragbaz.cc/school/security/manifest.json
curl -i https://ragbaz.cc/school/security/on-digital-robbery/
```

From an unapproved network, each request must return `404` with `Cache-Control: private, no-store`. From the approved gateway, the HTML or manifest should load and retain the private/no-store and robots headers.

## Repository boundary

The repository is public. Network gating protects the deployed route; it does not make committed source confidential. This release therefore contains defensive, non-PoC material only. Any future sensitive implementation material must not be committed as plaintext to this repository. Use a private source store, encrypted build input, or a separate private repository before expanding the collection.
