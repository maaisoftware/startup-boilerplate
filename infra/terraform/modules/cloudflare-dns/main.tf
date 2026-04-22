/**
 * Cloudflare DNS records module.
 *
 * Creates one record per entry in var.records against the given zone.
 * Proxied by default (Cloudflare WAF + CDN). Flip per-record when you
 * need the record to resolve to the origin directly (e.g. MX, TXT).
 *
 * Requires:
 *   https://registry.terraform.io/providers/cloudflare/cloudflare
 *   Provider env var: CLOUDFLARE_API_TOKEN (token scoped Zone:DNS:Edit).
 */

terraform {
  required_version = ">= 1.6.0"
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
}

resource "cloudflare_record" "this" {
  for_each = var.records

  zone_id = var.zone_id
  name    = each.value.name
  type    = each.value.type
  content = each.value.content
  ttl     = lookup(each.value, "ttl", 1) # 1 = auto (only valid when proxied)
  proxied = lookup(each.value, "proxied", contains(["A", "AAAA", "CNAME"], each.value.type))
  comment = lookup(each.value, "comment", null)
}
