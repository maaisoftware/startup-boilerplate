/**
 * Sentry project module.
 *
 * Creates a Sentry project (under an existing organization + team) and
 * a client key (DSN) the app uses at runtime via SENTRY_DSN /
 * NEXT_PUBLIC_SENTRY_DSN.
 *
 * Requires:
 *   https://registry.terraform.io/providers/jianyuan/sentry
 *   Provider env var: SENTRY_AUTH_TOKEN.
 */

terraform {
  required_version = ">= 1.6.0"
  required_providers {
    sentry = {
      source  = "jianyuan/sentry"
      version = "~> 0.14"
    }
  }
}

resource "sentry_project" "this" {
  organization = var.organization
  teams        = [var.team]
  name         = var.project_name
  slug         = var.project_slug
  platform     = var.platform
}

resource "sentry_key" "this" {
  organization = var.organization
  project      = sentry_project.this.slug
  name         = "default"
}
