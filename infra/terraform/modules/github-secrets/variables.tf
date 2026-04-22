variable "repository" {
  description = "GitHub repository name (without the org prefix)."
  type        = string
}

variable "secrets" {
  description = <<EOT
Map of secret name → plaintext value. Each value is sent to the GitHub
provider which stores it as a repository Actions secret; the provider
treats the value as sensitive on its own side, so this variable is
not marked `sensitive = true` at the map level (doing so would forbid
the keys from being used in `for_each`). Pass sensitive values via
Terraform Cloud variables or TF_VAR_ env vars rather than plaintext
.tfvars files.
EOT
  type        = map(string)
  default     = {}
}

variable "variables" {
  description = "Map of Actions variable name → value. NOT encrypted — use only for non-sensitive config (e.g. VERCEL_PROJECT_ID)."
  type        = map(string)
  default     = {}
}
