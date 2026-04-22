/**
 * Supabase project module.
 *
 * Creates a Supabase project in the given organization and exposes the
 * credentials the app needs (URL, anon key, service-role key, DB URL).
 *
 * Requires the official `supabase/supabase` provider v1.x:
 *   https://registry.terraform.io/providers/supabase/supabase
 *
 * The provider expects SUPABASE_ACCESS_TOKEN in the environment.
 */

terraform {
  required_version = ">= 1.6.0"
  required_providers {
    supabase = {
      source  = "supabase/supabase"
      version = "~> 1.5"
    }
  }
}

resource "supabase_project" "this" {
  organization_id   = var.organization_id
  name              = var.project_name
  database_password = var.database_password
  region            = var.region
}

resource "supabase_settings" "this" {
  project_ref = supabase_project.this.id

  api = jsonencode({
    db_schema            = "public"
    db_extra_search_path = "public,extensions"
    max_rows             = 1000
  })

  auth = jsonencode({
    site_url                              = var.site_url
    additional_redirect_urls              = var.auth_redirect_urls
    jwt_expiry                            = 3600
    refresh_token_rotation                = true
    security_refresh_token_reuse_interval = 10
    enable_signup                         = true
    external_email_enabled                = true
  })
}
