# Startup Boilerplate

> Production-grade, AI-ready monorepo template for rapidly bootstrapping new client projects with consistent architecture, security, and tooling.

[![CI](https://github.com/maaisoftware/startup-boilerplate/actions/workflows/ci.yml/badge.svg)](https://github.com/maaisoftware/startup-boilerplate/actions/workflows/ci.yml)
[![Security](https://github.com/maaisoftware/startup-boilerplate/actions/workflows/security.yml/badge.svg)](https://github.com/maaisoftware/startup-boilerplate/actions/workflows/security.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)

## What this is

A reusable agency-style starter kit. Fork it, swap env vars, and start shipping business logic on day one. Every infrastructure, tooling, security, and AI-assistance concern is solved once — for every project that follows.

**Five principles:**

1. **Provider-agnostic via abstraction layers.** Logger, analytics, CMS, payments, automations, docs — every third-party service hides behind a factory + adapter interface. Swap providers by editing an env var, not your code.
2. **Security by default.** No backend URL ever reaches the browser. RLS, RBAC, CSP, CORS, audit logging, and a proxy layer are configured before you write a single line of business logic.
3. **AI-native.** Every folder ships a `CLAUDE.md`. Reusable skills live in `.claude/skills/`. A structured Obsidian-style `knowledge/` vault maintains long-term memory of architectural decisions.
4. **Zero repeated setup.** Feature flags toggle optional integrations. Docker Compose bootstraps the full local stack with one command. GitHub Actions ship to production with only secrets to configure.
5. **Tested once, reused forever.** Unit, integration, and E2E tests cover every abstraction so forks inherit a trusted foundation.

## Stack

| Layer       | Choice                                |
| ----------- | ------------------------------------- |
| Framework   | Next.js 16 (App Router)               |
| Monorepo    | Turborepo 2 + pnpm 10 workspaces      |
| Backend     | Supabase (Postgres 17, Auth, Storage) |
| Language    | TypeScript 6 (strict, noUnchecked)    |
| Styling     | Tailwind CSS v4 + Headless UI         |
| Data        | TanStack Query + Zustand              |
| ORM         | Drizzle                               |
| Validation  | Zod                                   |
| Testing     | Vitest + Testing Library + Playwright |
| CI/CD       | GitHub Actions                        |
| Container   | Docker + Docker Compose               |
| Docs        | Markdown vault (Obsidian-compatible)  |
| Analytics   | PostHog (adapter)                     |
| Errors      | Sentry (adapter)                      |
| Payments    | Stripe (feature-flagged adapter)      |
| Automations | n8n (adapter)                         |

Every third-party layer is swappable via the **[abstraction-layer pattern](knowledge/architecture/overview.md)**.

## Quick start

```bash
# 1. Clone
git clone https://github.com/maaisoftware/startup-boilerplate.git my-new-project
cd my-new-project

# 2. Environment
cp .env.example .env.local
# Fill in AUTH_SECRET and CSRF_SECRET — instructions inside the file

# 3. Install
pnpm install

# 4. Bring up local Supabase
pnpm supabase:start        # one-time; prints API URL + anon key to paste into .env.local

# 5. Run the app
pnpm dev                   # http://localhost:3000
```

Everything works with **zero external services** — default adapters resolve to `console` logger, `noop` analytics, `env`-based feature flags, in-memory rate limiter, and the built-in Supabase CMS. Flip a provider env var to activate a real integration.

## Repository map

```
apps/
  web/                      Next.js App Router — the only app (for now)
packages/
  config/                   Shared TS/ESLint/Prettier/Vitest presets
  types/                    Shared TS types + Zod schemas                (PR #2)
  logger/                   Logger abstraction (Console, Sentry)         (PR #3)
  analytics/                Analytics abstraction (Noop, PostHog)        (PR #3)
  feature-flags/            Feature-flag abstraction (Env, PostHog)      (PR #3)
  db/                       Drizzle schema + migrations + RLS tests      (PR #4)
  auth/                     Auth utils + RBAC policy DSL                 (PR #5)
  api-client/               Typed client that only hits /api/*           (PR #6)
  cms/                      Built-in Supabase CMS + contract suite       (PR #7)
  payments/                 Stripe adapter, feature-flagged              (PR #8)
  automations/              n8n webhook adapter                          (PR #8)
  docs-engine/              Local vault adapter                          (PR #8)
  ui/                       Headless UI primitives + PageShell + JsonLd  (PR #9)
supabase/                   Local project, migrations, seed
infra/docker/               Production Dockerfiles
knowledge/                  Obsidian-compatible vault (ADRs, architecture, features)
.github/                    CI/CD workflows + templates
.claude/                    Shared agent skills and slash commands
```

Every top-level folder ships its own **`CLAUDE.md`** — the first thing any coding agent reads before editing inside it.

## Security

- Browser never calls upstream services directly. Every request routes through `/api/*`.
- Supabase RLS policies on every table, enforced even if the proxy is bypassed.
- RBAC policy DSL is the single source of truth — generates both API-layer guards and (where feasible) RLS policies.
- CSP, HSTS, and other headers applied via Next.js Proxy (`apps/web/src/proxy.ts`).
- CSRF tokens on every state-changing request.
- Audit log table on every mutation. Immutable.
- See [`SECURITY.md`](./SECURITY.md) for responsible-disclosure policy.

## Contributing

See [`CONTRIBUTING.md`](./CONTRIBUTING.md). TL;DR:

- Branch off `develop`, never `main`.
- Conventional commits enforced by commitlint.
- Every PR runs lint + typecheck + test + build + CodeQL + Gitleaks.
- Every PR gets reviewed by the `code-review` skill before merge.
- Every PR updates the knowledge vault when architecture or features change.

## Documentation

The **[knowledge vault](knowledge/_index.md)** is the long-term memory:

- [`knowledge/architecture/overview.md`](knowledge/architecture/overview.md) — system summary
- [`knowledge/decisions/`](knowledge/decisions/) — ADRs
- [`knowledge/features/`](knowledge/features/) — per-feature docs

## License

[MIT](./LICENSE) © 2026 Marlon Alejandro Espinosa Castañeiras and contributors.
