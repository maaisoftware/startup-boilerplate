---
title: Architecture Decision Records
created: 2026-04-20
updated: 2026-04-20
status: active
related: [_template, ../architecture/_index]
---

# Architecture Decision Records (ADRs)

Every notable decision in this codebase lives here, numbered sequentially.

## Conventions

- **Numbered.** `00NN-<slug>.md`, where `NN` is monotonically increasing.
- **Immutable.** Once accepted, never edited. Superseded decisions get a new ADR that references the old.
- **Concise.** Context → options → decision → consequences. No essays.
- **Dated.** Frontmatter with `created` and `updated`.

Template: **[[_template]]**.

## Index

- [[0001-monorepo-structure]] — Turborepo + pnpm workspaces, why.
- [[0002-abstraction-layers]] — interface + adapter + factory pattern.
- [[0003-security-model]] — defense-in-depth approach (filled in PR #6).
