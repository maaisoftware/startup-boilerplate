/**
 * Vercel project module.
 *
 * Creates a Vercel project bound to a GitHub repository, provisions
 * custom domains, and writes the environment variables the app reads
 * at runtime + build-time.
 *
 * Requires:
 *   https://registry.terraform.io/providers/vercel/vercel
 *
 * Provider expects VERCEL_API_TOKEN in the environment (or
 * `token = ...` in the provider block in the root module).
 */

terraform {
  required_version = ">= 1.6.0"
  required_providers {
    vercel = {
      source  = "vercel/vercel"
      version = "~> 2.0"
    }
  }
}

resource "vercel_project" "this" {
  name      = var.project_name
  framework = "nextjs"
  team_id   = var.team_id

  git_repository = {
    type              = "github"
    repo              = var.github_repo
    production_branch = var.production_branch
  }

  build_command    = var.build_command
  install_command  = var.install_command
  output_directory = var.output_directory
  root_directory   = var.root_directory
}

resource "vercel_project_domain" "this" {
  for_each = toset(var.domains)

  project_id = vercel_project.this.id
  team_id    = var.team_id
  domain     = each.value
}

resource "vercel_project_environment_variable" "this" {
  for_each = var.environment_variables

  project_id = vercel_project.this.id
  team_id    = var.team_id
  key        = each.key
  value      = each.value.value
  target     = each.value.targets
  sensitive  = lookup(each.value, "sensitive", false)
}
