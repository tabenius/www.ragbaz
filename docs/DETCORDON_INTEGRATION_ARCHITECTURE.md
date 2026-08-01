# DetCordon main-site and control-plane integration architecture

## Objective

Turn “configured” into an auditable effective-protection state without moving operational authority onto the public `ragbaz.cc` surface.

## Boundary

- `ragbaz.cc` is disclosure-safe and public: product doctrine, pilot fit, architecture overview, and calls to action.
- The DetCordon dashboard is authenticated: operator configuration and tenant read-only protection views.
- The runtime is authoritative for active posture; saved configuration alone is never reported as active protection.
- The evidence plane records policy identity, decisions, receipts, containment outcomes, and export continuity.

## Contract model

### Desired state

Versioned operator intent:

- explicit `legacy | shadow | enforce` trust mode;
- tenant and sandbox identity policy;
- local and remote transport requirements;
- evidence sink and retention references;
- actor, reason, timestamp, and policy revision.

### Effective state

Sanitized runtime report:

- requested and active trust mode;
- active policy revision and configuration digest;
- prerequisite checks with stable blocker codes;
- degradation and last successful transition;
- last verified event/sample receipt timestamps;
- safe remediation labels, not secrets or filesystem internals.

### Evidence state

Append-oriented records linking:

- tenant/sandbox identity;
- policy revision and runtime build identity;
- decision category and enforcement outcome;
- receipt validation result;
- sample/event export identity and continuity status.

## Authorization

- Operators may propose configuration changes only through authenticated, attributable, audited endpoints.
- Tenants receive the effective-state representation for their own scope and no mutation capability.
- Greyed controls are explanatory UI only; every mutation endpoint independently enforces authorization.
- Managed SaaS tenants receive a Self-Host Waiting List CTA rather than privileged controls.

## Implementation sequence

1. **Readiness evaluator** — add a pure typed evaluator over dashboard/runtime configuration. Return stable `ready`, `degraded`, or `blocked` state plus blocker codes and remediation labels.
2. **Effective-state endpoint** — expose the sanitized evaluator output, active policy revision, activation status, and receipt freshness from an authenticated endpoint.
3. **Operator surface** — render requested versus effective posture, blockers, safe remediation, last transition, and evidence continuity. Keep writes atomic and audited.
4. **Tenant surface** — render a scoped, read-only explanation from the same contract. Prove crafted mutation requests remain forbidden.
5. **Activation handshake** — separate configuration save, policy validation, runtime activation, and effective-state confirmation. Never collapse these into one optimistic success state.
6. **Evidence joins** — attach policy revision and runtime identity to receipts so the UI can support “why is this considered protected?” without querying detector internals.
7. **Public-site handoff** — keep the main-site readiness example static until a deliberately sanitized, cacheable public pilot-status contract is approved. No direct browser-to-runtime connection.

## Stable blocker families

- `policy.missing`
- `tenant.missing_or_ambiguous`
- `transport.local_identity_unavailable`
- `transport.remote_client_auth_unavailable`
- `ingress.unauthenticated_listener_enabled`
- `evidence.sink_unreachable`
- `evidence.receipt_stale_or_invalid`
- `audit.operator_identity_unavailable`
- `activation.requested_revision_not_active`

Blocker payloads must not include certificate material, bearer tokens, raw socket paths, classifier detail, or cross-tenant identifiers.

## Verification gates

- Unit tests for every posture/prerequisite transition and blocker code.
- Regression proof that `shadow` remains observational and never changes write outcome.
- Regression proof that `enforce` refuses incomplete startup and unauthenticated ingress.
- Authorization tests for operator success, tenant read-only access, and crafted tenant mutation denial.
- Activation tests proving a saved revision is not reported active before runtime acknowledgement.
- Receipt tests proving readiness degrades when evidence continuity becomes stale or invalid.
- UI tests for accessible blocker presentation, small screens, stale data, and unavailable runtime state.

## Non-goals for this slice

- Publishing detector composition, classifier weights, or escape-detection recipes.
- Autoconfiguring trust mode from available keys, sockets, or tenant data.
- Allowing the public site to mutate or directly query the DetCordon runtime.
- Treating dashboard visual disablement as an authorization boundary.
