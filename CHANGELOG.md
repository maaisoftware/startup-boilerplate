# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `@startup-boilerplate/env`: Zod-validated environment singletons with typed server/client split, 100% test coverage, boot-time validation via Next.js instrumentation hook (PR #2).
- `scripts/sync-env.mjs`: synchronises the root `.env.local` into each app directory via a `postinstall` hook so Next.js reads from one canonical source (PR #2).
- `packages/config/tsconfig/next.json`: `allowImportingTsExtensions` enabled so workspace packages can be consumed from source without a build step (PR #2).
- Monorepo scaffold: Turborepo + pnpm workspaces, Node 22 LTS, TS 6.0, ESLint 9.39, Prettier 3.8 (PR #1).
- `apps/web`: Next.js 16 App Router with Tailwind v4, standalone output, `/api/health` liveness probe (PR #1).
- `packages/config`: shared TS / ESLint / Prettier / Vitest presets (PR #1).
- Root `CLAUDE.md` and per-folder `CLAUDE.md` files for AI-agent onboarding (PR #1).
- `knowledge/` vault: ADR infrastructure, architecture overview, first accepted ADR (0001) on monorepo choice (PR #1).
- Supabase local project: `config.toml` with shifted ports (+100 from defaults), migrations/seed scaffolding (PR #1).
- Husky + lint-staged + commitlint (conventional-commits enforced at commit time) (PR #1).
- GitHub Actions: `ci.yml` (lint, typecheck, test, build, commitlint, format-check), `security.yml` (pnpm audit, CodeQL, Gitleaks) (PR #1).
- PR template, issue templates, security policy, code of conduct, MIT license (PR #1).
- Docker production stack: multi-stage `infra/docker/web.Dockerfile` + root `docker-compose.yml` (PR #1).
- `.env.example` with every documented env var (PR #1).
- `.gitattributes` normalising line endings to LF; `.dockerignore`; VSCode workspace settings + extension recommendations (PR #1).

### Fixed

- ESLint peer-dep incompatibility resolved by pinning to 9.39.4 (eslint-plugin-react has not released ESLint 10 support).
- TypeScript 6 `baseUrl` deprecation: removed in `apps/web/tsconfig.json`; path aliases now resolved relative to each tsconfig file.

## [0.1.0] — _pending_

First tagged release. Will be cut after PR #10.
