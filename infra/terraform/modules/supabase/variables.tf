variable "organization_id" {
  description = "Supabase organization id. Visible in the dashboard URL."
  type        = string
}

variable "project_name" {
  description = "Human-readable name for the Supabase project."
  type        = string
}

variable "region" {
  description = "Supabase deploy region slug. See https://supabase.com/docs/guides/platform/regions."
  type        = string
  default     = "us-east-1"
}

variable "database_password" {
  description = "Initial Postgres password. Store in Terraform Cloud as a sensitive variable."
  type        = string
  sensitive   = true
}

variable "site_url" {
  description = "Canonical public URL of the deployed app (used by Supabase Auth redirects)."
  type        = string
}

variable "auth_redirect_urls" {
  description = "Additional redirect URLs allowed by Supabase Auth (preview envs, localhost)."
  type        = list(string)
  default     = []
}
