---
name: generate-migration
description: Scaffolds a Supabase SQL migration with RLS policies that match the Drizzle schema. Invoke when a user adds a new table, modifies columns, adds an index, or changes RLS policies. Produces forward-only migrations — never edits existing ones.
---

# generate-migration

Supabase migrations live in `supabase/migrations/`, are timestamped, and are forward-only. This skill walks through creating a new one that stays in lockstep with the Drizzle schema in `packages/db/src/schema/`.

## The hard rules

- **Forward-only.** Never edit a migration that has already been applied (locally counts). If you need to undo something, write a new migration that reverses it.
- **Every table has RLS.** `ENABLE ROW LEVEL SECURITY` + at least one policy, in the same migration that creates the table. The RLS-coverage integration test fails fast if you forget.
- **Use `has_role()` and `is_staff()` in RLS policies.** Don't inline subqueries against `user_roles` — the helpers are SECURITY DEFINER and read consistently.
- **`audit_log` stays append-only.** Never add an UPDATE or DELETE policy. The immutability trigger blocks writes even for service_role.

## Steps

### 1. Create the file

```bash
supabase migration new <slug>
```

Writes `supabase/migrations/<timestamp>_<slug>.sql`. Never hand-name these.

### 2. Write the SQL

Structure the migration in this order:

1. `CREATE EXTENSION IF NOT EXISTS` for anything new.
2. `CREATE TYPE` for enums (use `do $$ begin ... exception when duplicate_object then null; end $$` guard).
3. `CREATE TABLE`.
4. `CREATE INDEX` for query-hot columns. Think: which columns end up in WHERE, JOIN, ORDER BY?
5. Trigger definitions.
6. `ALTER TABLE … ENABLE ROW LEVEL SECURITY`.
7. `CREATE POLICY` statements — one per (action, role-target) pair. Name them descriptively: `"<table>: <intent>"`.
8. `GRANT` statements for `anon` / `authenticated` on the new table. RLS still filters after the grant.

Patterns:

```sql
-- Public read of published only
create policy "posts: public read published"
  on public.posts for select
  to anon, authenticated
  using (status = 'published'
         and (published_at is null or published_at <= now()));

-- Staff writes
create policy "posts: staff writes"
  on public.posts for insert
  to authenticated
  with check (public.is_staff());

-- Admin deletes
create policy "posts: admin deletes"
  on public.posts for delete
  to authenticated
  using (public.has_role('admin'));
```

### 3. Mirror in Drizzle

Update `packages/db/src/schema/<name>.ts` to match. Export from the barrel. Use the shared `contentStatus`, `appRole`, `subscriberStatus` enum builders where applicable so Drizzle and SQL enums agree on the name.

### 4. Apply locally

```bash
pnpm supabase:reset
```

Wipes + re-applies + re-seeds. If the migration fails, fix the SQL before proceeding — never ship a migration that partially applied.

### 5. Add RLS integration tests

In `packages/db/test/integration/rls.test.ts`:

- Assert every public table has RLS enabled (this test already exists; your new table is picked up automatically).
- Add at least one positive test (allowed action succeeds) and one negative test (blocked action fails) for the new table.

Run:

```bash
pnpm --filter @startup-boilerplate/db test
```

### 6. Update generated types

```bash
pnpm supabase:types
```

Writes the Supabase-flavoured types to `packages/db/src/generated/supabase.ts`. Optional but useful for `@supabase/supabase-js` callers.

### 7. Document

- If the table represents a new feature, add `knowledge/features/<slug>.md`.
- If the schema change embodies an architectural choice (e.g. multi-tenancy opt-in), write an ADR.

## Common gotchas

- **Helper functions referencing new tables.** Put table DDL before function DDL. `has_role()` already exists; you don't need to redeclare it.
- **ALTER TYPE ADD VALUE** on enums cannot run inside a transaction in Postgres prior to 14. Supabase's local DB is 17+, so this works, but production Postgres may need `ALTER TYPE … ADD VALUE` outside a transaction block.
- **Forgetting grants.** RLS evaluates after the grant. If you only write policies, the `anon` role still can't touch the table. See the `grant` block at the bottom of `20260421062015_init_schema.sql` for the canonical example.
- **Default column values bypassing WITH CHECK.** When a policy's `with_check` references a column the insert doesn't set, Postgres evaluates the default first — usually what you want, but read the subscriber double-opt-in comment in `init_schema.sql` for a tested example.

## References

- `supabase/migrations/20260421062015_init_schema.sql` — the exhaustive reference migration.
- `supabase/CLAUDE.md` — folder-level rules.
- ADR 0003 (proxy vs auth) — why RLS is the fail-safe layer.
