# Startup Boilerplate — Root Agent Instructions

Welcome, agent. This repository is a **production-grade, AI-native monorepo template**. Every rule below exists for a reason — read it before you write anything.

## What this repo is
A reusable starter kit. Cloning it should give a team everything needed to ship a new client product: monorepo, DB, auth, CMS, payments, observability, CI/CD, and documentation — all wired correctly and tested.

Every third-party service hides behind an **adapter + factory**. Swapping providers is an env var change, not a code rewrite.

## Non-negotiable rules

1. **Never call `console.*`.** Use `getLogger()` from `@startup-boilerplate/logger`. This is enforced by the `no-console` ESLint rule.
2. **Never import from `apps/*` into `packages/*`.** Packages are libraries; apps consume them. The reverse creates a cycle we can't untangle.
3. **Never call upstream services (Supabase, Stripe, PostHog, etc.) directly from the browser.** Every outbound request goes through `/api/*` in `apps/web`. The API proxy validates auth, enforces RBAC, rate-limits, rewrites errors, and writes audit log entries. See `knowledge/architecture/api-proxy.md`.
4. **Never add a new page without `generateMetadata`.** Routes missing SEO metadata fail CI via a custom ESLint rule.
5. **Every abstraction layer has a contract test suite.** New adapters pass that suite before they land. Run `pnpm test:contract` to verify.
6. **Every meaningful folder has a `CLAUDE.md`.** When you add a new top-level folder, add its `CLAUDE.md` in the same PR. Stale or missing CLAUDE.md files are bugs.
7. **Commits are atomic and conventional.** Format: `type(scope): subject`. Types: `feat`, `fix`, `docs`, `test`, `chore`, `refactor`, `perf`, `ci`, `build`, `style`. Commitlint rejects anything else.
8. **Tests run before merge.** No PR to `develop` merges without `pnpm lint && pnpm typecheck && pnpm test` passing. E2E suite runs against `develop` on every push.

## Directory map

| Path | Purpose |
|---|---|
| `apps/web/` | Next.js App Router — the only app (for now). Proxy and UI live here. |
| `packages/config/` | Shared TS/ESLint/Prettier/Vitest presets. |
| `packages/types/` | Shared TypeScript types + Zod schemas (added PR #2). |
| `packages/logger/` | Logger abstraction (PR #3). |
| `packages/analytics/` | Analytics abstraction (PR #3). |
| `packages/feature-flags/` | Feature-flag abstraction (PR #3). |
| `packages/db/` | Drizzle schema, migrations, seed scripts (PR #4). |
| `packages/auth/` | Auth utilities and RBAC DSL (PR #5). |
| `packages/api-client/` | Typed client that only hits `/api/*` (PR #6). |
| `packages/cms/` | CMS abstraction (PR #7). |
| `packages/payments/` | Payments abstraction, feature-flagged (PR #8). |
| `packages/automations/` | Workflow abstraction (PR #8). |
| `packages/docs-engine/` | Documentation abstraction (PR #8). |
| `packages/ui/` | Headless UI primitives + `<PageShell>` + `<JsonLd>` (PR #9). |
| `supabase/` | Migrations, edge functions, `config.toml`. |
| `infra/docker/` | Dockerfiles and compose files. |
| `knowledge/` | Obsidian-style vault. ADRs live here. |
| `.github/` | CI/CD workflows, issue/PR templates. |
| `.claude/` | Shared skills and slash commands. |

## How to work here

1. **Start in the right CLAUDE.md.** Every folder has one. Read the folder's rules before editing inside it.
2. **Read the ADR for the area you're touching.** `knowledge/decisions/` is the source of truth for "why." If you think a decision needs revisiting, write a new ADR that supersedes the old one — don't silently change code.
3. **When you change a contract, run the contract test suite.** `pnpm test:contract` verifies every adapter still honors its interface.
4. **When you change an adapter, run its package's tests.** Coverage threshold per package: lines ≥ 90, functions ≥ 90, branches ≥ 85, statements ≥ 90. Abstraction adapters push these to 95%+.
5. **Update documentation as you code.** New features in `knowledge/features/`, new decisions in `knowledge/decisions/`. The `sync-knowledge` Claude skill compiles raw notes from `knowledge/raw/` into wiki pages.

## Environment

- `.env.example` documents every variable.
- `.env.local` is the single source of truth at runtime. Git-ignored.
- Boot-time Zod validation (PR #2) refuses to start if required vars are missing.
- Provider selection vars (`LOGGER_PROVIDER`, `ANALYTICS_PROVIDER`, …) pick adapters at startup. Defaults resolve to **zero-external-service adapters** so the app runs fully offline out of the box.
- Docker Compose boots the full local stack: Next.js, Supabase, mailpit, docs.
- `pnpm dev:docker` spins everything up in one command.

## Git workflow

- `main`: stable, tagged releases only.
- `develop`: integration branch. Every feature PR targets `develop`.
- `feat/*`, `fix/*`, `chore/*`: feature branches. Branch off `develop`.
- PRs: atomic commits, conventional format, code-review skill runs before merge.
- Merge strategy: squash. `develop` → `main` merges are release cuts with a tag.

## Security

- Secrets never commit. `.gitignore` blocks `.env*` except `.env.example`.
- Server-only env vars never get `NEXT_PUBLIC_` prefix.
- Supabase RLS policies on every table. Even if the proxy is bypassed, the DB refuses.
- RBAC policy DSL in `packages/auth` is the single source of truth — it generates both API-layer guards and (where possible) RLS policies.
- CSRF tokens on all state-changing requests.
- Rate limiting on every `/api/*` route (in-memory default, Upstash adapter available).
- Audit log table records every mutation. Immutable: RLS prevents update/delete.

## When something breaks

- Check your folder's `CLAUDE.md` first.
- Check the ADR for the affected area.
- Run `pnpm lint && pnpm typecheck && pnpm test`. Most issues surface there.
- If a contract test fails, you changed an interface without updating adapters. Fix the adapters.
- If an RLS integration test fails, the policy drifted from the RBAC DSL. Fix both.
- If tests pass but integration breaks, read `knowledge/architecture/`.

## Skills and slash commands

`.claude/skills/` contains shared agent skills. Top ones:
- `add-feature` — scaffolds a new feature end-to-end.
- `add-adapter` — adds an adapter to any abstraction layer.
- `write-adr` — creates a dated ADR in `knowledge/decisions/`.
- `audit-security` — runs the security checklist against a PR.
- `seo-audit` — validates JSON-LD and metadata on a given route.
- `sync-knowledge` — compiles `knowledge/raw/` into wiki pages.

Invoke them via `Skill` tool (Claude Code) or the equivalent in your runtime.

---

**If you're about to break a rule, write an ADR first.** Rules exist to be challenged — but only in writing, with context, and with the team's consent.
