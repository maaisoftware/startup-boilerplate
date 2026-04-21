---
name: write-adr
description: Creates an Architecture Decision Record in knowledge/decisions/. Use whenever a user is about to make a load-bearing decision — monorepo vs polyrepo, new abstraction vs inline code, choosing between library A and B, changing a security invariant, or rewriting something already ADR-documented. Also invoke for "record-decision" requests.
---

# write-adr

ADRs are how this project keeps its "why" accessible after the commits scroll off the screen. They are immutable after acceptance — supersede, never edit.

## When to write one

- The decision affects more than one package.
- Future contributors would ask "why did we do this?" if they read only the code.
- A security or reliability invariant is added, removed, or changed.
- A provider swap (PostgreSQL → something else, Stripe → Paddle, etc.) is being seriously considered.
- The decision reverses or narrows a prior ADR.

Skip ADRs for: one-line bug fixes, refactors that don't alter semantics, dependency bumps, anything reversible within one PR.

## Procedure

### 1. Pick the next number

```bash
ls knowledge/decisions/ | grep -E '^[0-9]{4}-' | sort | tail -1
```

Increment. Four-digit zero-padded. The slug is short, kebab-case, and describes the topic ("proxy-vs-auth", not "decision-about-middleware").

### 2. Copy the template

```bash
cp knowledge/decisions/_template.md knowledge/decisions/00NN-<slug>.md
```

Fill frontmatter:

```yaml
---
title: <short title>
created: YYYY-MM-DD # today, ISO 8601
updated: YYYY-MM-DD
status: proposed | accepted | superseded by 00NN
related: [other ADRs, feature docs, architecture pages]
deciders: [names or roles]
---
```

### 3. Write the body

Four sections. Be concise — each section one to three short paragraphs:

- **Context**: what problem, what constraints, what we tried so far. Include links to raw notes if the discussion lives elsewhere.
- **Options considered**: at least two. Name them. Give pros and cons each. The option that wins is last by convention.
- **Decision**: which option, and why — not just "A wins" but the load-bearing premises. A future reader must be able to identify what premise would need to break for this to be reversed.
- **Consequences**: positive and negative. List follow-up work items.

References at the bottom: other ADRs, external docs, code entry points.

### 4. Link it in

- Add to `knowledge/decisions/_index.md` index.
- If an existing ADR is superseded, edit its frontmatter `status: superseded by 00NN` — this is the one time an accepted ADR gets modified.
- If the decision introduces an invariant worth enforcing everywhere, add a non-negotiable rule to the root `CLAUDE.md` with a pointer to the ADR.

### 5. Commit

Use scope `knowledge` and either `docs` or `feat` depending on whether the ADR describes an existing behaviour or a new one:

```
docs(knowledge): ADR 00NN — <short title>

Records the <decision> in response to <context>. Supersedes 00MM
(if applicable). Adds a non-negotiable rule to root CLAUDE.md.
```

## Style rules

- Write in prose. LLMs reading this must understand the reasoning, not just the outline.
- Link code with relative paths: `[api-handler.ts](../../apps/web/src/lib/api-handler.ts)`.
- Name options. Don't just list bullet points — give each option a short name so the Decision section can reference it cleanly.
- Don't include implementation code in the ADR. Reference the PR and source files instead.
- Name the deciders. "The team" is a code smell.

## Template location

`knowledge/decisions/_template.md` — copy, don't edit the template itself.

## Examples in this repo

- ADR 0001 — Monorepo structure (Turborepo + pnpm workspaces). A light-touch ADR.
- ADR 0002 — Abstraction layers. A pattern ADR; every adapter references it.
- ADR 0003 — Proxy vs auth. A security ADR; backed by a non-negotiable rule in root CLAUDE.md.
