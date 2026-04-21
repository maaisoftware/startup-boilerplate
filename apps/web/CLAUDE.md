# `apps/web` — Next.js application

## Purpose
The single frontend application shipped by this boilerplate. It is the only consumer of the API proxy layer and the canonical example of how to wire up every abstraction in `packages/*`.

## Entry points
- `src/app/layout.tsx` — root layout, global metadata defaults.
- `src/app/page.tsx` — home page (scaffold placeholder; demo content in PR #10).
- `src/app/api/*` — every outbound call to upstream services lives here (proxy layer, PR #6).
- `src/middleware.ts` — CSP, CORS, rate limit (added in PR #6).
- `next.config.ts` — `output: "standalone"`, no powered-by header, strict images.
- `eslint.config.mjs` — extends `@startup-boilerplate/config/eslint/next`.

## Architectural rules
1. **The browser never calls upstream services directly.** Supabase, Stripe, PostHog, n8n — all reached through `/api/*` handlers. No `NEXT_PUBLIC_*` env var may point at a real secret or upstream URL except the Supabase anon key (which is already RLS-gated).
2. **Every route exports `generateMetadata`** (or static `metadata`) returning a full `Metadata` object. Pages missing metadata fail CI via the custom ESLint rule added in PR #9.
3. **Every page that emits a detail view uses `<JsonLd>`** (from `@startup-boilerplate/ui`) to ship Schema.org structured data. Types: `Article` for posts, `Organization` for root, `BreadcrumbList` for navigation, etc.
4. **`console.*` is forbidden.** Import the logger: `import { getLogger } from "@startup-boilerplate/logger"` and call `log.info()` / `log.error()`.
5. **Routes are typed.** `experimental.typedRoutes` is on — broken `<Link href="/...">` targets fail the build.
6. **Server components by default.** Mark `"use client"` only when a component reads state or events; SEO and auth checks must stay on the server.

## Forbidden patterns
- Do not import from `apps/*` into any `packages/*`.
- Do not call `fetch()` against upstream services from client components.
- Do not inline Tailwind arbitrary values when a theme token exists.
- Do not add route files without metadata — CI will reject them.

## Security constraints
- CSRF tokens on all state-changing `/api/*` routes (header: `x-csrf-token`). Wiring lives in `packages/auth`.
- Rate limiting is applied before any handler runs. Budget: 60 req/min/IP for reads, 10 req/min/IP for writes (override via env `RATE_LIMIT_*`).
- `getServerSession()` is the only way to read the current user. Never trust a user-supplied id in request bodies.

## Testing requirements
- Unit tests for server components and utilities live beside the code (`page.test.tsx`).
- Integration tests for `/api/*` handlers use `msw` + a test Supabase schema (PR #6 adds this).
- Playwright suite in `tests/e2e` covers: home loads, blog lists posts, auth round-trip, authed user creates a post, SEO audit on every route (PR #10).
- Every new route added PRs must include: at minimum one unit test rendering the component and one E2E smoke test.

## Common tasks
- **Add a new page:** use the `/add-feature` Claude skill (scaffolded in PR #6) — generates route + metadata + test + ADR scaffold.
- **Add an API endpoint:** create `src/app/api/<name>/route.ts`, export `GET` / `POST` with Zod-validated input, import `getLogger()` + `getServerSession()`, write integration test in the same folder.
- **Change global metadata:** edit `src/app/layout.tsx`. Any page can override via its own `metadata` export.

## Pointers
- API proxy design: `knowledge/architecture/api-proxy.md` (PR #6)
- Auth and RBAC: `packages/auth/CLAUDE.md`
- UI primitives: `packages/ui/CLAUDE.md`
- Root instructions: `../../CLAUDE.md`
