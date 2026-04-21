---
title: Architecture Overview
created: 2026-04-20
updated: 2026-04-20
status: active
related: [monorepo-structure, abstraction-layers, api-proxy, security-model]
---

# Architecture Overview

One-screen summary of the whole template.

## What it is

A **production-grade, AI-native monorepo template**. Every new client project forks this, swaps env vars, and starts shipping business logic immediately. Infrastructure, tooling, security, and AI-assistance concerns are solved once, for all forks.

## Shape

```
Browser ──► apps/web (Next.js App Router)
              ├─ /*           pages (static or SSR, always with generateMetadata + JsonLd)
              └─ /api/*       proxy layer (validates session, enforces RBAC, rate-limits,
                              rewrites errors, logs audit events)
                  │
                  ▼
              Supabase (Postgres + Auth + Storage)
              Stripe (feature-flagged)
              PostHog / Sentry / n8n (adapter-swappable)
```

The browser **never** calls upstream services directly. That's the central security invariant.

## Packages

Every third-party concern hides behind an abstraction:

| Abstraction                          | Default adapter   | Swappable to                      |
| ------------------------------------ | ----------------- | --------------------------------- |
| `@startup-boilerplate/logger`        | Sentry            | Console (local), Datadog, LogTape |
| `@startup-boilerplate/analytics`     | PostHog           | Mixpanel, GA4, noop               |
| `@startup-boilerplate/cms`           | Built-in Supabase | Sanity, Builder.io, Contentful    |
| `@startup-boilerplate/payments`      | Stripe            | Lemon Squeezy, Paddle, noop       |
| `@startup-boilerplate/automations`   | n8n               | Make, Zapier, Trigger.dev         |
| `@startup-boilerplate/docs-engine`   | Local vault       | Notion, Confluence                |
| `@startup-boilerplate/feature-flags` | PostHog           | Env-based, LaunchDarkly, Unleash  |

Every abstraction has a **contract test suite**: any new adapter must pass it before landing.

## Security rails

- [[api-proxy]]: every outbound call validated, rate-limited, audit-logged.
- Supabase RLS policies on every table: even if the proxy is bypassed, the DB refuses.
- [[security-model#RBAC]]: policy DSL in `packages/auth` is the single source of truth; it generates API-layer guards AND feeds RLS policy generation.
- CSP + security headers via the Next.js Proxy layer (`apps/web/src/proxy.ts`). See [[../decisions/0003-proxy-vs-auth]] for why auth lives per-handler, not here.
- CSRF tokens on all state-changing requests.
- Input validation with Zod at every entry point.
- Audit log table written on every mutation. Immutable.

## AI-native

- Every folder has a `CLAUDE.md` with purpose, rules, forbidden patterns, common tasks.
- `knowledge/` vault (this folder) holds ADRs, architecture docs, feature specs — LLM-readable, human-navigable via Obsidian.
- `.claude/skills/` ships reusable agent skills (add-feature, add-adapter, write-adr, etc.).

## What's NOT in scope

- Mobile (add `apps/mobile` with Expo when the first project needs it).
- i18n (add `next-intl` when the first project needs it).
- Email templating (use Resend + React Email per-project).
- Multi-tenancy (add when a client actually needs it).

## Further reading

- [[monorepo-structure]] for directory layout rationale.
- [[abstraction-layers]] for the interface + adapter + factory pattern.
- [[api-proxy]] for the proxy design.
- [[security-model]] for defense-in-depth details.
- [[testing-strategy]] for what gets tested and why.
- [[boilerplate-plan]] for the original plan document.
