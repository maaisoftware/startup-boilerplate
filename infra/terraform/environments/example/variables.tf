variable "app_name" {
  description = "Short app identifier (used in project names)."
  type        = string
  default     = "startup-boilerplate"
}

variable "environment" {
  description = "Environment slug (e.g. prod, staging, demo)."
  type        = string
  default     = "prod"
}

variable "site_url" {
  description = "Canonical public URL (https://…)."
  type        = string
}

variable "domains" {
  description = "Domains attached to the Vercel project."
  type        = list(string)
  default     = []
}

# ─── Supabase ───────────────────────────────────────────────────────
variable "supabase_organization_id" {
  description = "Supabase organization id."
  type        = string
}

variable "supabase_region" {
  description = "Supabase region slug."
  type        = string
  default     = "us-east-1"
}

variable "supabase_database_password" {
  description = "Initial Postgres password for the Supabase project."
  type        = string
  sensitive   = true
}

variable "supabase_access_token" {
  description = "Supabase access token used by GitHub Actions to push migrations."
  type        = string
  sensitive   = true
}

# ─── Vercel ─────────────────────────────────────────────────────────
variable "vercel_team_id" {
  description = "Vercel team id. Null for personal accounts."
  type        = string
  default     = null
}

variable "vercel_token" {
  description = "Vercel API token for GitHub Actions deploys."
  type        = string
  sensitive   = true
}

# ─── GitHub ─────────────────────────────────────────────────────────
variable "github_owner" {
  description = "GitHub user or organization name."
  type        = string
}

variable "github_repo" {
  description = "GitHub repo slug (owner/repo) — used by Vercel."
  type        = string
}

variable "github_repository_name" {
  description = "Repo name without the org prefix — used by the github provider."
  type        = string
}

variable "production_branch" {
  description = "Branch that triggers production deploys on Vercel."
  type        = string
  default     = "main"
}

# ─── Cloudflare ─────────────────────────────────────────────────────
variable "cloudflare_zone_id" {
  description = "Cloudflare zone id for the domain."
  type        = string
}

# ─── Sentry ─────────────────────────────────────────────────────────
variable "sentry_organization" {
  description = "Sentry organization slug."
  type        = string
}

variable "sentry_team" {
  description = "Sentry team slug that owns the project."
  type        = string
}

variable "sentry_auth_token" {
  description = "Sentry auth token for sentry-cli uploads."
  type        = string
  sensitive   = true
}

# ─── Secrets that land in Vercel env ────────────────────────────────
variable "auth_secret" {
  description = "32+ char random string for AUTH_SECRET."
  type        = string
  sensitive   = true
}

variable "csrf_secret" {
  description = "32+ char random string for CSRF_SECRET."
  type        = string
  sensitive   = true
}
