---
name: record-decision
description: Shorthand alias for write-adr that emphasises business or product decisions over pure architectural ones. Use when a user says "we decided to …" or "let's record that we're going to …" — producing the same immutable ADR artefact so the reasoning survives past the conversation.
---

# record-decision

Identical mechanics to `write-adr`; different trigger vocabulary. Use this when the user frames it as recording a business, product, or operational decision rather than an architectural one. The output artefact and location are the same.

## When this skill fires vs. write-adr

- **record-decision** — "We picked Supabase for auth because..." "We're going to support only English in v0.1." "We won't build multi-tenancy until a client pays for it."
- **write-adr** — "Should we use Turborepo or Nx?" "How should we structure the abstraction layers?" "What RLS policy pattern for audit_log?"

Both flow into `knowledge/decisions/00NN-<slug>.md`. Both are immutable after acceptance.

## Steps

Run the `write-adr` skill. Pay special attention to the Context section — for business/product decisions, write the business constraints explicitly:

- Time pressure (deadline, launch window)
- Budget or team-size constraint
- Stakeholder preference with rationale (avoid "X wanted it")
- Customer commitment that pins the choice

The Consequences section should call out what the project is **deferring** as a result — that's where these decisions usually sting later.

## Example header

```yaml
---
title: Defer multi-tenancy until paid customer needs it
created: 2026-06-15
updated: 2026-06-15
status: accepted
related: [../architecture/overview]
deciders: [Marlon Espinosa]
---
```

## Why not just a comment in code or a Slack message

Because code comments rot and Slack decays. ADRs are:

- Indexed (`knowledge/decisions/_index.md`).
- Searchable by humans and LLMs.
- Referenced from CLAUDE.md files when the decision becomes an enforceable rule.
- Linked bidirectionally with features and architecture pages.

## References

- `/write-adr` — same mechanics, architectural framing.
- `knowledge/decisions/_template.md` — the template both skills use.
- `knowledge/CLAUDE.md` — vault rules for how ADRs age.
