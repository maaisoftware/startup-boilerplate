# `packages/db` — Drizzle schema + Supabase migrations

## Purpose

Single source of truth for the database: Drizzle schema (TypeScript types) mirrors SQL migrations (the actual DDL). Server code imports `getDb()` for type-safe queries; migrations in `supabase/migrations/` own RLS policies and triggers.

## Entry points

- `src/schema/` — Drizzle table definitions, one file per table. The barrel at `src/schema/index.ts` re-exports everything.
- `src/client.ts` — `getDb()` singleton returning a Drizzle client bound to `SUPABASE_DB_URL` (service-role, bypasses RLS — server-only).
- `../../supabase/migrations/` — the SQL that actually shapes the DB. Includes RLS policies and the `audit_log` immutability trigger.
- `test/integration/rls.test.ts` — verifies every table has RLS enabled and a sample of critical policies behave correctly.

## Architectural rules

1. **Schema changes land in two places in one PR:** Drizzle schema (TypeScript) + Supabase migration (SQL). CI must apply the migration cleanly. Drifting one without the other is a merge-blocking lint failure in review.
2. **Every new table has RLS enabled.** The RLS-coverage integration test asserts this automatically — a table without RLS fails the suite.
3. **`audit_log` is append-only.** Never write an UPDATE or DELETE against it. The immutability trigger enforces this even for `service_role`.
4. **Use `has_role()` / `is_staff()` SQL helpers for RLS.** These are SECURITY DEFINER functions that read `user_roles`; they're the single source of truth for role checks at the DB layer.
5. **Service role is for the proxy only.** `getDb()` uses the service role URL, so any consumer of the Drizzle client must itself enforce auth (or run in a context where the caller has already been authenticated).

## Forbidden patterns

- Editing an already-applied migration. Write a new one that alters the schema forward.
- Using `@supabase/supabase-js` from inside this package — that's for `apps/web` API routes.
- Bypassing `has_role()` by inlining `exists(select ... from user_roles ...)` in a policy. Use the helper so policy evaluation stays consistent.
- Adding a table without writing the matching RLS policy in the same migration.

## Common tasks

- **Add a new table:**
  1. `src/schema/<name>.ts` with the Drizzle definition + Row/Insert types.
  2. Export it from `src/schema/index.ts`.
  3. `supabase migration new <name>` and author the SQL — columns, FKs, indices, RLS policies, grants.
  4. Add coverage in `schema.test.ts` and `test/integration/rls.test.ts`.
  5. `supabase db reset --local` to apply + seed.
- **Generate Supabase types** (auto-generated alternative to Drizzle): `pnpm supabase:types` writes to `src/generated/supabase.ts`. Drizzle is preferred for queries, but the generated types are useful for `@supabase/supabase-js` callers.

## Testing requirements

- Unit tests in `src/schema.test.ts` assert the exported tables have the canonical columns — guards against accidental column drops.
- Integration tests in `test/integration/` require a running local Supabase. They auto-skip when the DB is unreachable so CI without local infra stays green.
- Coverage threshold: 90/90/85/90 (not the 95% default — integration tests provide confidence beyond the unit-coverage metric).

## Pointers

- Migrations: `../../supabase/migrations/`
- Env schema (`SUPABASE_DB_URL`, `SUPABASE_SERVICE_ROLE_KEY`): `../env/src/schema.ts`
- Related ADR: `../../knowledge/decisions/0002-abstraction-layers.md`
- Root instructions: `../../CLAUDE.md`
