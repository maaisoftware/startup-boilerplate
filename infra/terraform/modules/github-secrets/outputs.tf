output "secret_names" {
  description = "Secret names written to GitHub. The values are not returned."
  value       = keys(github_actions_secret.this)
}

output "variable_names" {
  description = "Actions variable names written to GitHub."
  value       = keys(github_actions_variable.this)
}
