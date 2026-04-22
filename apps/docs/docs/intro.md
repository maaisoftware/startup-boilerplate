---
sidebar_position: 1
---

# Getting started

Welcome to **Startup Boilerplate** — a production-grade, AI-ready monorepo template for rapidly bootstrapping new client projects with consistent architecture, security, and tooling.

This documentation site is the public-facing reference. For the internal knowledge vault (ADRs, architecture notes, decision records), see `knowledge/` in the repository.

## What's inside

- **Next.js 16 App Router** frontend with typed env validation
- **Supabase** (Postgres 17) for auth + database, local via Docker
- **Interface + adapter + factory** pattern for every external dependency
  (logger, analytics, feature-flags, payments, CMS, automations)
- **Row-Level Security** with property-based tests for RBAC
- **CSRF**, rate limiting, Zod validation at every entry point
- **Terraform** modules for Supabase + Vercel + Cloudflare DNS + Sentry
- **Docker** + `docker-compose` for self-hosted deploys

## Quick start

```bash
pnpm install
cp .env.example .env.local  # fill in the required values
supabase start              # boots local Postgres, Studio, Inbucket
pnpm dev                    # http://localhost:3000
```

Continue with the pages listed in the sidebar.
