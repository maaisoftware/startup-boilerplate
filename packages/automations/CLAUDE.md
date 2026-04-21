# `packages/automations` — Workflow automations

Interface + Noop + n8n webhook adapter. Default `AUTOMATIONS_PROVIDER=noop`. Every trigger is fire-and-forget; failures are swallowed and returned as `{ executionId: null }`. See ADR 0002.
