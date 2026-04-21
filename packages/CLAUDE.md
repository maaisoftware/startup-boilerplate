# `packages/` — Reusable libraries

## Purpose
Every shared library consumed by `apps/*` lives here. Each package is independently versionable, independently tested, and independently replaceable. The abstraction-layer packages (`logger`, `analytics`, `cms`, etc.) form the **heart of the template** — they allow forks to swap providers by flipping env vars.

## Architectural rules
1. **One responsibility per package.** A package either implements a single abstraction or provides a cohesive set of utilities, never both.
2. **Every abstraction package follows the same shape:**
   - `src/index.ts` — public exports only.
   - `src/interfaces.ts` — the contract every adapter implements.
   - `src/adapters/<name>.ts` — concrete adapters.
   - `src/factory.ts` — picks an adapter at runtime from env vars.
   - `src/contract.test.ts` — shared test suite every adapter must pass.
   - `src/adapters/<name>.test.ts` — adapter-specific tests.
   - `CLAUDE.md` — folder rules.
3. **Never import from `apps/*`.** Violates the dependency direction.
4. **Packages export from `src/index.ts` only.** Subpath exports require explicit `package.json#exports` entries.
5. **Type-safe boundaries.** Every package compiles clean with the strict TS config in `@startup-boilerplate/config/tsconfig`. No `any`, no `@ts-ignore` without a justifying comment.

## Forbidden patterns
- Importing from a sibling package via relative path (`../other-package/src/...`). Use the workspace-scoped name: `@startup-boilerplate/other-package`.
- Circular dependencies. If two packages need each other, extract a third.
- Reaching into another package's `src/` internals. Only consume the public `exports`.
- Runtime dependencies in `packages/config`. Config files only.

## Common tasks
- **Add a new package:**
  1. `mkdir packages/<name>` and create `package.json` with name `@startup-boilerplate/<name>`, private, type module.
  2. Add `tsconfig.json` extending `@startup-boilerplate/config/tsconfig/node-library.json` (or `react-library` for React-using packages).
  3. Add `eslint.config.mjs` extending the matching preset from `@startup-boilerplate/config/eslint`.
  4. Add `vitest.config.ts` extending `@startup-boilerplate/config/vitest/node` (or `react`).
  5. Write `CLAUDE.md` describing the package.
  6. `pnpm install` at the root to register it.
- **Add an adapter to an existing abstraction:** use the `add-adapter` skill. It walks you through the interface, contract test, factory wiring, and docs update.

## Testing requirements
- Unit tests per adapter at 95%+ coverage.
- Contract test suite per abstraction, consumed by every adapter.
- Integration tests (hitting real services) gated by env vars so they run locally with `supabase start` but skip in CI without secrets.

## Pointers
- Per-package rules: open the CLAUDE.md in the target package directory.
- Abstraction pattern ADR: `../knowledge/decisions/0002-abstraction-layers.md` (written in PR #3)
- Root instructions: `../CLAUDE.md`
