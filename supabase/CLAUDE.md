# `supabase/` — Supabase local project

## Purpose

Holds every artefact that configures a Supabase project: migrations, seed data, edge functions, and the per-environment `config.toml`. This folder _defines the database_ — changes here reshape the DB.

## Entry points

- `config.toml` — every knob of the local Supabase stack. Ports are shifted +100 from defaults (54421/54422/54423/54424/54427/54429/54420) so this project coexists with other local Supabase stacks on the same machine.
- `migrations/` — ordered SQL files (timestamped). Every schema change ships as a new migration — never edit existing ones.
- `seed.sql` — baseline data loaded on `supabase db reset`. Keep minimal; demo content is optional and feature-flagged per-client.
- `functions/` — Deno edge functions (only used for outbound webhooks that must bypass the proxy).

## Architectural rules

1. **Migrations are forward-only.** Every schema change creates a new migration file. Rollbacks happen by writing a new migration that reverses the change.
2. **Every table has RLS enabled** and at least one policy, even if that policy is "nobody reads this" (enforced by the integration test suite in PR #4).
3. **RLS policies derive from the RBAC DSL** in `packages/auth`. When the DSL changes, regenerate policies — don't hand-edit.
4. **The `audit_log` table is immutable.** RLS policies forbid UPDATE and DELETE for everyone (including service role). The only INSERT path is the proxy layer.
5. **Never commit real secrets.** Keys in `config.toml` use `env(NAME)` references; actual values live in `.env.local` or the deploy environment.

## Forbidden patterns

- Editing an existing migration after it has been applied anywhere (local included). Write a new migration.
- Creating a table without RLS enabled — integration tests fail.
- Introducing a stored procedure or trigger that bypasses RLS without a paired ADR explaining why.
- Seeding test data that contains plausible-looking real email addresses or personal data. Use `@example.com`.

## Common tasks

- **Start the stack:** `pnpm supabase:start`. Stops with `pnpm supabase:stop`.
- **Apply migrations locally:** `pnpm supabase:reset` wipes + re-applies.
- **Create a new migration:** `supabase migration new <slug>` (writes `migrations/<timestamp>_<slug>.sql`).
- **Generate types after schema change:** `pnpm supabase:types`.
- **Run a query against local DB:** `supabase db remote --local "SELECT ..."` or connect via `psql postgresql://postgres:postgres@127.0.0.1:54422/postgres`.

## Testing requirements

- RLS integration tests in `packages/db/test/rls.test.ts` verify every table rejects unauthorized reads and writes for every role. 100% table coverage.
- Seed file must leave the DB in a state where the smoke E2E suite passes without authentication.

## Pointers

- Drizzle schema (the TypeScript-side source of truth): `../packages/db/`
- RBAC DSL: `../packages/auth/`
- Root instructions: `../CLAUDE.md`
