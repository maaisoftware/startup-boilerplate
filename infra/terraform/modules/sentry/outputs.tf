output "project_slug" {
  description = "Sentry project slug — used by sentry-cli to upload source maps."
  value       = sentry_project.this.slug
}

output "project_id" {
  description = "Numeric Sentry project id."
  value       = sentry_project.this.internal_id
}

output "dsn_public" {
  description = "Public DSN — goes into NEXT_PUBLIC_SENTRY_DSN (safe for the browser bundle)."
  value       = sentry_key.this.dsn.public
}

output "dsn_secret" {
  description = "Secret DSN — goes into SENTRY_DSN on the server. Sensitive."
  value       = sentry_key.this.dsn.secret
  sensitive   = true
}
