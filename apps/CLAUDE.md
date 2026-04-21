# `apps/` — Deployable applications

## Purpose
User-facing applications. Today there is only `apps/web`. Future additions (`apps/admin`, `apps/mobile`, `apps/docs`) will each live in their own subdirectory with their own `CLAUDE.md`.

## Architectural rules
1. **Apps consume packages; packages never import from apps.** Enforced by the monorepo structure — a package-level `import "~/..."` referencing an app is a bug.
2. **Every app is independently deployable.** No shared runtime state across apps.
3. **Every app has its own `eslint.config.mjs`, `tsconfig.json`, and `package.json`.** It extends shared presets from `packages/config`, never inlines them.

## Forbidden patterns
- Putting business logic that multiple apps need inside one app — extract to a package.
- Cross-app runtime imports — they would break independent deploys.

## Common tasks
- **Add a new app:** `mkdir apps/<name>`, copy `apps/web`'s `package.json` as a template, prune unused deps, add a CLAUDE.md explaining the app's purpose, wire it into Turborepo (already picked up by `pnpm-workspace.yaml`).

## Pointers
- Next.js app: `./web/CLAUDE.md`
- Root instructions: `../CLAUDE.md`
