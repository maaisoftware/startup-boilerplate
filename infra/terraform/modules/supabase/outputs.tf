output "project_id" {
  description = "Supabase project ref — used by the dashboard URL and CLI."
  value       = supabase_project.this.id
}

output "api_url" {
  description = "Value for NEXT_PUBLIC_SUPABASE_URL."
  value       = "https://${supabase_project.this.id}.supabase.co"
}

output "db_url" {
  description = "Value for SUPABASE_DB_URL. Sensitive — contains the DB password."
  value       = "postgresql://postgres:${var.database_password}@db.${supabase_project.this.id}.supabase.co:5432/postgres"
  sensitive   = true
}

# The anon key + service-role key are not exposed as Terraform outputs by
# the current Supabase provider. They must be copied out of the dashboard
# and stored as Terraform Cloud / GitHub Actions secrets. The
# `github-secrets` module below wires them into the repo once captured.
