# `infra/` — Infrastructure as code

## Purpose

Everything that provisions, packages, or deploys the application. Today this is Docker only; Terraform modules land in a later phase.

## Entry points

- `docker/web.Dockerfile` — multi-stage build for `apps/web` Next.js standalone mode.
- `../docker-compose.yml` at repo root — production-like self-host stack.

## Architectural rules

1. **Dockerfiles are reproducible.** Pinned base image tags, no `:latest`. If a Node LTS version bumps, update `.nvmrc` + every Dockerfile together.
2. **Multi-stage is mandatory.** Runtime images never ship build tools, `devDependencies`, or source maps.
3. **Non-root user.** Every runtime stage runs as `nextjs:nodejs` (uid 1001), never root.
4. **Healthchecks are wired in.** Every runtime service exposes `/api/health` or equivalent so the orchestrator knows when it's live.

## Forbidden patterns

- Installing packages at runtime (`apk add` in the runner stage).
- Copying `node_modules` across stages instead of `pnpm install --prod`.
- Hardcoding env values in the Dockerfile — always pass via build args or compose env files.

## Common tasks

- **Build the image:** `docker build -f infra/docker/web.Dockerfile -t startup-boilerplate-web:latest .`
- **Bring the stack up:** `docker compose up --build` from the repo root.
- **Tear down + drop data:** `docker compose down -v`.

## Pointers

- Root instructions: `../CLAUDE.md`
- Deploy architecture (future): `../knowledge/architecture/deploy.md`
