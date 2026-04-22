# `infra/terraform` — reproducible cloud provisioning

Every hosted dependency the app talks to (Supabase, Vercel, Cloudflare DNS, Sentry) plus the GitHub Actions secrets the deploy workflows read — all provisioned from source. Spinning up a fresh environment is `terraform apply` with a filled `.tfvars`.

## Layout

```
infra/terraform/
├── modules/
│   ├── supabase/         # Supabase project + auth settings
│   ├── vercel/           # Vercel project + domains + env vars
│   ├── cloudflare-dns/   # CNAME records (proxied)
│   ├── github-secrets/   # Actions secrets + variables
│   └── sentry/           # Sentry project + DSN
└── environments/
    └── example/          # Copy → infra/terraform/environments/<env>/
```

## Per-environment workflow

1. `cp -r environments/example environments/<env>` (e.g. `environments/prod`).
2. `cp terraform.tfvars.example terraform.tfvars` and fill values.
3. Export the provider tokens:
   - `SUPABASE_ACCESS_TOKEN`
   - `VERCEL_API_TOKEN`
   - `CLOUDFLARE_API_TOKEN` (scope: Zone:DNS:Edit)
   - `GITHUB_TOKEN` (scope: `repo`)
   - `SENTRY_AUTH_TOKEN`
4. `terraform init` (configures the backend).
5. `terraform plan -out plan.tfplan` — read the plan. Don't skip.
6. `terraform apply plan.tfplan`.

## What's automated vs manual

| Resource                              | Automated | Notes                                                                                                                                                              |
| ------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Supabase project create               | ✅        |                                                                                                                                                                    |
| Supabase auth settings                | ✅        |                                                                                                                                                                    |
| Supabase anon + service-role keys     | ❌        | Provider does not expose them; copy from dashboard into the Vercel module's `environment_variables` on first apply, or store in Terraform Cloud as sensitive vars. |
| Vercel project + domains + env        | ✅        |                                                                                                                                                                    |
| Cloudflare CNAME to Vercel            | ✅        |                                                                                                                                                                    |
| GitHub Actions secrets                | ✅        |                                                                                                                                                                    |
| Sentry project + DSN                  | ✅        |                                                                                                                                                                    |
| PostHog / Mixpanel / GA4 provisioning | ❌        | These providers either don't have Terraform support (PostHog) or the project setup is a one-click UI flow. Keys belong in GitHub Actions secrets.                  |

## Secrets & state

- **Never commit `terraform.tfvars`.** `.gitignore` covers `*.tfvars` and `*.tfstate*`.
- **Use a remote backend.** The example root module has a commented-out Terraform Cloud backend — uncomment and configure before the first `terraform init`.
- **Rotate by re-applying.** Every secret input can be rotated by updating the `.tfvars` (or TFC workspace variable) and running `terraform apply`.

## Per-client deploys

`terraform workspace new client-x`, swap the `.tfvars`, `terraform apply`. Each workspace gets isolated state.

## Validation (without cloud credentials)

`terraform fmt -check` and `terraform validate` run offline and are wired into CI. They catch syntax errors + provider constraint violations without hitting any API.
