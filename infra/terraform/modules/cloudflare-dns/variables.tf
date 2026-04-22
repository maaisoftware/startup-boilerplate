variable "zone_id" {
  description = "Cloudflare Zone ID for the domain (visible in the dashboard overview)."
  type        = string
}

variable "records" {
  description = <<EOT
Map of logical-key → DNS record. Example:

  {
    "apex" = {
      name    = "@"
      type    = "CNAME"
      content = "cname.vercel-dns.com"
      proxied = true
    }
    "www" = {
      name    = "www"
      type    = "CNAME"
      content = "cname.vercel-dns.com"
    }
  }

`ttl`/`proxied`/`comment` are optional. When omitted:
- ttl defaults to 1 (auto).
- proxied defaults to true for A/AAAA/CNAME, false otherwise.
EOT
  type = map(object({
    name    = string
    type    = string
    content = string
    ttl     = optional(number)
    proxied = optional(bool)
    comment = optional(string)
  }))
}
