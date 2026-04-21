# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] — 2026-04-21

First tagged release. Everything needed to fork this template and start shipping a new client project on top of it.

### Monorepo & tooling (PR #1)

- Turborepo 2.9 + pnpm 10.26 workspaces; Node 22 LTS, TypeScript 6.0 strict, ESLint 9.39 flat config, Prettier 3.8, Vitest 4.
- Root `CLAUDE.md` and per-folder `CLAUDE.md` for every package + app.
- `knowledge/` vault scaffolded (ADR infrastructure, architecture overview, feature index, raw notes).
- Husky + lint-staged + commitlint enforcing conventional commits.
- GitHub Actions: `ci.yml` (lint/typecheck/test/build/commitlint/format-check), `security.yml` (pnpm audit + CodeQL + Gitleaks).
- Docker: production `docker-compose.yml` with non-root `nextjs:nodejs` runtime, multi-stage `infra/docker/web.Dockerfile`.
- MIT license, full OSS hygiene (README, CONTRIBUTING, SECURITY, CODE_OF_CONDUCT, PR/issue templates).
- `.env.example` documenting every runtime variable; `scripts/sync-env.mjs` propagating the root `.env.local` into app directories on `pnpm install`.

### Environment validation (PR #2)

- `@startup-boilerplate/env`: Zod-validated server/client singletons. Boot-time validation refuses to start with missing/malformed vars. 23 tests at 100% coverage.
- Empty-string-to-undefined preprocessing on all optional vars.
- `instrumentation.ts` hook in apps/web triggers validation at server startup.

### Observability abstractions (PR #3)

- `@startup-boilerplate/logger`: `Logger` interface + `ConsoleLogger` + `SentryLogger`. 33 tests including a shared `runLoggerContract()` every adapter passes.
- `@startup-boilerplate/analytics`: `Analytics` interface + `NoopAnalytics` + `PostHogAnalytics`. 19 tests.
- `@startup-boilerplate/feature-flags`: `FeatureFlags` interface + `EnvFeatureFlags` + `PostHogFeatureFlags`. 26 tests.
- ADR 0002 accepts the interface + adapter + factory pattern used by every abstraction.

### Database schema + RLS (PR #4)

- `@startup-boilerplate/db`: Drizzle schema mirroring 11 Supabase tables — `profiles`, `user_roles`, `posts`, `pages`, `page_blocks`, `media`, `newsletters`, `subscribers`, `navigation`, `seo_overrides`, `audit_log`.
- `supabase/migrations/20260421062015_init_schema.sql`: the full DDL including RLS policies on every table, `has_role()` / `is_staff()` SECURITY DEFINER helpers, and an `audit_log_immutable` trigger that blocks UPDATE/DELETE even for service_role.
- 13 tests: 4 schema-shape units + 9 RLS integration tests against local Supabase (auto-skip when DB unreachable).
- Seeded `hello-world` post, `about` page, 3 navigation rows, 1 SEO override, 1 newsletter — the demo surface that PR #10 renders.

### Auth + RBAC (PR #5)

- `@startup-boilerplate/auth`: RBAC policy DSL (roles × resources × actions), `canPerform()` / `requirePermission()` guards, `getSession()` helper, `UnauthorizedError` / `PermissionDeniedError`.
- Server + browser Supabase SSR clients wired to the shifted-port local instance.
- 16 tests including 3 property-based tests with fast-check asserting role-hierarchy monotonicity.

### API proxy + security rails (PR #6)

- `@startup-boilerplate/api-client`: typed fetch wrapper that only hits `/api/*`, validates every response with Zod, sends CSRF on non-GET.
- `apps/web/src/middleware.ts`: CSP (strict in prod), HSTS, X-Frame-Options DENY, Referrer-Policy, Permissions-Policy. Rate-limits /api/\* (60 req/min reads, 10 req/min writes).
- `src/lib/csrf.ts`: HMAC-signed double-submit tokens with constant-time compare.
- `src/lib/rate-limit.ts`: in-memory token bucket (+ Upstash interface ready).
- `src/lib/audit.ts`: audit-log writer with silent failure logging.
- `src/lib/api-handler.ts`: Zod-validated request wrapper that maps known errors to sanitised 401/403/400/500 responses and logs real causes server-side.

### CMS package (PR #7)

- `@startup-boilerplate/cms`: `Cms` interface + `BuiltinSupabaseCms` reading `posts`, `pages`, `page_blocks`, `navigation` through Drizzle. Shared contract suite verifies adapter interchangeability.
- 7 integration tests passing against the seeded local DB.

### Payments, Automations, Docs-engine (PR #8)

- `@startup-boilerplate/payments`: `Payments` interface + `NoopPayments` + `StripePayments` (dynamic SDK import). 12 tests.
- `@startup-boilerplate/automations`: `Automations` interface + `NoopAutomations` + `N8nAutomations` (HMAC-headered webhook). 9 tests.
- `@startup-boilerplate/docs-engine`: `DocsEngine` interface + `VaultDocsEngine` reading markdown from `knowledge/` with frontmatter parsing. 7 tests.

### UI + SEO primitives (PR #9)

- `@startup-boilerplate/ui`: `Button` with variants/sizes, `PageShell` (TypeScript-enforced title/description/structuredData), `JsonLd` (with `<` escaping), schema builders (`articleSchema`, `organizationSchema`, `breadcrumbSchema`), `cn()` class merger.
- 14 tests including jest-axe a11y audits on Button and PageShell.

### Demo routes + E2E (PR #10)

- `/blog` + `/blog/[slug]` rendering seeded posts through the CMS abstraction.
- Dynamic `sitemap.xml` (Next.js metadata API) listing root, `/blog`, every published page and post.
- `/robots.ts` with sitemap pointer.
- `/llms.txt` endpoint for LLM-crawler discovery.
- `playwright.config.ts` + `tests/e2e/smoke.spec.ts` covering home OG metadata, blog index JSON-LD, post detail JSON-LD, `/api/health`, sitemap, robots, llms.

### Totals

- **13 workspace packages** (config, env, logger, analytics, feature-flags, db, auth, api-client, cms, payments, automations, docs-engine, ui + apps/web).
- **~220 unit and integration tests**, all green locally against local Supabase.
- **Zero external services required** for the default boot path.
- **Every mutation goes through the proxy**; every proxy mutation writes to the immutable audit log.
