/**
 * GitHub Actions secrets + variables module.
 *
 * Wires the outputs from the Supabase / Vercel / Sentry modules into
 * the repo's GitHub Actions secrets so the deploy workflows can run.
 *
 * Requires:
 *   https://registry.terraform.io/providers/integrations/github
 *   Provider env var: GITHUB_TOKEN (PAT with `repo` scope) or GITHUB_APP_*.
 *
 * Secrets are write-only on the GitHub side — Terraform cannot read
 * existing values, so drift detection is limited. Rotate by updating
 * the input variable and re-applying.
 */

terraform {
  required_version = ">= 1.6.0"
  required_providers {
    github = {
      source  = "integrations/github"
      version = "~> 6.0"
    }
  }
}

resource "github_actions_secret" "this" {
  for_each = var.secrets

  repository      = var.repository
  secret_name     = each.key
  plaintext_value = each.value
}

resource "github_actions_variable" "this" {
  for_each = var.variables

  repository    = var.repository
  variable_name = each.key
  value         = each.value
}
