/**
 * Example root module. Copy this directory to
 * infra/terraform/environments/<client-or-env>/ and fill in
 * terraform.tfvars to provision one full environment.
 *
 * What this does:
 *   1. Creates a Supabase project.
 *   2. Creates a Sentry project + DSNs.
 *   3. Creates a Vercel project bound to the GitHub repo with env vars
 *      wired from the Supabase / Sentry outputs.
 *   4. Points custom domains at Vercel via Cloudflare CNAMEs.
 *   5. Writes the GitHub Actions secrets the deploy workflows need.
 *
 * Anything marked "manual" in the root is a limitation of the provider
 * (e.g. Supabase anon/service keys must be copied out of the dashboard).
 */

terraform {
  required_version = ">= 1.6.0"

  # Recommended: remote state via Terraform Cloud or S3. Swap this for
  # your own backend before running `terraform init`.
  # backend "remote" {
  #   organization = "your-org"
  #   workspaces { name = "startup-boilerplate-<env>" }
  # }

  required_providers {
    supabase   = { source = "supabase/supabase", version = "~> 1.5" }
    vercel     = { source = "vercel/vercel", version = "~> 2.0" }
    cloudflare = { source = "cloudflare/cloudflare", version = "~> 4.0" }
    github     = { source = "integrations/github", version = "~> 6.0" }
    sentry     = { source = "jianyuan/sentry", version = "~> 0.14" }
  }
}

provider "supabase" {}
provider "vercel" {}
provider "cloudflare" {}
provider "github" { owner = var.github_owner }
provider "sentry" {}

# ─── Supabase ───────────────────────────────────────────────────────
module "supabase" {
  source = "../../modules/supabase"

  organization_id   = var.supabase_organization_id
  project_name      = "${var.app_name} (${var.environment})"
  region            = var.supabase_region
  database_password = var.supabase_database_password
  site_url          = var.site_url
  auth_redirect_urls = [
    var.site_url,
    "${var.site_url}/auth/callback",
  ]
}

# ─── Sentry ─────────────────────────────────────────────────────────
module "sentry" {
  source = "../../modules/sentry"

  organization = var.sentry_organization
  team         = var.sentry_team
  project_name = "${var.app_name}-${var.environment}"
  project_slug = "${var.app_name}-${var.environment}"
}

# ─── Vercel ─────────────────────────────────────────────────────────
module "vercel" {
  source = "../../modules/vercel"

  project_name      = "${var.app_name}-${var.environment}"
  team_id           = var.vercel_team_id
  github_repo       = var.github_repo
  production_branch = var.production_branch
  domains           = var.domains

  environment_variables = {
    NODE_ENV = {
      value   = "production"
      targets = ["production"]
    }
    NEXT_PUBLIC_APP_URL = {
      value   = var.site_url
      targets = ["production"]
    }
    NEXT_PUBLIC_APP_NAME = {
      value   = var.app_name
      targets = ["production", "preview"]
    }
    NEXT_PUBLIC_SUPABASE_URL = {
      value   = module.supabase.api_url
      targets = ["production", "preview"]
    }
    SUPABASE_DB_URL = {
      value     = module.supabase.db_url
      targets   = ["production"]
      sensitive = true
    }
    NEXT_PUBLIC_SENTRY_DSN = {
      value   = module.sentry.dsn_public
      targets = ["production", "preview"]
    }
    SENTRY_DSN = {
      value     = module.sentry.dsn_secret
      targets   = ["production"]
      sensitive = true
    }
    AUTH_SECRET = {
      value     = var.auth_secret
      targets   = ["production"]
      sensitive = true
    }
    CSRF_SECRET = {
      value     = var.csrf_secret
      targets   = ["production"]
      sensitive = true
    }
  }
}

# ─── Cloudflare DNS ─────────────────────────────────────────────────
module "cloudflare" {
  source = "../../modules/cloudflare-dns"

  zone_id = var.cloudflare_zone_id
  records = {
    for domain in var.domains :
    domain => {
      name    = domain
      type    = "CNAME"
      content = "cname.vercel-dns.com"
      proxied = true
    }
  }
}

# ─── GitHub Actions secrets ─────────────────────────────────────────
module "github_secrets" {
  source = "../../modules/github-secrets"

  repository = var.github_repository_name

  secrets = {
    VERCEL_TOKEN          = var.vercel_token
    SENTRY_AUTH_TOKEN     = var.sentry_auth_token
    SUPABASE_ACCESS_TOKEN = var.supabase_access_token
  }

  variables = {
    VERCEL_ORG_ID     = coalesce(var.vercel_team_id, "")
    VERCEL_PROJECT_ID = module.vercel.project_id
    SENTRY_ORG        = var.sentry_organization
    SENTRY_PROJECT    = module.sentry.project_slug
  }
}
