# `packages/payments` — Payments abstraction

Interface + Noop + Stripe adapter. Default `PAYMENTS_PROVIDER=noop`. Adapters never throw out of checkout/webhook paths — they return null results. See ADR 0002 for the pattern.
