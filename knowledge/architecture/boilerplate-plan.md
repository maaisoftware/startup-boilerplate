# Agency Boilerplate: Architecture & Implementation Plan

> A production-grade, AI-ready monorepo template for rapidly bootstrapping new client projects with consistent architecture, security, and tooling.

---

## 1. Executive Summary

This boilerplate is a reusable agency-style starter kit. Every new project forks or clones it, swaps environment variables, and begins shipping business logic on day one. Every infrastructure, tooling, security, and AI-assistance concern is already solved.

**Core philosophy:**
1. **Provider-agnostic via abstraction layers.** Every third-party service (logging, analytics, CMS, payments, workflow automation, documentation) is hidden behind a factory/adapter interface. Swap providers by editing an env var, not your code.
2. **Security by default.** No backend URL ever reaches the browser. RLS, RBAC, CSP, CORS, audit logging, and a proxy layer are configured before you write a single line of business logic.
3. **AI-native.** Each folder ships with a `CLAUDE.md` file and Claude skills so any coding agent immediately understands how to work inside it. A structured Obsidian-style knowledge base maintains long-term memory of architectural decisions.
4. **Zero repeated setup.** Feature flags toggle optional integrations (Stripe, etc.). Docker Compose bootstraps the entire stack with one command. GitHub Actions ship to production with only secrets to configure.
5. **Tested once, reused forever.** Unit and integration tests cover every abstraction so forks inherit a trusted foundation.

---

## 2. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js (App Router) | SSR/SSG, edge runtime, mature ecosystem |
| Monorepo | Turborepo + pnpm workspaces | Standard in the agency space, fast incremental builds |
| Backend | Supabase (Postgres + Auth + Storage + Edge Functions) | Open source, self-hostable, great DX |
| Deployment | Vercel (frontend) + Supabase Cloud (backend) | Fast paths, also Dockerized for VPS fallback |
| Payments | Stripe (feature-flagged) | Industry standard |
| Analytics | PostHog (adapter pattern) | Self-hostable, product analytics + feature flags |
| Error tracking | Sentry (adapter pattern) | Best-in-class for Next.js |
| Styling | Tailwind CSS + Headless UI + shadcn/ui | Unstyled primitives, theme per project |
| State/Data | TanStack Query + Zustand (or Jotai) | Minimal, predictable |
| ORM | Drizzle ORM | Type-safe, works great with Supabase Postgres |
| Validation | Zod | Shared between API routes, forms, and env parsing |
| Testing | Vitest + Testing Library + Playwright | Fast unit/integration/E2E |
| IaC | Terraform (Supabase provider + Vercel provider) | Reproducible infra per client |
| CI/CD | GitHub Actions | Push → lint → test → deploy |
| Docs & Memory | Obsidian-style markdown vault + Docusaurus (optional) | LLM-readable, human-navigable |
| Automations | n8n / Make (adapter pattern) | Swappable workflow provider |
| Container | Docker + Docker Compose | Single command local stack |

---

## 3. Monorepo Structure

```
boilerplate/
├── .github/
│   └── workflows/              # CI/CD pipelines (test, lint, deploy)
├── .claude/
│   ├── skills/                 # Claude skills (see §9)
│   └── commands/               # Custom slash commands
├── apps/
│   ├── web/                    # Next.js frontend (App Router)
│   ├── admin/                  # Optional admin dashboard (separate deploy)
│   └── docs/                   # Docusaurus docs site (Docker service)
├── packages/
│   ├── ui/                     # Unstyled component library (Headless UI + shadcn)
│   ├── config/                 # Shared ESLint, Prettier, TS configs
│   ├── types/                  # Shared TypeScript types, Zod schemas
│   ├── db/                     # Drizzle schema, migrations, seed scripts
│   ├── logger/                 # Logger abstraction (Sentry adapter, etc.)
│   ├── analytics/              # Analytics abstraction (PostHog adapter, etc.)
│   ├── cms/                    # CMS abstraction (built-in + Sanity/Builder adapters)
│   ├── payments/               # Payments abstraction (Stripe adapter)
│   ├── automations/            # Workflow abstraction (n8n/Make adapters)
│   ├── docs-engine/            # Documentation abstraction (Obsidian/Notion adapters)
│   ├── auth/                   # Auth utilities, RBAC policies
│   ├── api-client/             # Proxied API client (frontend only hits /api/*)
│   └── feature-flags/          # Feature flag abstraction
├── supabase/
│   ├── migrations/             # SQL migrations
│   ├── seed.sql                # Seed data
│   ├── functions/              # Edge Functions
│   └── config.toml
├── infra/
│   ├── terraform/              # Supabase + Vercel + DNS provisioning
│   └── docker/                 # Dockerfiles, compose files
├── knowledge/                  # LLM knowledge base (Obsidian vault)
│   ├── _index.md
│   ├── architecture/
│   ├── decisions/              # ADRs (Architecture Decision Records)
│   ├── features/               # Per-feature docs
│   └── raw/                    # Drop zone for sources to be compiled
├── docker-compose.yml
├── docker-compose.dev.yml
├── turbo.json
├── pnpm-workspace.yaml
├── CLAUDE.md                   # Root agent instructions
└── README.md
```

