---
title: Monorepo structure — Turborepo + pnpm workspaces
created: 2026-04-20
updated: 2026-04-20
status: accepted
related: [../architecture/monorepo-structure, 0002-abstraction-layers]
deciders: [Marlon Espinosa, Claude Opus 4.7]
---

# 0001 — Monorepo structure: Turborepo + pnpm workspaces

## Context

This template needs to ship many small packages — one per abstraction layer, one per app, plus shared configs. The goals:

- **Fast incremental builds** when an agency forks the repo and modifies a single package.
- **One `pnpm install`** that wires every package together without lift-and-shift errors.
- **Clean dependency direction** — apps depend on packages; packages never depend on apps.
- **Industry-standard tooling** so any engineer walking into a fork recognizes the layout.

## Options considered

### Option A — Turborepo + pnpm workspaces

- Turborepo handles task orchestration (`pnpm build` → topological build of every package).
- pnpm workspaces handle dependency resolution via the `workspace:*` protocol.
- Remote caching available via Turborepo Cloud when the user opts in.
- Industry standard in the agency/SaaS space.

**Pros:** fast, well-documented, large community, Vercel-first-class support (Turborepo is a Vercel project), good Next.js integration.
**Cons:** two tools to learn (Turborepo and pnpm). Turborepo's cache invalidation rules take some study.

### Option B — Nx

- More powerful plugin system, better for polyglot monorepos.
- Richer project graph / affected-change detection.

**Pros:** more features, better for very large repos.
**Cons:** heavier, more opinionated, steeper learning curve. Overkill for a TypeScript-only monorepo.

### Option C — pnpm workspaces alone (no Turborepo)

- Simplest possible setup.

**Pros:** one fewer tool.
**Cons:** no pipeline caching, no parallelism, every `pnpm build` rebuilds everything. Doesn't scale past 3–4 packages.

## Decision

**Option A — Turborepo + pnpm workspaces.** Industry standard, sufficient for our scale, best Next.js story. The learning curve is acceptable because every agency developer has seen it before.

Specifically:
- `turbo.json` defines the pipeline with per-task inputs/outputs.
- `pnpm-workspace.yaml` declares `apps/*` and `packages/*`.
- Packages use the `workspace:*` protocol in `package.json`.
- Root scripts (`pnpm dev`, `pnpm build`, `pnpm test`) call through Turborepo.

## Consequences

### Positive

- `pnpm install` at the root wires everything.
- `pnpm build` only rebuilds what changed (Turborepo cache).
- New packages are auto-detected by the workspace glob.
- Vercel deploys honor Turborepo's `ignoreCommand` to skip unaffected apps.

### Negative

- Agents must remember to declare all `globalEnv` in `turbo.json` — if a new env var isn't listed, Turborepo caches across env changes and you get stale outputs. Documented in `CLAUDE.md`.
- Turborepo's strict input/output tracking requires care when adding new scripts.

### Follow-ups

- PR #2: add `packages/config` presets so every package shares one ESLint / Prettier / Vitest config.
- Future: enable remote cache (Turborepo Cloud) once the project has a team using it.

## References

- Related: [[../architecture/monorepo-structure]]
- External:
  - [Turborepo docs](https://turborepo.com/docs)
  - [pnpm workspace protocol](https://pnpm.io/workspaces)
