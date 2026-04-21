# `packages/auth` — Auth utilities + RBAC policy DSL

## Purpose

Two related concerns in one package:

1. **Supabase SSR wiring.** `createSupabaseServerClient(cookies)` for server components, `createSupabaseBrowserClient()` for client components, `getSession()` / `requireSession()` for route guards.
2. **RBAC policy DSL.** `canPerform(role, resource, action)` / `requirePermission(role, resource, action)` — the single source of truth for "who can do what." The same policy powers API-layer guards and is the conceptual source for the RLS policies in `supabase/migrations/*`.

## Entry points

- `src/rbac.ts` — roles, resources, actions, the `POLICY` map, and the guard functions.
- `src/session.ts` — `AppSession`, `getSession()`, `UnauthorizedError`, `requireSession()`.
- `src/server.ts` — `createSupabaseServerClient(cookies)`.
- `src/client.ts` — `createSupabaseBrowserClient()`.

## Architectural rules

1. **The `POLICY` map is append-only.** Loosening a permission retroactively breaks trust; rewrite with a new ADR.
2. **No inline role checks.** If code needs to gate behaviour on roles, use `canPerform()` — not `if (session.role === "admin")`.
3. **Server vs browser is a trust boundary.** Never pass the browser client into server code or vice-versa. The anon key is the same, but the cookie plumbing differs.
4. **RBAC DSL and RLS must agree.** When you change `POLICY`, update the matching RLS policy in a Supabase migration in the same PR.
5. **Sessions are lightweight.** They carry `{ id, email, role }` — nothing else. Anything richer is a join in the caller.

## Forbidden patterns

- Reading `supabase.auth.getSession()` directly in app code. Use `getSession()` so the role field is always present.
- Catching `UnauthorizedError` anywhere except the `apiHandler` wrapper (`apps/web/src/lib/api-handler.ts`) that maps it to HTTP 401.
- Storing roles in JWT claims. We resolve from `user_roles` so admin changes take effect immediately.

## Common tasks

- **Add a new role:** extend `ROLES`, place it in `ROLE_RANK`, add policy entries everywhere the new role should apply, update the RLS migration helpers.
- **Add a new resource/action:** extend `RESOURCES` / `ACTIONS`, add entries to `POLICY`, add tests.
- **Gate an API route:** `requireSession(session); requirePermission(session.role, "post", "publish");`.

## Testing requirements

- 95%+ coverage. Property-based tests with fast-check assert invariants across the full role × resource × action matrix.
- Session helpers are tested with fakes rather than a live Supabase instance.

## Pointers

- Related ADR: `../../knowledge/decisions/0002-abstraction-layers.md`
- RLS migration: `../../supabase/migrations/`
- Root instructions: `../../CLAUDE.md`