**Every folder above ships with its own `CLAUDE.md`** (see §9).

---

## 4. Abstraction Layers — The Heart of the Template

Every swappable service follows the same pattern:

```ts
// 1. Interface (shared contract)
export interface Logger {
  info(msg: string, ctx?: Record<string, unknown>): void;
  error(err: Error, ctx?: Record<string, unknown>): void;
  // ...
}

// 2. Concrete adapters
class SentryLogger implements Logger { /* ... */ }
class ConsoleLogger implements Logger { /* ... */ }
class DatadogLogger implements Logger { /* ... */ }

// 3. Factory / singleton
export function getLogger(): Logger {
  switch (process.env.LOGGER_PROVIDER) {
    case 'sentry': return SentryLogger.getInstance();
    case 'datadog': return DatadogLogger.getInstance();
    default: return ConsoleLogger.getInstance();
  }
}
```

### Layers to build

| Package | Default adapter | Swappable to |
|---|---|---|
| `@boilerplate/logger` | Sentry | Datadog, LogTape, Console |
| `@boilerplate/analytics` | PostHog | Mixpanel, Amplitude, GA4, noop |
| `@boilerplate/cms` | Built-in Supabase CMS | Sanity, Builder.io, Contentful, Strapi |
| `@boilerplate/payments` | Stripe | Lemon Squeezy, Paddle, noop (flag-disabled) |
| `@boilerplate/automations` | n8n | Make, Zapier, Trigger.dev |
| `@boilerplate/docs-engine` | Local Obsidian vault | Notion, Confluence |
| `@boilerplate/feature-flags` | PostHog flags | LaunchDarkly, Unleash, env-based |

Each adapter is independently unit-tested against the shared contract.

### Built-in CMS schema (default)

Supabase tables covering the 80% case: `posts`, `pages`, `media`, `page_blocks` (for flexible rendering), `newsletters`, `subscribers`, `navigation`, `seo_overrides`. Clients who want Sanity swap adapters and disable these tables via migration flag.

---

## 5. Security Architecture

### 5.1 API Proxy Layer (the one you specifically asked for)

The browser **never** calls Supabase directly. Every request goes through `/api/*` routes on the Next.js server.

```
Browser  ──► /api/endpoints/*  ──►  Supabase / Stripe / PostHog
            (Next.js route handler)
            - Validates session
            - Enforces RBAC
            - Rate limits
            - Rewrites errors
            - Logs audit events
            - Never leaks upstream URLs
```

All env vars for upstream services are **server-only** (no `NEXT_PUBLIC_` prefix except for strictly public values like the Supabase publishable key when RLS-gated).

### 5.2 Defense in depth

- **Supabase RLS policies** on every table. Even if the proxy is bypassed, the DB refuses.
- **RBAC** in `packages/auth` with a policy DSL. Roles defined in one place, enforced in both API proxy and RLS.
- **CSP + security headers** via Next.js middleware (`next-safe`). Strict by default.
- **CORS** locked to known origins per environment.
- **Rate limiting** via Upstash or Arcjet in the proxy.
- **Bot protection** via Arcjet (optional flag).
- **Secrets management**: `.env.example` documents every var. `dotenv-vault` or Doppler integration optional. Never commit secrets; GitHub secret scanning enabled.
- **Audit log table** in Supabase, written from the proxy for every mutation. Immutable (RLS prevents update/delete).
- **Secrets rotation**: Terraform outputs rotation schedule; keys named `v1`, `v2` to enable zero-downtime rotation.
- **Env schema validation** via Zod at boot. App refuses to start if a required var is missing.
- **CSRF** tokens on all state-changing requests.
- **Input validation** with Zod at every entry point (API route handlers and server actions).
- **Content security** for uploads: MIME sniffing, size limits, virus scanning hook.

---

## 6. Frontend Architecture

### 6.1 Unstyled component library

`packages/ui` exposes purely presentational components (Button, Input, Select, Dialog, Tabs, DataTable, etc.) built on Headless UI primitives. **Zero color, zero spacing opinions.** Each project provides its own theme token file.

### 6.2 SEO enforcement (non-negotiable)

Every page in `apps/web` MUST export:
- `generateMetadata` (Next.js metadata API)
- A `<JsonLd>` component with valid schema.org structured data (type varies: Article, Product, Organization, etc.)
- `og:*` and `twitter:*` tags via the metadata object

