output "supabase_project_id" {
  description = "Supabase project ref."
  value       = module.supabase.project_id
}

output "supabase_api_url" {
  description = "Value to paste into NEXT_PUBLIC_SUPABASE_URL if bootstrapping manually."
  value       = module.supabase.api_url
}

output "vercel_project_id" {
  description = "Used by GitHub Actions (VERCEL_PROJECT_ID)."
  value       = module.vercel.project_id
}

output "sentry_project_slug" {
  description = "Sentry project slug (used by sentry-cli)."
  value       = module.sentry.project_slug
}
