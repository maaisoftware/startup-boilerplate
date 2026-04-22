variable "organization" {
  description = "Sentry organization slug."
  type        = string
}

variable "team" {
  description = "Sentry team slug that owns the project."
  type        = string
}

variable "project_name" {
  description = "Human-readable project name."
  type        = string
}

variable "project_slug" {
  description = "URL-safe project slug. Defaults to lowercased project_name."
  type        = string
  default     = null
}

variable "platform" {
  description = "Sentry platform identifier. Use \"javascript-nextjs\" for Next.js apps."
  type        = string
  default     = "javascript-nextjs"
}