Enforced via:
- A custom ESLint rule (`no-page-without-metadata`) that fails CI if a route is missing `generateMetadata`
- A Playwright audit test that crawls every route and asserts presence of JSON-LD, canonical, OG tags
- A `<PageShell>` higher-order component in `packages/ui` that requires SEO props as TypeScript-enforced parameters

Bundled automatically: `sitemap.xml`, `robots.txt`, `/llms.txt`, canonical URLs, hreflang (when i18n enabled).

### 6.3 Feature flags

Every optional feature (Stripe checkout, newsletter, comments, etc.) sits behind a flag. Default build = flags off = clean slate. Flip an env var to activate. Centralized in `packages/feature-flags`.

---

## 7. Infrastructure & Deployment

### 7.1 Docker

- `docker-compose.dev.yml` — local full stack: Next.js dev server, Supabase (via `supabase start`), PostHog (optional), Mailhog, Docusaurus docs.
- `docker-compose.yml` — production-style standalone builds for self-hosting.
- Multi-stage `Dockerfile` per app. Next.js in `output: 'standalone'` mode.

One command: `pnpm dev:docker` → everything is up.

### 7.2 Terraform

`infra/terraform/` provisions:
- Supabase project (via official provider)
- Vercel project & domains
- DNS records (Cloudflare)
- GitHub repo secrets (via tfe_outputs)
- Sentry project, PostHog project

Per-client: `terraform workspace new client-x`, set variables, `terraform apply`. Done.

### 7.3 GitHub Actions

Pre-configured workflows — only action needed is pasting secrets into GitHub → Settings → Secrets.

| Workflow | Trigger | Job |
|---|---|---|
| `ci.yml` | Every PR | Lint, typecheck, unit + integration tests, build |
| `e2e.yml` | Every PR | Playwright against preview deploy |
| `deploy-preview.yml` | PR open/update | Vercel preview + Supabase branch |
| `deploy-prod.yml` | Push to `main` | Vercel prod + Supabase migration apply |
| `terraform.yml` | Changes under `infra/terraform/**` | Plan on PR, apply on merge |
| `security.yml` | Weekly + push | `pnpm audit`, CodeQL, Semgrep, secret scanning |
| `docs-sync.yml` | Push | Regenerate Obsidian wiki from code comments/ADRs |

Required secrets documented in `CLAUDE.md` and `.github/SECRETS.md`.

---

## 8. Testing Strategy — Tested Once, Reused Forever

Unit tests are a first-class citizen. The boilerplate ships **high coverage on the reusable layers** so forks never need to re-test them.

### 8.1 What gets tested

| Surface | Target coverage | Tool |
|---|---|---|
| Abstraction adapters (every logger, analytics, CMS, payments adapter) | 95%+ | Vitest |
| `packages/ui` components | 90%+ (behavior, a11y) | Vitest + Testing Library + jest-axe |
| API proxy routes | 90%+ | Vitest + msw |
| Auth / RBAC policies | 100% | Vitest (property-based with fast-check for permission matrices) |
| Supabase RLS policies | 100% | `supabase-js` integration tests against local DB |
| Zod schemas | 100% | Vitest |
| Critical user flows | Smoke | Playwright |
| SEO enforcement | Every route | Playwright audit |

### 8.2 Enforcement

- CI fails if coverage drops below threshold on the `packages/*` libraries.
- Every abstraction's contract has a **shared test suite** that any new adapter must pass before it's accepted.
- `pnpm test:contract` runs the contract suite against all adapters.

---

## 9. AI Agent Integration

### 9.1 `CLAUDE.md` per folder

Every meaningful folder has its own `CLAUDE.md` containing:

1. **Purpose** — what this folder is for, one paragraph.
2. **Entry points** — where to start reading.
3. **Architectural rules** — what must be true of code here.
4. **Forbidden patterns** — things never to do (e.g., "never import from `apps/*` inside `packages/*`").
5. **Abstraction guidance** — if this folder uses a layer, how to use it.
6. **Security constraints** — relevant guardrails.
7. **Testing requirements** — what must be tested before merging.
8. **Common tasks** — recipes for "add a new page", "add a new adapter", "add a new API route".
9. **Pointers** — links to ADRs, related CLAUDE.md files, external docs.

Example: `packages/logger/CLAUDE.md` tells an agent exactly how to add a new logger adapter, which tests to write, and which contracts to satisfy.

### 9.2 Claude skills (`.claude/skills/`)

Bundled skills agents pull in automatically:

