# `packages/api-client` — Typed browser fetch client

## Purpose

Wraps `fetch` so the browser can only call `/api/*` routes. Every response is validated at runtime against a Zod schema, so schema drift surfaces as a parse error at the call site rather than silently broken UI. Shared error class `ApiError` gives UIs a consistent shape to match against.

## Entry points

- `src/index.ts` — `apiFetch<T>(path, schema, options)` + `ApiError` + `okSchema`.

## Architectural rules

1. **Paths must start with `/api/`.** The check throws `client.invalid_path` at runtime. No direct hits on Supabase, Stripe, PostHog, etc. from the browser.
2. **Every response is parsed.** If the route's schema changes without the client being updated, the error is immediate and loud.
3. **Credentials are `same-origin`.** Authenticated requests send cookies; cross-origin cookies never leak.
4. **CSRF for mutations.** Callers must pass `csrfToken` on every non-GET request. The proxy layer verifies the header against the session.

## Forbidden patterns

- Importing `@supabase/supabase-js` in client components except via server-rendered helpers.
- Bypassing the schema argument. The validation is the contract.
- Mutating the returned value and sending it back without re-validating.

## Common tasks

- **Add a new route call:** define the Zod response schema next to the route handler (in a shared file if it's reused), import from client code, call `apiFetch("/api/<path>", schema, options)`.

## Testing requirements

- 90%+ coverage. `fetch` is stubbed; the HTTP paths are not exercised here — end-to-end flow is covered by Playwright in PR #10.

## Pointers

- API proxy layer: `../../apps/web/src/app/api/`
- Root instructions: `../../CLAUDE.md`
