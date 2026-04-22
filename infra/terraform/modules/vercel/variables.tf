variable "project_name" {
  description = "Name of the Vercel project (appears in dashboard URLs)."
  type        = string
}

variable "team_id" {
  description = "Vercel team id. Null for personal accounts."
  type        = string
  default     = null
}

variable "github_repo" {
  description = "GitHub repository slug (e.g. \"acme/my-app\")."
  type        = string
}

variable "production_branch" {
  description = "Branch that triggers production deploys."
  type        = string
  default     = "main"
}

variable "build_command" {
  description = "Override the build command. Defaults to next build via turbo."
  type        = string
  default     = "pnpm --filter=@startup-boilerplate/web build"
}

variable "install_command" {
  description = "Override the install command. pnpm with frozen lockfile by default."
  type        = string
  default     = "pnpm install --frozen-lockfile"
}

variable "output_directory" {
  description = "Next.js standalone output dir."
  type        = string
  default     = "apps/web/.next"
}

variable "root_directory" {
  description = "Monorepo root directory for Vercel to treat as the project root."
  type        = string
  default     = "."
}

variable "domains" {
  description = "Custom domains to attach to the Vercel project."
  type        = list(string)
  default     = []
}

variable "environment_variables" {
  description = <<EOT
Map of env var name → { value, targets, sensitive }. Example:

  {
    "NEXT_PUBLIC_APP_URL" = {
      value    = "https://example.com"
      targets  = ["production", "preview"]
      sensitive = false
    }
  }

`targets` must be a subset of ["production", "preview", "development"].
EOT
  type = map(object({
    value     = string
    targets   = list(string)
    sensitive = optional(bool, false)
  }))
  default = {}
}
