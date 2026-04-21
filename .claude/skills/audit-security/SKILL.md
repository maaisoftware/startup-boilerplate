---
name: audit-security
description: Runs the security checklist against a given change, PR, or route. Invoke whenever a user asks for a security review, before merging a PR that touches auth/proxy/DB/payments/webhooks, or when a new route reaches staging.
---

# audit-security

This checklist encodes the invariants documented in `CLAUDE.md`, `SECURITY.md`, and ADRs 0002 + 0003. Run it against the diff or the route under review. A finding is either `BLOCK` (must fix before merge), `WARN` (should fix or document), or `OK`.

## Checklist

Work through the sections in order. Report each finding with file:line references.

### 1. Trust boundaries

- [ ] Browser only calls `/api/*` — never a raw upstream SDK from client components.
- [ ] New `NEXT_PUBLIC_*` env vars contain no secrets. Verify each against the Zod schema in `packages/env/src/schema.ts`.
- [ ] Any `supabase.auth.getUser()` in server code is followed by a role check before trusting the id.
- [ ] No cross-app imports (apps/_ into packages/_ or vice versa).

### 2. Proxy layer

- [ ] No auth logic in `apps/web/src/proxy.ts`. Only headers, CSP, rate limit, CORS, redirects. (See ADR 0003.)
- [ ] `matcher` config excludes static assets and internal routes (`_next/*`, `favicon.ico`, etc.).
- [ ] Rate-limit budgets distinguish reads from writes. Writes ≤ 10/min/IP unless the route is explicitly designed for bursts.

### 3. API handlers

- [ ] Every state-changing handler wraps with `apiHandler({ input: zodSchema, handler })`.
- [ ] `requireSession()` is called before any access to user-specific data.
- [ ] `requirePermission(session.role, resource, action)` is called before any mutation. The resource/action must exist in `packages/auth/src/rbac.ts`.
- [ ] `writeAudit()` is called for every mutation before the response.
- [ ] Upstream error messages are not echoed — `apiHandler` rewrites them, but if the route catches errors itself, it must rewrite too.

### 4. CSRF

- [ ] Every non-GET handler verifies the `x-csrf-token` header against the session cookie. `apiHandler` + `verifyCsrfToken` enforce this; inspect any handler that sidesteps `apiHandler`.
- [ ] CSRF tokens are HMAC-signed with the `CSRF_SECRET`. Never accept client-generated tokens.

### 5. Database / RLS

- [ ] Every new table has `ALTER TABLE … ENABLE ROW LEVEL SECURITY`.
- [ ] Every new table has at least one RLS policy. The RLS-coverage integration test catches this; run it.
- [ ] RLS policies use `has_role()` and `is_staff()` helpers, not inline subqueries.
- [ ] `audit_log` has no UPDATE or DELETE policy. The immutability trigger covers service_role.
- [ ] The Drizzle service-role client (`getDb()`) is imported only in server code that has already done its own auth check.

### 6. Input validation

- [ ] Every API route declares a Zod schema for its input. `apiHandler` rejects anything else as 400.
- [ ] Route params (URL segments) are validated when non-trivial (not just `string`).
- [ ] File uploads validate size + MIME (not implemented yet — route any upload through the plan's `packages/storage` when it lands).

### 7. Secrets

- [ ] No secret is logged. `ConsoleLogger` serialises context into JSON — make sure session/JWT/API-key strings never land in the context object.
- [ ] No new env var ends up in the browser bundle unless it's prefixed `NEXT_PUBLIC_` and verified public-safe.
- [ ] `AUTH_SECRET` and `CSRF_SECRET` are 32+ chars (schema enforces this).
- [ ] No test commits any secret — scan the diff for base64/hex strings longer than ~24 chars.

### 8. Logging

- [ ] No `console.*` call outside `packages/logger/src/adapters/console.ts` and test files.
- [ ] Errors include enough context to debug but no PII or secrets.
- [ ] `logger.error` is used for unexpected failures, `.warn` for expected but notable, `.info` / `.debug` otherwise.

### 9. SEO + metadata

- [ ] Every new `page.tsx` exports `metadata` or `generateMetadata`. CI catches omissions once PR #17 lands.
- [ ] Detail pages emit Schema.org JSON-LD via `<JsonLd>` from `@startup-boilerplate/ui`.
- [ ] `/sitemap.xml` covers the new route. It reads from the CMS adapter, so adding a new CMS-backed resource just requires listing it.

### 10. Deployment surface

- [ ] No breaking changes to existing API shapes without a new version (e.g. `/api/v2/...`) or a deprecation notice.
- [ ] CI workflows (`ci.yml`, `security.yml`) cover the new code (Playwright tests, unit tests, security scans).
- [ ] New required env vars are listed in `.env.example` AND `.github/workflows/README.md`.

## Output format

For each finding:

```
[BLOCK|WARN|OK] <section>: <short description>
  file: <path>:<line>
  fix: <concrete action>
```

At the end, print a summary:

```
Blocks: N
Warns: M
OK: K
```

If any BLOCK, the PR must not merge.

## Tooling that helps

- `pnpm --filter @startup-boilerplate/db test` — RLS integration tests.
- `pnpm lint` — catches `no-console` and the metadata rule (PR #17).
- Gitleaks runs on every PR — catches committed secrets.
- CodeQL with `security-extended` covers injection, path traversal, etc.
