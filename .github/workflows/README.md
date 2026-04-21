# GitHub Actions workflows

| Workflow        | Trigger                               | Purpose                                                 |
| --------------- | ------------------------------------- | ------------------------------------------------------- |
| `ci.yml`        | Every PR & push to `develop` / `main` | Lint, typecheck, test, build, commitlint, format check. |
| `security.yml`  | Weekly + every PR                     | `pnpm audit`, CodeQL, Gitleaks secret scan.             |
| `e2e.yml`       | _(added in PR #10)_                   | Playwright E2E against a built app.                     |
| `deploy-*.yml`  | _(added in the deploy phase)_         | Vercel preview / prod deploy, Supabase migration apply. |
| `terraform.yml` | _(added when Terraform modules land)_ | `terraform plan` on PR, `apply` on merge.               |
| `docs-sync.yml` | _(added in PR #6)_                    | Regenerate knowledge vault indexes from code changes.   |

## Required secrets

Configure in **GitHub → Settings → Secrets and variables → Actions**.

| Secret                  | Needed by                    | Source                                             |
| ----------------------- | ---------------------------- | -------------------------------------------------- |
| `VERCEL_TOKEN`          | `deploy-*.yml`               | https://vercel.com/account/tokens                  |
| `VERCEL_ORG_ID`         | `deploy-*.yml`               | `vercel link` output                               |
| `VERCEL_PROJECT_ID`     | `deploy-*.yml`               | `vercel link` output                               |
| `SUPABASE_ACCESS_TOKEN` | `deploy-*.yml`               | `supabase login`                                   |
| `SUPABASE_PROJECT_REF`  | `deploy-*.yml`               | Supabase dashboard                                 |
| `SENTRY_DSN`            | runtime (optional)           | Sentry project settings                            |
| `SENTRY_AUTH_TOKEN`     | source-map upload (optional) | https://sentry.io/settings/account/api/auth-tokens |
| `POSTHOG_API_KEY`       | runtime (optional)           | PostHog project settings                           |
| `STRIPE_SECRET_KEY`     | payments feature (optional)  | Stripe dashboard, test mode                        |
| `STRIPE_WEBHOOK_SECRET` | payments webhook (optional)  | Stripe dashboard → webhook                         |

All secrets remain **dormant until the matching feature flag is enabled** in `.env` or the deploy environment.
