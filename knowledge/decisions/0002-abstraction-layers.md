---
title: Abstraction layers — interface + adapter + factory
created: 2026-04-21
updated: 2026-04-21
status: accepted
related: [0001-monorepo-structure, ../architecture/abstraction-layers]
deciders: [Marlon Espinosa, Claude Opus 4.7]
---

# 0002 — Abstraction layers: interface + adapter + factory

## Context

Every third-party concern in this template (logging, analytics, CMS, payments, feature flags, automations, docs engine) needs to be **swappable without code changes** in consumer apps. A fork that wants Datadog instead of Sentry, or Mixpanel instead of PostHog, should flip an env var — not edit call sites.

Constraints:

- Adapters live in `packages/*`, one package per abstraction.
- Apps import only the public interface — never a concrete adapter.
- New adapters must be provably equivalent to existing ones (contract tests).
- Default adapters must run with zero external services so forks start in a bootable state.
- Type-safe boundaries: Node, strict TypeScript 6, `exactOptionalPropertyTypes` on.

## Options considered

### Option A — Interface + adapter + factory pattern (this ADR)

Each package ships:

- `src/interfaces.ts` — the contract. Pure type definitions and simple runtime enums (log levels, flag keys). No state.
- `src/adapters/<name>.ts` — one class per provider implementing the contract.
- `src/factory.ts` — `getX()` async function that reads env, picks the right adapter, caches the instance.
- `src/contract.ts` — a shared test suite (`runXContract(name, create)`) that every adapter must pass.
- Per-adapter `*.test.ts` that calls `runXContract` plus provider-specific assertions.

**Pros:** standard dependency-injection shape, every adapter testable in isolation, factory is the only file with branching logic, tree-shake friendly because unused adapters are dynamically imported.
**Cons:** four layers to understand for each package, slightly more code than a direct import.

### Option B — Middleware stacks (Express-style)

Treat every call as a pipeline of middleware that terminates at a backend. Flexible, common in Node.

**Pros:** composable mid-call transformations (sampling, redaction).
**Cons:** heavier mental model, indirect failure modes, overkill for the 80% case.

### Option C — Dependency-injection container (InversifyJS, tsyringe)

Central container resolves instances from decorators.

**Pros:** mature, testable.
**Cons:** decorators are a TC39 moving target; runtime container undermines treeshake; overkill for 7 small abstractions.

## Decision

**Option A.** Simplest pattern that solves the swap-by-env-var requirement. Contract tests guarantee interface fidelity across adapters. Factories are the only code aware of provider selection, so adding a new adapter never touches consumer code.

Implementation policy:

1. **Interfaces are append-only.** Removing a method breaks every adapter; add a new interface and deprecate gradually.
2. **Factories cache singletons.** First call validates env and resolves an adapter; subsequent calls return the same instance until `__resetXCacheForTests()` clears it.
3. **Defaults run offline.** Console/Noop/Env/Memory adapters require no external service so the app boots on any machine.
4. **Every adapter swallows its downstream errors.** Logging, analytics, and flag lookups are best-effort — broken infrastructure must never break a request.
5. **Coverage gate at 95%/95%/90%/95%** on every abstraction package. Contract tests do not count toward the file's own coverage (they are excluded from the coverage collector).

## Consequences

### Positive

- Forks swap providers by flipping env vars.
- New adapters require ~150 LoC of implementation + contract suite inclusion.
- Tree-shaking strips unused adapters via dynamic imports.
- The pattern scales identically to every other abstraction in the plan (CMS, payments, automations, docs-engine).

### Negative

- Four files per package (interface, adapter, factory, contract) is more than a direct Sentry/PostHog import.
- Async factory (`await getLogger()`) leaks throughout server code — callers must handle the promise.
- Dynamic imports inside factories mean TS cannot prove adapter code is only loaded when selected.

### Follow-ups

- PR #4: `@startup-boilerplate/cms` follows the same shape.
- PR #8: `payments`, `automations`, `docs-engine` follow the same shape.
- Future: consider exposing a sync variant of each factory for `edge` runtime (no dynamic import).

## References

- Related: [[0001-monorepo-structure]], [[../architecture/abstraction-layers]]
- Consumer packages:
  - [[../../packages/logger/CLAUDE|packages/logger]]
  - [[../../packages/analytics/CLAUDE|packages/analytics]]
  - [[../../packages/feature-flags/CLAUDE|packages/feature-flags]]
