<!--
Thanks for contributing! Fill in every section — the CLAUDE.md files in affected folders explain the conventions.
Keep the PR title in conventional-commits form: `type(scope): subject`.
-->

## Summary

_What changed and why, in 1–3 sentences. Avoid repeating the commit log._

## Changes

- [ ] Code
- [ ] Tests
- [ ] Docs (`CLAUDE.md`, `knowledge/…`)
- [ ] Migrations (`supabase/migrations/…`)
- [ ] Config (`.env.example`, `turbo.json`, CI workflows)

## Test plan

<!--
Describe exactly what you ran and the results. Fail closed: empty checklist = reviewer rejects.
-->

- [ ] `pnpm lint` passes
- [ ] `pnpm typecheck` passes
- [ ] `pnpm test` passes
- [ ] `pnpm build` succeeds
- [ ] Affected package test suites: `pnpm --filter <pkg> test` — attach coverage if thresholds moved
- [ ] E2E (when relevant): `pnpm test:e2e`
- [ ] Manual verification: _describe_

## ADR / knowledge-vault impact

- [ ] This PR alters an architectural decision → new ADR written at `knowledge/decisions/00NN-…`
- [ ] This PR adds a feature → `knowledge/features/…` updated
- [ ] No architectural impact — N/A

## Security checklist

- [ ] No new `NEXT_PUBLIC_*` env var leaks a secret.
- [ ] No new browser-to-upstream direct call (all routed through `/api/*`).
- [ ] Every new table has RLS enabled and an integration test covering unauthorized access.
- [ ] Every new API handler validates input with Zod and writes to `audit_log` on mutation.
- [ ] No `console.*` calls — all logging uses `@startup-boilerplate/logger`.

## Breaking changes

- [ ] None
- [ ] Yes — describe impact and migration path: _…_

---

_Reviewers: run the `code-review` skill on this PR before approving._
