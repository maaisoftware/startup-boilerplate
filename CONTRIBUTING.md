# Contributing

Thanks for considering a contribution. This document explains how the project operates so your change lands cleanly.

## Ground rules

1. **Read the relevant `CLAUDE.md`** before editing inside any folder. Every folder has one.
2. **Follow the rules in the root `CLAUDE.md`.** The non-negotiables (no `console.*`, no direct browser-to-upstream calls, no `apps/* → packages/*` imports) are enforced by lint and CI.
3. **Write an ADR for architectural changes.** If your PR alters how the system is structured, open `knowledge/decisions/_template.md`, fill it out, and ship it in the same PR.

## Local setup

```bash
git clone https://github.com/maaisoftware/startup-boilerplate.git
cd startup-boilerplate
cp .env.example .env.local
# Fill AUTH_SECRET + CSRF_SECRET; other vars have safe defaults
pnpm install
pnpm supabase:start   # Docker required
pnpm dev              # http://localhost:3000
```

Useful scripts:

- `pnpm lint` — ESLint (flat config) across all workspaces.
- `pnpm typecheck` — `tsc --noEmit` across all workspaces.
- `pnpm test` — Vitest across all workspaces.
- `pnpm test:coverage` — same, with v8 coverage + thresholds.
- `pnpm test:e2e` — Playwright against a built app.
- `pnpm build` — full Turborepo build.
- `pnpm format` / `pnpm format:check` — Prettier.

## Branches & PRs

- Branch off **`develop`**. `main` only receives merges from `develop` at release time.
- Branch naming: `feat/<slug>`, `fix/<slug>`, `chore/<slug>`, `docs/<slug>`.
- **Conventional commits** are enforced by commitlint. Format: `type(scope): subject`.
  - Types: `feat`, `fix`, `docs`, `test`, `chore`, `refactor`, `perf`, `ci`, `build`, `style`, `revert`.
  - Scopes: every package name (`config`, `logger`, …), every app name (`web`), and cross-cutting (`monorepo`, `docker`, `ci`, `deps`, `knowledge`, `supabase`, `release`).
- **Atomic commits.** One logical unit per commit. Rebase or amend locally before pushing; never merge noise.
- **PR description** uses `.github/pull_request_template.md`. Fill in every section — empty checklists get rejected.
- **Code review**: every PR runs the `code-review` agent skill before merge. Address findings or justify why a finding doesn't apply.

## Testing requirements

| What you added               | What you test                                                |
| ---------------------------- | ------------------------------------------------------------ |
| A new abstraction adapter    | Adapter unit tests + passing the shared contract suite       |
| A new API route              | Integration test with msw (mocked) or local Supabase (real)  |
| A new DB table or RLS policy | RLS integration test verifying unauthorized access is denied |
| A new UI component           | Behavior test + jest-axe a11y assertion                      |
| A new end-to-end flow        | Playwright smoke covering the happy path                     |
| A new Zod schema             | Unit tests for accepted + rejected inputs                    |

Coverage thresholds: `lines ≥ 90, functions ≥ 90, branches ≥ 85, statements ≥ 90`. Abstraction packages push these to 95%.

## Documentation requirements

- **New feature** → `knowledge/features/<slug>.md` + backlink from the feature's code.
- **Architectural change** → new ADR in `knowledge/decisions/`.
- **Env var** → new entry in `.env.example` with `[REQUIRED]` / `[OPTIONAL]` / `[LOCAL-AUTO]` marker.
- **Public API change** → update the affected package's `README.md` / `CLAUDE.md`.

## Security reports

See [`SECURITY.md`](./SECURITY.md). Do **not** file public issues for vulnerabilities.

## Release process

1. `develop` receives atomic PRs over time.
2. When a coherent set of changes is ready, cut a release PR: `develop` → `main`.
3. Tag the merge commit with `vX.Y.Z` (semver).
4. CI publishes Docker images, builds Vercel prod, and applies Supabase migrations.

## Questions

Open a [discussion](https://github.com/maaisoftware/startup-boilerplate/discussions) or use the GitHub issue templates. For security topics, use security advisories.
