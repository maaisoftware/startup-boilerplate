---
sidebar_position: 2
---

# Architecture overview

The boilerplate is a Turborepo + pnpm monorepo with two top-level entry points:

- **`apps/*`** — deployable applications (currently `apps/web` and this docs site).
- **`packages/*`** — shared libraries. Each abstraction package (logger, analytics, feature-flags, payments, CMS, automations) ships with an interface, a set of adapters, a factory, and a shared contract test suite.

## Abstraction layers

Every external dependency lives behind an interface. Flipping the matching env var swaps the adapter at runtime without a single code change.

| Abstraction   | Env var                  | Adapters                                   |
| ------------- | ------------------------ | ------------------------------------------ |
| Logger        | `LOGGER_PROVIDER`        | `console`, `sentry`, `datadog`             |
| Analytics     | `ANALYTICS_PROVIDER`     | `noop`, `posthog`, `mixpanel`, `ga4`       |
| Feature flags | `FEATURE_FLAGS_PROVIDER` | `env`, `posthog`, `launchdarkly`           |
| Payments      | `PAYMENTS_PROVIDER`      | `noop`, `stripe`, `paddle`, `lemonsqueezy` |
| CMS           | `CMS_PROVIDER`           | `builtin` (Supabase tables), `sanity`      |
| Automations   | `AUTOMATIONS_PROVIDER`   | `noop`, `n8n`                              |

The rationale behind this pattern — and why the default adapter for every abstraction is a no-op — lives in ADR 0002 (`knowledge/decisions/0002-abstraction-layers.md`).

## Request lifecycle

1. **Proxy** (`apps/web/src/proxy.ts`, renamed from Next.js 15 "middleware") seeds the CSRF cookie and handles globally-applicable headers. Auth is NOT enforced here — per-handler `apiHandler()` is the boundary. See ADR 0003 for why.
2. **Handler** validates input with Zod, authenticates via Supabase SSR cookies, enforces RBAC, and calls into the relevant package.
3. **Packages** read typed env vars via `@startup-boilerplate/env/server`, never `process.env` directly.
4. **Database** reads go through Drizzle; writes go through Supabase with Row-Level Security policies.

## Security boundary

- `NEXT_PUBLIC_*` vars are the public trust boundary — everything else is server-only.
- `AUTH_SECRET` and `CSRF_SECRET` must be ≥32 chars (Zod-enforced at boot).
- The Supabase `audit_log` table is append-only via a DB trigger that blocks UPDATE/DELETE for every role, including `service_role`.
