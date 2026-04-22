# `infra/` — Infrastructure as code

## Purpose

Everything that provisions, packages, or deploys the application. Two pillars: Docker for packaging + local self-host, and Terraform for the hosted-cloud stack (Supabase, Vercel, Cloudflare DNS, Sentry, GitHub Actions secrets).

## Entry points

- `docker/web.Dockerfile` — multi-stage build for `apps/web` Next.js standalone mode.
- `../docker-compose.yml` at repo root — production-like self-host stack.
- `terraform/modules/*` — reusable modules (`supabase`, `vercel`, `cloudflare-dns`, `github-secrets`, `sentry`).
- `terraform/environments/example/` — copyable root module wiring the modules into one environment.
- `terraform/README.md` — per-env workflow + what's automated vs manual.

## Architectural rules

1. **Dockerfiles are reproducible.** Pinned base image tags, no `:latest`. If a Node LTS version bumps, update `.nvmrc` + every Dockerfile together.
2. **Multi-stage is mandatory.** Runtime images never ship build tools, `devDependencies`, or source maps.
3. **Non-root user.** Every runtime stage runs as `nextjs:nodejs` (uid 1001), never root.
4. **Healthchecks are wired in.** Every runtime service exposes `/api/health` or equivalent so the orchestrator knows when it's live.
5. **Terraform provider versions are pinned to a minor range** (`~>`). Bump as part of an intentional PR — never auto-update.
6. **No state in git.** `.gitignore` blocks `*.tfstate*`, `*.tfvars` (except the `.example`), and `.terraform/`. Remote backends (Terraform Cloud / S3) hold state.
7. **Sensitive outputs must be flagged.** Any `output` whose value is a secret sets `sensitive = true` so `terraform apply` doesn't print it in plaintext.

## Forbidden patterns

- Installing packages at runtime (`apk add` in the runner stage).
- Copying `node_modules` across stages instead of `pnpm install --prod`.
- Hardcoding env values in the Dockerfile — always pass via build args or compose env files.
- Committing `terraform.tfvars` files with real values, or any `*.tfstate*`.
- Hardcoding real tokens / DSNs / zone IDs in a module — use variables.

## Common tasks

- **Build the image:** `docker build -f infra/docker/web.Dockerfile -t startup-boilerplate-web:latest .`
- **Bring the stack up:** `docker compose up --build` from the repo root.
- **Tear down + drop data:** `docker compose down -v`.
- **Provision a new environment:** copy `terraform/environments/example` → `terraform/environments/<env>`, fill `terraform.tfvars`, `terraform init && terraform plan && terraform apply`.
- **Validate Terraform offline (no cloud creds):** from a module or environment dir, `terraform init -backend=false && terraform fmt -check && terraform validate`.

## Pointers

- Root instructions: `../CLAUDE.md`
- Terraform per-env workflow: `terraform/README.md`
- Deploy architecture (future): `../knowledge/architecture/deploy.md`
