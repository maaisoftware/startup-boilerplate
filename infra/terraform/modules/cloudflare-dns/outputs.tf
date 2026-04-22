output "record_ids" {
  description = "Map of logical-key → Cloudflare record id."
  value       = { for k, r in cloudflare_record.this : k => r.id }
}
