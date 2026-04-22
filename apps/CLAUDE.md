# `apps/` — Deployable applications

## Purpose

User-facing applications. Today: `apps/web` (Next.js frontend on port 3000) and `apps/docs` (Docusaurus documentation site on port 3100). Future additions (`apps/admin`, `apps/mobile`) will each live in their own subdirectory with their own `CLAUDE.md`.

## Architectural rules

1. **Apps consume packages; packages never import from apps.** Enforced by the monorepo structure — a package-level `import "~/..."` referencing an app is a bug.
2. **Every app is independently deployable.** No shared runtime state across apps.
3. **Every app has its own `eslint.config.mjs`, `tsconfig.json`, and `package.json`.** It extends shared presets from `packages/config`, never inlines them.

## Forbidden patterns

- Putting business logic that multiple apps need inside one app — extract to a package.
- Cross-app runtime imports — they would break independent deploys.

## Common tasks

- **Add a new app:** `mkdir apps/<name>`, copy `apps/web`'s `package.json` as a template, prune unused deps, add a CLAUDE.md explaining the app's purpose, wire it into Turborepo (already picked up by `pnpm-workspace.yaml`).
- **Run two apps' `dev` scripts together:** Turbo runs persistent tasks in parallel by default — just add a `dev` script to the new app and it participates. Do NOT reintroduce `turbo run dev --parallel` at the root (deprecated in Turbo 2.x). If one app's dev should always start alongside another's (e.g. a frontend + a companion API), declare it with the `with` field in the dependent app's `turbo.json`: `"dev": { "persistent": true, "with": ["@startup-boilerplate/api#dev"] }`.

## Pointers

- Next.js app: `./web/CLAUDE.md`
- Docs site (Docusaurus): `./docs/CLAUDE.md`
- Root instructions: `../CLAUDE.md`
