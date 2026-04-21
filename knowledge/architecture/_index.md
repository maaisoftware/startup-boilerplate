---
title: Architecture
created: 2026-04-20
updated: 2026-04-20
status: active
related: [decisions/_index, features/_index]
---

# Architecture

How the system fits together. The documents here describe the big-picture shape of the template — what each layer does, how requests flow, which invariants hold.

## Start here

- **[[overview]]** — one-screen summary of the whole template.
- **[[monorepo-structure]]** — why Turborepo + pnpm, what lives where.
- **[[abstraction-layers]]** — the interface + adapter + factory pattern used everywhere.
- **[[api-proxy]]** — the one-layer security moat between browser and upstream services.
- **[[security-model]]** — RLS, RBAC, CSRF, rate limiting, audit logging — the full defense-in-depth picture.
- **[[seo-discipline]]** — SEO is not optional here, it's enforced.
- **[[testing-strategy]]** — what gets tested, at what level, with what coverage target.

## Source documents

The original architectural plan lives at **[[boilerplate-plan]]**. Everything in this folder derives from that plan plus subsequent ADRs.
