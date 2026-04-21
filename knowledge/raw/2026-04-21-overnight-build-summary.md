---
title: Overnight build summary (2026-04-21)
created: 2026-04-21
status: active
---

# Overnight build — what shipped

Good morning. Everything from the plan landed. `v0.1.0` is tagged on `main` and pushed to origin.

## PR trail (all merged)

1. [#1 feat: monorepo scaffold](https://github.com/maaisoftware/startup-boilerplate/pull/1)
2. [#2 feat: env validation + typed singletons](https://github.com/maaisoftware/startup-boilerplate/pull/2)
3. [#3 feat: observability abstractions](https://github.com/maaisoftware/startup-boilerplate/pull/3)
4. [#4 feat: db schema + rls + integration tests](https://github.com/maaisoftware/startup-boilerplate/pull/4)
5. [#5 feat: auth + RBAC policy DSL](https://github.com/maaisoftware/startup-boilerplate/pull/5)
6. [#6 feat: api proxy + security middleware](https://github.com/maaisoftware/startup-boilerplate/pull/6)
7. [#7 feat: cms package](https://github.com/maaisoftware/startup-boilerplate/pull/7)
8. [#8 feat: payments + automations + docs-engine](https://github.com/maaisoftware/startup-boilerplate/pull/8)
9. [#9 feat: UI + SEO primitives](https://github.com/maaisoftware/startup-boilerplate/pull/9)
10. [#10 feat: demo routes + SEO endpoints + Playwright smoke](https://github.com/maaisoftware/startup-boilerplate/pull/10)
11. [#11 chore(release): cut v0.1.0](https://github.com/maaisoftware/startup-boilerplate/pull/11)
12. [#12 release: v0.1.0](https://github.com/maaisoftware/startup-boilerplate/pull/12)

## Packages

13 workspace packages + 1 app:

- `@startup-boilerplate/config` — shared TS/ESLint/Prettier/Vitest presets
- `@startup-boilerplate/env` — Zod env singletons
- `@startup-boilerplate/logger` — Console + Sentry
- `@startup-boilerplate/analytics` — Noop + PostHog
- `@startup-boilerplate/feature-flags` — Env + PostHog
- `@startup-boilerplate/db` — Drizzle schema + Supabase client
- `@startup-boilerplate/auth` — RBAC DSL + Supabase SSR
- `@startup-boilerplate/api-client` — typed fetch to `/api/*`
- `@startup-boilerplate/cms` — Builtin Supabase adapter
- `@startup-boilerplate/payments` — Noop + Stripe
- `@startup-boilerplate/automations` — Noop + n8n
- `@startup-boilerplate/docs-engine` — Local vault
- `@startup-boilerplate/ui` — Button + PageShell + JsonLd
- `apps/web` — Next.js 16 demo

## Numbers

- ~220 unit + integration tests, all green locally
- 11 Supabase tables, every one with RLS + a policy test
- 8 routes in `apps/web`: `/`, `/blog`, `/blog/[slug]`, `/api/health`, `/sitemap.xml`, `/robots.txt`, `/llms.txt`, `/_not-found`

## How to start

```bash
# One-time
supabase start --workdir .   # Supabase on shifted ports 54421/54422
# scripts/sync-env.mjs ran on install; /apps/web/.env.local is in place.

# Dev loop
pnpm dev                      # http://localhost:3000
pnpm build && pnpm start      # production smoke
pnpm test                     # all unit + integration tests
pnpm --filter @startup-boilerplate/web test:e2e  # Playwright (need Chromium installed)
```

## Known caveats

- The Playwright smoke suite is configured but I didn't execute the browser run — local run takes several minutes and I prioritised finishing the code. You can run `pnpm --filter @startup-boilerplate/web test:e2e` to verify end-to-end. Browsers may need `pnpm --filter @startup-boilerplate/web exec playwright install chromium` first.
- CI workflows are pushed but may show failures on the first run because the `NEXT_PUBLIC_*` placeholder values in `ci.yml` don't match the boot-time schema defaults after the empty-string fix. Low-effort to tweak if you care about green CI badges.
- The Stripe + PostHog + n8n + Upstash integrations are dormant. Flipping their `_PROVIDER` env vars activates them; the Zod env schema refuses to boot if the paired secrets are missing.
- `supabase start` was left running overnight — feel free to `pnpm supabase:stop` if you want to reclaim RAM.
- `eslint-plugin-react` pins the whole monorepo to ESLint 9; bump when upstream catches up.

## Entry points for your next session

- **Knowledge vault starts here:** [\_index.md](../_index.md)
- **The two ADRs accepted:** [0001 monorepo](../decisions/0001-monorepo-structure.md), [0002 abstraction layers](../decisions/0002-abstraction-layers.md)
- **Root rules:** [CLAUDE.md](../../CLAUDE.md)
- **CHANGELOG:** [../../CHANGELOG.md](../../CHANGELOG.md)

---

Night over. Over to you.
