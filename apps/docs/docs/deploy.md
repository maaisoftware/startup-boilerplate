---
sidebar_position: 3
---

# Deploying

Two supported paths: managed cloud (Vercel + Supabase) or self-host (Docker Compose).

## Managed: Vercel + Supabase

Everything is provisioned from Terraform.

1. `cd infra/terraform/environments/example`
2. Copy the directory to `infra/terraform/environments/<env>/` (e.g. `prod`, `staging`).
3. `cp terraform.tfvars.example terraform.tfvars` and fill values.
4. Export provider tokens: `SUPABASE_ACCESS_TOKEN`, `VERCEL_API_TOKEN`, `CLOUDFLARE_API_TOKEN`, `GITHUB_TOKEN`, `SENTRY_AUTH_TOKEN`.
5. `terraform init && terraform plan -out plan.tfplan && terraform apply plan.tfplan`.

What this provisions:

- Supabase project + auth config
- Sentry project + DSN
- Vercel project bound to the GitHub repo with env vars wired from Supabase + Sentry
- Cloudflare CNAMEs pointing your domains at Vercel
- GitHub Actions secrets the deploy workflows need

See `infra/terraform/README.md` for the full matrix of what's automated vs manual.

## Self-host: Docker Compose

```bash
cp .env.example .env.local  # fill in production values
docker compose up -d --build
```

The image uses the `BUILD_STANDALONE=true` flag to produce a Next.js standalone output; the runtime container is non-root (uid 1001) and ships no build tools.

## Health checks

Every runtime service exposes `/api/health`. Orchestrators should probe it before routing traffic.