| Skill | Purpose |
|---|---|
| `add-feature` | Full walkthrough for scaffolding a new feature (route, API proxy, DB migration, RLS, types, tests, docs). |
| `add-adapter` | Template for adding a new adapter to any abstraction layer. |
| `write-adr` | Architecture Decision Record generator that files into `knowledge/decisions/`. |
| `record-decision` | Saves a business/architectural decision into the knowledge base during development. |
| `generate-migration` | Generates a Drizzle/Supabase migration with RLS policies scaffolded. |
| `audit-security` | Security checklist runner against a given feature/PR. |
| `seo-audit` | Validates JSON-LD and metadata on a given route. |
| `sync-knowledge` | Compiles `knowledge/raw/` into structured wiki articles (Karpathy LLM-Wiki pattern). |

### 9.3 Long-term memory: Obsidian-style vault

`knowledge/` is a markdown vault with wikilinks (`[[double bracket]]`). Structure:

- `knowledge/_index.md` — top-level map.
- `knowledge/architecture/` — how the system fits together.
- `knowledge/decisions/` — ADRs. Every notable decision lives here with date, context, options, decision, consequences.
- `knowledge/features/` — per-feature documentation, linked bidirectionally to code.
- `knowledge/raw/` — drop zone. Paste in meeting notes, transcripts, research; the `sync-knowledge` skill compiles them into wiki articles with backlinks.

Humans open the vault in Obsidian. Agents read it as plain markdown. Both win.

Optional adapters via `packages/docs-engine`: push the same content to Notion or Confluence for non-technical stakeholders.

---

## 10. Implementation Phases

### Phase 1 — Foundation (week 1)
Monorepo scaffold (Turborepo + pnpm), `packages/config`, `packages/types`, Docker Compose, Supabase local, Next.js app skeleton, GitHub Actions skeleton, root `CLAUDE.md`, `knowledge/` vault scaffolding.

### Phase 2 — Security rails (week 2)
API proxy layer, auth + RBAC, RLS policy conventions, CSP/CORS middleware, env schema (Zod), audit log table, secret scanning in CI.

### Phase 3 — Abstraction layers (weeks 3–4)
`@boilerplate/logger`, `@boilerplate/analytics`, `@boilerplate/payments`, `@boilerplate/cms` (with built-in adapter + Sanity adapter), `@boilerplate/automations`, `@boilerplate/feature-flags`, `@boilerplate/docs-engine`. Contract test suites for each.

### Phase 4 — UI library (week 5)
`packages/ui` with Headless UI primitives, theme token system, Storybook, a11y tests, SEO components (`<PageShell>`, `<JsonLd>`).

### Phase 5 — Infrastructure as code (week 6)
Terraform modules for Supabase, Vercel, DNS, Sentry, PostHog. Per-environment workspaces.

### Phase 6 — AI tooling (week 7)
All per-folder `CLAUDE.md` files, Claude skills, knowledge sync pipeline, LLM-friendly documentation generation.

### Phase 7 — Hardening & docs (week 8)
Coverage push, E2E suite, SEO audit tests, Docusaurus site, example client fork walkthrough, public README.

---

## 11. Pros, Cons, Pitfalls

### Pros
- Ship new client projects in hours, not weeks.
- Consistent architecture across every project → faster debugging, easier handoffs.
- Security posture is the same on project 1 and project 50.
- AI agents become genuinely productive from day one on any fork.

### Cons
- Heavy initial investment (estimate: 6–8 weeks for one developer to reach v1).
- Abstraction layers add indirection; some clients may find this over-engineered for throwaway MVPs.
- Every abstraction is another thing to maintain. Discipline required: adapters must follow the contract, or the model breaks down.
- Turborepo learning curve if unfamiliar.

### Pitfalls to avoid
- **Over-abstracting.** If only one provider will ever be used, skip the abstraction. Add adapters when the second provider appears, not before. (Exception: logger, analytics, CMS — these almost always vary per client.)
- **Leaking backend identity through the proxy.** Review error messages and response shapes — never echo upstream errors.
- **Letting RLS drift from RBAC.** The policy DSL should generate both. Otherwise they diverge.
- **CLAUDE.md files going stale.** Add a CI check that every new top-level file in a folder appears in that folder's CLAUDE.md within 2 PRs, or flag it.
- **Monorepo deploy coupling.** Vercel should only redeploy apps whose dependency graph changed. Turbo's remote cache + Vercel's `ignoreCommand` handles this.

---

## 12. What's NOT in scope (intentionally)

- Mobile apps (could be added as `apps/mobile` with Expo later).
- Email templating engine — use Resend + React Email when needed per-project.
- Multi-tenancy — add when a client actually needs it; don't pre-build.
- i18n — add the `next-intl` config when the first project needs it.

---

## 13. Next steps

1. Review this plan, flag anything misaligned or missing.
2. Decide on the repo name and license (MIT recommended if open-sourcing).
3. Create the GitHub repo and attach a project to this conversation.
4. Kick off Phase 1.

Once the project is attached, I can begin scaffolding immediately — starting with the monorepo skeleton, root `CLAUDE.md`, and the first abstraction layer contract.
