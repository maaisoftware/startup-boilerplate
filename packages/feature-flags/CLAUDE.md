# `packages/feature-flags` — Feature-flag abstraction

## Purpose

Every conditional feature in the app goes through this package. The default `EnvFeatureFlags` adapter reads `FEATURE_*` env vars — flipping a flag is a single `.env` change. The PostHog adapter swaps in remote flag evaluation with user targeting and variants when the app is ready for it.

## Entry points

- `src/interfaces.ts` — `FeatureFlags` contract (`isEnabled`, `getVariant`, `close`) and the `FlagKey` union.
- `src/adapters/env.ts` — maps flags to `FEATURE_<SCREAMING_SNAKE>` env vars. Boolean only.
- `src/adapters/posthog.ts` — wraps `posthog-node` for remote evaluation with user targeting.
- `src/factory.ts` — `getFeatureFlags()` singleton based on `FEATURE_FLAGS_PROVIDER`.
- `src/contract.ts` — shared test suite.

## Architectural rules

1. **Flag keys live in one place.** Add a new flag → add it to `FlagKey` in `interfaces.ts`, then to `.env.example` + `packages/env/src/schema.ts` (and tests), then use it.
2. **`isEnabled` defaults to false.** Safer to have a feature hidden than accidentally shipped.
3. **Never throw.** A broken flag lookup must degrade to "feature disabled", not a 500.
4. **Flags are evaluated per call.** Don't memoise across requests — user context can change.
5. **Env adapter is boolean-only.** For variants, use the PostHog adapter.

## Forbidden patterns

- Hardcoding a feature decision (if-else on `process.env.NODE_ENV` for feature toggles). Add a flag.
- Using `console.*` or the PostHog SDK directly. Go through `getFeatureFlags()`.

## Common tasks

- **Add a flag:**
  1. Extend `FlagKey` in `src/interfaces.ts`.
  2. Add `FEATURE_<KEY>` to `.env.example` + `packages/env/src/schema.ts` + schema tests.
  3. Use `await flags.isEnabled("your-flag", { distinctId, traits })`.
- **Add an adapter:**
  1. `src/adapters/<name>.ts` implementing `FeatureFlags`.
  2. `src/adapters/<name>.test.ts` calling `runFeatureFlagsContract`.
  3. Extend `FEATURE_FLAGS_PROVIDER` enum in env schema.
  4. Wire `src/factory.ts`.

## Testing requirements

- 95%+ lines/functions, 90%+ branches (enforced).
- Contract suite runs against every adapter.
- Adapter-specific tests cover: happy paths, client errors, missing context.

## Pointers

- Env schema: `../env/src/schema.ts` (`FEATURE_FLAGS_PROVIDER`, `FEATURE_*`).
- Root instructions: `../../CLAUDE.md`.
