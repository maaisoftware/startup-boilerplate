# `packages/env` — Zod-validated environment variables

## Purpose

Every process.env access in the monorepo goes through this package. The app refuses to start if required variables are missing or malformed — loud, immediate failure beats silent misbehavior. Typed, frozen singletons replace `process.env["FOO"]` gymnastics throughout the codebase.

## Entry points

- `src/schema.ts` — Zod schemas: `serverSchema`, `clientSchema`, `fullSchema`. The source of truth for "what environment this app accepts".
- `src/server.ts` — `getServerEnv()` / `validateServerEnv()`. Import via `@startup-boilerplate/env/server`. Marked `server-only` — importing from a client component is a build-time error.
- `src/client.ts` — `getClientEnv()` / `validateClientEnv()`. Import via `@startup-boilerplate/env/client`. Only reads `NEXT_PUBLIC_*` vars that Next.js embeds into the client bundle.
- `src/format.ts` — `formatEnvError()` turns Zod issues into a human-readable multi-line error suitable for crashing boot loudly.

## Architectural rules

1. **Every new env var lands in three places in a single commit:**
   1. `.env.example` at repo root (with `[REQUIRED]` / `[OPTIONAL]` / `[LOCAL-AUTO]` marker).
   2. Either `serverSchema` (secrets + server-only) or `clientSchema` (`NEXT_PUBLIC_*` only) in `src/schema.ts`.
   3. A test case in `src/schema.test.ts` asserting the new validation (accepted shape + rejected shape).
2. **Never import `process.env` directly outside this package.** Use `getServerEnv()` / `getClientEnv()`. The `no-restricted-syntax` rule enforces this (added in PR #3).
3. **Server vs client is a trust boundary, not a suggestion.** `NEXT_PUBLIC_*` vars end up in the browser bundle; treat their values as public knowledge. Put secrets in `serverSchema`.
4. **Frozen outputs.** Both `getServerEnv()` and `getClientEnv()` return `Object.freeze`d records. Mutating them throws in strict mode.
5. **Cache, don't re-validate.** The first call validates; subsequent calls return the cached value. Tests reset the cache via `__resetXXXEnvCacheForTests()`.

## Forbidden patterns

- Reading `process.env["FOO"]` outside this package. Files that need configuration import the typed env.
- Adding a variable to `serverSchema` without also adding it to `.env.example`.
- Putting a secret in `clientSchema`. `NEXT_PUBLIC_*` is public.
- Relaxing `secret32` to allow shorter AUTH/CSRF secrets. 32+ chars is a floor.

## Common tasks

- **Add a required variable:** edit `.env.example`, add to `serverSchema` or `clientSchema`, add tests, run `pnpm --filter @startup-boilerplate/env test`.
- **Add a provider adapter:** extend the matching provider enum in `schema.ts`, add a default, update the adapter factory in the provider package, add tests.
- **Debug a boot crash:** the thrown error lists every invalid field with its Zod message. Fix the `.env.local` entry.

## Testing requirements

- 100% lines / 100% functions / 95% branches / 100% statements (enforced by `vitest.config.ts`).
- Every new variable gets a happy-path test and at least one failure-path test.
- Schema changes should include a CHANGELOG entry and a `.env.example` diff in the same PR.

## Pointers

- Docs: `../../knowledge/architecture/env-validation.md` (added alongside this package).
- Packages consuming the env: `logger` (PR #3), `analytics` (PR #3), `feature-flags` (PR #3), and `apps/web` (boot-time check).
- Root instructions: `../../CLAUDE.md`.
