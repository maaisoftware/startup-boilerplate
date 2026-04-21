---
name: add-feature
description: Walks through the canonical 9-step flow for adding a new feature to the Startup Boilerplate — RBAC → schema → migration → abstraction → API route → page → client call → tests → docs. Invoke when a user asks for any CRUD feature, admin page, or new public route.
---

# add-feature

You are about to add a new feature to a repo that enforces a specific shape. Follow every step in order. Skip one and CI blocks the PR.

## Collect requirements before touching code

Ask the user (one question at a time if anything is unclear):

1. What is the resource called? (singular, snake_case — e.g. `post`, `subscription`, `team_invitation`)
2. Which roles can perform which actions (read, read_private, create, update, delete, publish)?
3. Is any of the content publicly readable, or staff-only?
4. Does it have a feature flag? (If yes, extend `FlagKey` in `packages/feature-flags`.)

## The nine steps

### 1. Declare the permission in RBAC

Edit `packages/auth/src/rbac.ts`:

- Extend `RESOURCES` with the new resource identifier.
- Add a row to `POLICY` with the minimum role per action.
- Update property-based tests in `packages/auth/src/rbac.test.ts` if invariants change.

Run `pnpm --filter @startup-boilerplate/auth test` — the monotonicity property test asserts that higher roles still cover everything lower roles can do.

### 2. Model the schema

Create `packages/db/src/schema/<name>.ts` with the Drizzle table. Re-export from `packages/db/src/schema/index.ts`.

Then `supabase migration new add_<name>` writes a timestamped SQL file into `supabase/migrations/`. Author:

- CREATE TABLE matching the Drizzle shape.
- FKs with `ON DELETE` semantics (usually `CASCADE` for parent-child, `SET NULL` for soft references).
- Indices on hot paths (slug, created_at, foreign keys used in joins).
- `ALTER TABLE … ENABLE ROW LEVEL SECURITY`.
- At least one RLS policy per action that users or anon need. Use the `has_role(role)` and `is_staff()` SQL helpers — don't inline role checks.
- Explicit grants on `anon` / `authenticated` for the privileges the RLS policies will then filter.

Add an integration test in `packages/db/test/integration/rls.test.ts` asserting unauthorised access is denied and authorised access succeeds.

### 3. Apply and seed

```bash
pnpm supabase:reset
```

This wipes the local DB, re-applies every migration, and re-runs `supabase/seed.sql`. Verify `pnpm --filter @startup-boilerplate/db test` still passes.

### 4. Expose the read path through an abstraction

- If the feature is CMS-shaped (posts, pages, navigation), add a method to the `Cms` interface in `packages/cms/src/interfaces.ts` and implement it in `BuiltinSupabaseCms`. Extend the contract suite.
- If it's a new concern entirely, spin up a new abstraction package following the interface + adapter + factory + contract shape from ADR 0002. Never inline data access in `apps/web`.

### 5. Ship an API route

Create `apps/web/src/app/api/<name>/route.ts`. Wrap the handler with `apiHandler`:

```ts
import { apiHandler } from "~/lib/api-handler";
import { requireSession, requirePermission } from "@startup-boilerplate/auth";
import { writeAudit } from "~/lib/audit";
import { z } from "zod";

const createSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
});

export const POST = apiHandler({
  input: createSchema,
  handler: async ({ input, request }) => {
    const session = await getSessionFromRequest(request); // see packages/auth/server
    requireSession(session);
    requirePermission(session.role, "post", "create");

    // ... do work via getCms() / getDb() ...

    await writeAudit({
      userId: session.user.id,
      action: "post.create",
      resourceType: "post",
      resourceId: created.id,
      metadata: { slug: input.slug },
    });

    return { id: created.id };
  },
});
```

`apiHandler` maps `UnauthorizedError` → 401, `PermissionDeniedError` → 403, `ZodError` → 400, everything else → sanitised 500. Upstream error details never reach the client.

### 6. Render the page

Every user-facing page goes through `<PageShell>` from `@startup-boilerplate/ui`. The component requires `title`, `description`, and `structuredData` as compile-time props — missing any is a TypeScript error.

- Use `articleSchema`, `organizationSchema`, or `breadcrumbSchema` builders for structured data.
- Export `generateMetadata` (async) or a static `metadata` on every route. Required for SEO and CI.

### 7. Call the API from the client

Use `apiFetch(path, zodSchema, { json, csrfToken })` from `@startup-boilerplate/api-client`. It only accepts `/api/*` paths at runtime. It validates the response against the schema — if the server and client drift, the parse error surfaces at the call site.

For non-GET requests, include the CSRF token from the session cookie.

### 8. Test it

In order of importance:

- RLS integration test (covers the security rail even if every other test lies).
- Unit test for the handler with mocked session + mocked CMS.
- Contract test for the new abstraction method (if applicable).
- Playwright smoke in `apps/web/tests/e2e/` covering the happy path and at least one authz path.
- Accessibility audit in component tests via `jest-axe`.

Run all of it:

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm --filter @startup-boilerplate/web test:e2e
```

### 9. Document it

- Architectural choice → new ADR in `knowledge/decisions/00NN-<slug>.md` using the template in `knowledge/decisions/_template.md`.
- New feature → `knowledge/features/<slug>.md` linked from `knowledge/features/_index.md`.
- New env var → single PR touches `.env.example`, `packages/env/src/schema.ts`, and `packages/env/src/schema.test.ts`.
- Commits conventional: `feat(<scope>): <subject>`. Scopes are enumerated in `commitlint.config.cjs`. If the scope isn't there, add it in the same PR.

## Common footguns

- **Forgetting RLS.** The RLS-coverage test in `packages/db` fails fast, but only in integration mode. Run `pnpm supabase:start` + `pnpm --filter @startup-boilerplate/db test` during development.
- **Putting auth in the Proxy.** Never do this — Server Actions bypass matcher exclusions. ADR 0003 spells out why.
- **Calling `console.*`.** Import the logger: `import { getLogger } from "@startup-boilerplate/logger"`.
- **Raw `fetch` in client components.** Use `apiFetch`; it enforces the `/api/*` boundary.
- **Adding a route without metadata.** CI rejects it (no-page-without-metadata rule, PR #17).

## References

- Root rules: `CLAUDE.md`
- ADR 0002 (abstraction layers), ADR 0003 (proxy/auth boundary)
- `apps/web/src/lib/api-handler.ts` for the request-wrapping pattern
