---
title: Abstraction layers
created: 2026-04-21
updated: 2026-04-21
status: active
related: [overview, ../decisions/0002-abstraction-layers]
---

# Abstraction layers

Every third-party service in this template hides behind an **interface + adapter + factory** pattern. Adapters are swapped by flipping a single env var; consumers never see the concrete provider. Details and rationale: [[../decisions/0002-abstraction-layers|ADR 0002]].

## Shape

```
┌──────────────────────────────────────────┐
│  Consumer code (apps/web, packages/…)     │
│  imports the interface:                    │
│     import type { Logger } from           │
│       "@startup-boilerplate/logger"       │
└───────────────┬──────────────────────────┘
                ▼
        ┌───────────────┐
        │  interface    │  src/interfaces.ts  (pure types)
        └──────┬────────┘
     ┌────────┼─────────┐
     ▼        ▼         ▼
 ┌────────┐ ┌────────┐ ┌────────┐
 │Adapter │ │Adapter │ │Adapter │  src/adapters/*.ts
 │  A     │ │  B     │ │  C     │
 └────────┘ └────────┘ └────────┘
     ▲        ▲         ▲
     └────────┼─────────┘
              │
        ┌─────┴──────┐
        │  factory   │  src/factory.ts — reads env, picks adapter
        │  getX()    │  caches a singleton
        └────────────┘
              ▲
              │  every adapter test runs:
              │     runXContract(name, create)
        ┌─────┴──────┐
        │  contract  │  src/contract.ts — shared test suite
        └────────────┘
```

## The packages

| Package                              | Default            | Alternatives | Shipped in |
| ------------------------------------ | ------------------ | ------------ | ---------- |
| `@startup-boilerplate/logger`        | Console            | Sentry       | PR #3      |
| `@startup-boilerplate/analytics`     | Noop               | PostHog      | PR #3      |
| `@startup-boilerplate/feature-flags` | Env                | PostHog      | PR #3      |
| `@startup-boilerplate/cms`           | Builtin (Supabase) | —            | PR #7      |
| `@startup-boilerplate/payments`      | Noop               | Stripe       | PR #8      |
| `@startup-boilerplate/automations`   | Noop               | n8n          | PR #8      |
| `@startup-boilerplate/docs-engine`   | Vault              | —            | PR #8      |

## Default is always "runs with no external service"

The first-pick adapter for every abstraction does not need network access. `LOGGER_PROVIDER=console`, `ANALYTICS_PROVIDER=noop`, `FEATURE_FLAGS_PROVIDER=env`, `PAYMENTS_PROVIDER=noop`. A fork cloning this repo can `pnpm install && pnpm dev` without pasting a single external-service key and still exercise every abstraction end-to-end.

Flipping an env var (`ANALYTICS_PROVIDER=posthog` + `POSTHOG_API_KEY=...`) swaps in the real adapter. No code change in `apps/web`.

## Testing the pattern

Every adapter file imports and executes `runXContract("AdapterName", () => new AdapterName(...))`. The suite verifies:

- Never throws out of a call (best-effort guarantees).
- Interface methods return the advertised shapes.
- Context propagation / child loggers work uniformly.
- Flush and close are idempotent.

Adding a new adapter that fails any contract test means the adapter is not yet acceptable. This is enforced by CI on every PR that touches an abstraction package.

## When to build a new abstraction

Open a new abstraction layer **only when you have a concrete second provider in mind** or when a client-specific swap is already on the roadmap. Adding abstractions speculatively is over-engineering.

Exceptions: `logger`, `analytics`, `cms` — these almost always vary per client, so the abstraction pays for itself from day one.

## Common mistakes

- **Leaking provider identity.** An adapter must not bubble up `SentryError: Invalid DSN` in a response body. Error shapes are adapter-specific; consumers see only the interface's documented failure modes.
- **Sync-only callers.** Factories are async (`await getLogger()`) because adapter loading may dynamic-import an SDK. Callers that assumed sync must be updated.
- **Forgetting the contract test.** Every new adapter's test file calls `runXContract()`. Skipping it is a merge-blocking lint error in PR reviews.

See also: [[../decisions/0002-abstraction-layers]] for the decision record.
