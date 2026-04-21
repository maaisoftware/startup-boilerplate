# `packages/logger` — Logger abstraction

## Purpose

Every log statement in the monorepo flows through this package. Direct `console.*` calls are a lint error — the only file allowed to use `console.*` is `src/adapters/console.ts`, which is the console adapter. The package hides which logging backend is active (Console locally, Sentry in production) behind a single `Logger` interface so any adapter can be swapped by flipping `LOGGER_PROVIDER`.

## Entry points

- `src/interfaces.ts` — `Logger`, `LogLevel`, `LogContext`. The contract.
- `src/adapters/console.ts` — `ConsoleLogger`. JSON-structured stdout/stderr records.
- `src/adapters/sentry.ts` — `SentryLogger`. Routes through `@sentry/nextjs` (debug/info → breadcrumb, warn → captureMessage warning, error → captureException / captureMessage error).
- `src/factory.ts` — `getLogger()`: async singleton picking an adapter from `env.LOGGER_PROVIDER`.
- `src/contract.ts` — `runLoggerContract(name, factory)`. Shared test suite every adapter must pass.
- `src/levels.ts` — numeric priorities and `shouldEmit` + `isLogLevel` helpers.

## Architectural rules

1. **The interface is the boundary.** Consumers always program against `Logger`, never against a concrete adapter. `getLogger()` returns `Logger`.
2. **Logging must never throw.** Every adapter's `log`/`error` call catches its own downstream errors. A broken logging backend must never break a request.
3. **Every adapter passes the contract suite.** `runLoggerContract()` is imported from `./contract` and called in each adapter's `*.test.ts`. No `.only`, no skips.
4. **Context propagates via `child()`.** Bound context merges into every subsequent record on the child logger.
5. **Levels below the threshold are dropped silently.** `silent` means no output at all. The default level is `info` in production, `debug` elsewhere.

## Forbidden patterns

- `console.log()` / `console.info()` / etc. outside `src/adapters/console.ts`. The `no-console` ESLint rule catches this.
- Throwing from a log call. Wrap adapter-specific work in try/catch.
- Importing an adapter directly in application code. Go through `getLogger()`.
- Blocking on `flush()` in a hot path. It's fire-and-forget for the average request — call it only at process shutdown or inside an explicit finaliser.

## Common tasks

- **Add a new adapter (e.g. Datadog, LogTape):**
  1. `src/adapters/<name>.ts` implementing `Logger`.
  2. `src/adapters/<name>.test.ts` calling `runLoggerContract("NameLogger", create)` + adapter-specific tests (95%+ coverage).
  3. Extend `LOGGER_PROVIDER` enum in `packages/env/src/schema.ts`.
  4. Wire in `src/factory.ts`.
  5. Document the new env vars in `.env.example`.
  6. ADR if the decision warrants one.
- **Change the interface:** ADR first. Contract-test diff must be reviewed before any adapter updates.

## Testing requirements

- 95%+ line / function coverage, 90%+ branch coverage (enforced in `vitest.config.ts`).
- Contract suite runs against every adapter. `pnpm --filter @startup-boilerplate/logger test:contract` isolates adapter tests.
- Adapter-specific tests cover the observable behaviour — stream routing for Console, breadcrumb vs captureMessage for Sentry.

## Pointers

- Env schema: `../env/src/schema.ts` (`LOGGER_PROVIDER`, `SENTRY_DSN`).
- Related ADR: `../../knowledge/decisions/0002-abstraction-layers.md` (written in this PR).
- Root instructions: `../../CLAUDE.md`.
