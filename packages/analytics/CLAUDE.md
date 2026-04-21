# `packages/analytics` — Analytics abstraction

## Purpose

Every product event ships through this package. The default adapter is `NoopAnalytics` so the app runs with zero external dependencies; flipping `ANALYTICS_PROVIDER=posthog` swaps in the PostHog adapter without a single code change.

## Entry points

- `src/interfaces.ts` — `Analytics` contract with `capture`, `identify`, `reset`, `flush`, `close`.
- `src/adapters/noop.ts` — zero-overhead default.
- `src/adapters/posthog.ts` — wraps a `PostHogClient` (minimal subset of `posthog-node`).
- `src/factory.ts` — `getAnalytics()` singleton picking from env.
- `src/contract.ts` — `runAnalyticsContract()` shared test suite.

## Architectural rules

1. **Program against `Analytics`, never a concrete adapter.** Factories return the interface type.
2. **Never throw.** Analytics must not break request handling. Every adapter wraps client calls in try/catch.
3. **Debounce, don't fan out.** The PostHog client batches by default; never call `flush()` per request.
4. **Identify on sign-in, reset on sign-out.** Both operations clear or re-associate the current distinct-id.
5. **Close on shutdown.** Long-running servers should call `close()` during graceful shutdown to drain queues.

## Forbidden patterns

- Direct use of `posthog-node` or any analytics SDK from application code. Go through `getAnalytics()`.
- Blocking on `flush()` in request handlers.
- Adding user PII to event properties without an explicit reason documented in an ADR.

## Common tasks

- **Add a new adapter (Mixpanel, Amplitude, GA4):**
  1. `src/adapters/<name>.ts` implementing `Analytics`.
  2. `src/adapters/<name>.test.ts` calling `runAnalyticsContract` plus adapter-specific assertions.
  3. Extend `ANALYTICS_PROVIDER` enum in `packages/env/src/schema.ts`.
  4. Wire in `src/factory.ts`.
  5. Document the new env vars in `.env.example`.
- **Track a new event:** just call `analytics.capture({event, distinctId, properties})`. Event names: `snake_case`, verb-driven (`post_created`, `checkout_started`).

## Testing requirements

- 95%+ lines/functions, 90%+ branches, 95%+ statements (enforced in vitest.config.ts).
- Contract suite runs against every adapter. `pnpm --filter @startup-boilerplate/analytics test:contract`.
- Adapter-specific tests cover the side-effects (client.capture called with … , errors swallowed, etc.).

## Pointers

- Env schema: `../env/src/schema.ts` (`ANALYTICS_PROVIDER`, `POSTHOG_API_KEY`).
- Related ADR: `../../knowledge/decisions/0002-abstraction-layers.md`.
- Root instructions: `../../CLAUDE.md`.
