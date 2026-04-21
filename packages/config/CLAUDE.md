# `packages/config` — Shared build & lint configurations

## Purpose

Single source of truth for TypeScript, ESLint, Prettier, and Vitest configuration used by every app and package in the monorepo. Changes here ripple everywhere — handle with care.

## Entry points

- `tsconfig/base.json` — strict Node/Library base.
- `tsconfig/next.json`, `tsconfig/react-library.json`, `tsconfig/node-library.json`, `tsconfig/test.json` — specialisations.
- `eslint/base.mjs` — shared flat-config preset (type-checked rules, no-console, etc.).
- `eslint/next.mjs`, `eslint/react-library.mjs`, `eslint/node-library.mjs` — package-specific extensions.
- `prettier/index.js` — formatter + import-sort + Tailwind class ordering.
- `vitest/{base,node,react}.mjs` — coverage-enforcing Vitest presets.
- `eslint/plugin.mjs` + `eslint/rules/*.mjs` — project-local ESLint plugin (currently hosts `no-page-without-metadata`). Registered in `eslint/next.mjs`.

## Architectural rules

1. **No runtime code ships from this package.** Config and preset files only.
2. **Strict TypeScript settings are non-negotiable.** `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, and `verbatimModuleSyntax` all stay on. If a setting is blocking you, fix the caller — do not weaken the base.
3. **`no-console` is enforced project-wide.** All logging flows through `@startup-boilerplate/logger`. Any `console.*` call in production code is an error.
4. **Coverage thresholds default to 90/90/85/90** (lines/functions/branches/statements). Libraries that ship adapters push this to 95%+ via their own `vitest.config.ts`.

## Forbidden patterns

- Do not import anything from `apps/*` into this package — configs are libraries, not consumers.
- Do not introduce runtime dependencies here. Keep it lightweight and sync.
- Do not relax the base TS or ESLint rules on a whim. File an ADR first.

## Common tasks

- **Add a new rule to every package:** edit `eslint/base.mjs`, run `pnpm lint` at the root, fix failures, commit with an ADR if the rule is opinionated.
- **Add a new TS preset:** create a new `tsconfig/<name>.json` extending `base.json`, add the `exports` entry in `package.json`.
- **Bump dependencies:** bump in this package's `package.json`, run `pnpm install` at the root — every consumer picks it up.

## Testing requirements

The only tests here are ESLint rule tests under `eslint/rules/*.test.mjs`, run via `pnpm --filter @startup-boilerplate/config test`. They use ESLint's `RuleTester` — no fixture files, just inline code strings. Every new rule ships with valid + invalid cases for every code shape it has to handle.

Beyond that, the package's correctness is verified by its consumers: if a downstream package's `pnpm lint` / `pnpm typecheck` / `pnpm test` still passes after changes here, it's working.

## Pointers

- ADR: `knowledge/decisions/0001-monorepo-structure.md`
- Root agent instructions: `../../CLAUDE.md`
