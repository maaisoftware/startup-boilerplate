output "project_id" {
  description = "Vercel project id — used by GitHub Actions deploy workflows (VERCEL_PROJECT_ID)."
  value       = vercel_project.this.id
}

output "team_id" {
  description = "Vercel team id (VERCEL_ORG_ID). Null for personal accounts."
  value       = var.team_id
}
