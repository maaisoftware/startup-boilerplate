---
title: Next.js Proxy layer is for network-boundary work only; auth stays per-handler
created: 2026-04-21
updated: 2026-04-21
status: accepted
related: [0002-abstraction-layers, ../architecture/overview]
deciders: [Marlon Espinosa, Claude Opus 4.7]
---

# 0003 — Next.js Proxy layer is for network-boundary work only; auth stays per-handler

## Context

Next.js 16 deprecated the `middleware` file convention and renamed it to `proxy` (see [official migration guide](https://nextjs.org/docs/messages/middleware-to-proxy)). The rename comes with explicit guidance that the Proxy layer should be a last resort: Vercel is pushing contributors toward route handlers, layouts, and server actions for most concerns that used to live in middleware.

Two behaviours make the Proxy layer a poor place for authentication or authorization:

1. **Server Actions bypass matcher exclusions.** A `matcher` that excludes `/api/*` does not exclude Server Action POSTs to other routes, and a matcher that includes `/api/*` does not cover Server Actions hosted on RSC routes. Auth in the Proxy layer is therefore non-uniform by construction.
2. **Proxy can deploy to the edge** separately from the app's region, with no shared globals or modules. Secrets, DB clients, and session caches that would make auth ergonomic there are not reliably available.

We need a rule that prevents future contributors from drifting auth checks into the Proxy.

## Options considered

### Option A — Keep Proxy network-boundary only; auth stays in `apiHandler`

Proxy handles security headers (CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy), rate limiting, CORS, redirect/rewrite. Every mutation handler uses `apiHandler()` from `apps/web/src/lib/api-handler.ts`, which calls `requireSession()` + `requirePermission()` before the handler body runs. Server Actions re-run the same guards inside their body.

**Pros:** auth is enforced uniformly regardless of route type. Matcher changes cannot accidentally bypass a check. Matches Vercel's stated direction.
**Cons:** each handler repeats `requireSession()` — but `apiHandler` centralises the pattern, so it's one line per route.

### Option B — Auth checks in the Proxy

Gate all protected routes at the Proxy layer with matcher config.

**Pros:** one place to read.
**Cons:** Server Actions bypass matcher exclusions. Edge-runtime restrictions on SDKs. Vercel's current guidance says "last resort."

### Option C — Hybrid (Proxy for cookies only, auth in handlers)

Parse/refresh the auth cookie in the Proxy and hand it to the handler.

**Pros:** cookie refresh happens once per request.
**Cons:** splits auth across two layers; still vulnerable to the Server Action bypass because the Proxy refresh doesn't cover those paths. Complexity buys nothing over A.

## Decision

**Option A.** Proxy is strictly for:

- Response-header injection (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy).
- Rate limiting and early 429 short-circuits.
- CORS preflight handling.
- Redirects and rewrites that don't depend on per-user state.
- `waitUntil`-style background work decoupled from the response.

Auth and RBAC evaluation live in `apps/web/src/lib/api-handler.ts`, invoked explicitly at the top of every route/server action. The RBAC policy DSL from `packages/auth` remains the single source of truth; RLS in `supabase/migrations/*` is the fail-safe below it.

We also adopt the Next 16 rename: the file is now `apps/web/src/proxy.ts` with `export function proxy(request)`. The `middleware.ts` convention is deprecated in 16.0 and scheduled (by Next.js convention) for removal in a future major — staying on it would force a forced migration later.

## Consequences

### Positive

- No matcher-drift risk. An engineer removing a path from the Proxy matcher cannot accidentally leave a route unauthenticated.
- No edge-runtime auth coupling. SDKs that don't run on the edge stay usable in handlers.
- Aligns with Vercel's stated direction for the Proxy layer.

### Negative

- Every handler that mutates state repeats `requireSession()` + `requirePermission()`. Addressed by `apiHandler()` which makes this a one-line invocation.
- The Proxy can still emit headers based on the session (via cookies), but cannot _gate_ requests on session validity. Acceptable given the above.

### Follow-ups

- When the `unstable_doesProxyMatch` testing util (Next 15.1+) stabilises, add matcher unit tests so refactors don't silently shrink coverage.
- If rate limiting ever needs per-user keys, pass a `user-id` header from handler to Proxy via cookie; the Proxy stays stateless.

## References

- Next.js migration message: <https://nextjs.org/docs/messages/middleware-to-proxy>
- Proxy API reference: <https://nextjs.org/docs/app/api-reference/file-conventions/proxy>
- Related: [[0002-abstraction-layers]], [[../architecture/overview]]
- Code: `apps/web/src/proxy.ts`, `apps/web/src/lib/api-handler.ts`, `packages/auth/src/rbac.ts`
