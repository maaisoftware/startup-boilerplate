# `packages/cms` — CMS abstraction

## Purpose

One interface, swappable providers. The built-in Supabase adapter uses the schema from `packages/db` and returns shapes that public routes render directly. Alternative providers (Sanity, Builder.io, Contentful) can drop in by implementing the `Cms` interface and passing the shared contract suite.

## Entry points

- `src/interfaces.ts` — `Cms`, `CmsPost`, `CmsPage`, `CmsPageBlock`, `CmsNavigationEntry`, `ListPostsOptions`, `ListPostsResult`.
- `src/adapters/builtin-supabase.ts` — `BuiltinSupabaseCms`. Reads via Drizzle from `packages/db`.
- `src/factory.ts` — `getCms()` singleton.
- `src/contract.ts` — `runCmsContract(name, create)` shared test suite.
- `test/integration/builtin-supabase.test.ts` — runs the contract against local Supabase; auto-skips when unreachable.

## Architectural rules

1. **Interfaces describe shapes, not sources.** The CmsPost type intentionally uses ISO strings rather than `Date` so serialisation is predictable across adapters.
2. **Every adapter passes the contract suite.** Write paths (create/publish) are deliberately NOT on the interface yet — those flow through the API proxy with RBAC + audit. Extend the interface only with a matching ADR.
3. **Never call adapters directly from app code.** Use `getCms()`.

## Forbidden patterns

- Returning raw Drizzle rows from an adapter — always project through the `toCms*` mappers.
- Bypassing `limit` caps — the adapter clamps at 100.
- Fetching unpublished posts from these methods. Staff preview routes get a separate (future) method with explicit auth.

## Testing requirements

- Contract runs against every adapter.
- Integration test uses the local Supabase seeded by `supabase/seed.sql` — the seed intentionally ships one published post (`hello-world`) and one published page (`about`) so the contract has something to read.
- Skips gracefully when DB is unreachable.

## Pointers

- Env schema: `../env/src/schema.ts` (`CMS_PROVIDER`)
- DB schema: `../db/`
- ADR 0002 (abstraction pattern): `../../knowledge/decisions/0002-abstraction-layers.md`
- Root: `../../CLAUDE.md`
