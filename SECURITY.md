# Security Policy

## Reporting a vulnerability

**Do not open a public GitHub issue for a security problem.** Instead, file a private report:

1. Open a **[GitHub security advisory](https://github.com/maaisoftware/startup-boilerplate/security/advisories/new)**.
2. Describe the vulnerability, impact, and reproduction steps. Include a minimum-reproducing example if possible.
3. We aim to acknowledge within **2 business days** and triage within **5 business days**.

If the issue is confirmed, we will:

- Work on a fix in a private branch.
- Coordinate a release window with you.
- Credit you in the advisory and release notes (opt-out available).

## Supported versions

This is a **template repository**. Forks deploy their own copies. We maintain the most recent tagged release (`main`) with security backports. Forks are responsible for their own deploy security posture.

| Version | Status           |
| ------- | ---------------- |
| `main`  | ✅ supported     |
| others  | ❌ not supported |

## Threat model

The boilerplate assumes:

- **Adversary**: an authenticated or unauthenticated user attempting to access data they should not, exfiltrate secrets, or bypass the proxy layer.
- **Trust boundary**: browser ↔ Next.js API proxy. Everything upstream of the proxy (Supabase, Stripe, etc.) is never exposed directly to the browser.

### Defenses

- **API proxy** (`apps/web/src/app/api/*`): the only path from browser to upstream services. Enforces auth, RBAC, rate limits, CSRF, Zod input validation. Rewrites upstream errors so identities do not leak.
- **Supabase RLS** on every table. Policies derive from the RBAC DSL in `packages/auth`.
- **Audit log**: every mutation writes an immutable record (`audit_log` table, RLS forbids UPDATE/DELETE for everyone including service role).
- **CSP**, **HSTS**, and other security headers via Next.js Proxy (`apps/web/src/proxy.ts`).
- **Zod env validation** at boot. Missing required env vars crash the app instead of running with undefined values.
- **Secret scanning** in CI (Gitleaks + GitHub secret scanning).
- **Dependency auditing** in CI (`pnpm audit` high+).
- **Code scanning** in CI (CodeQL security-extended + security-and-quality).

## Known considerations

- **Abstraction leakage:** adapters can still expose upstream identity if they echo raw errors. Reviewers check error shapes in every new adapter.
- **`NEXT_PUBLIC_*` vars reach the browser.** Only the Supabase anon key (which is RLS-gated by design) and the app URL / name are allowed to use this prefix.
- **Rate limiting in local dev uses in-memory counters.** Single-instance only. For multi-instance deploys, switch to the Upstash adapter.

## Hall of fame

_(Empty — be the first.)_
