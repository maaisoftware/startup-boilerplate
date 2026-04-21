# `.claude/skills/`

Shared agent skills. Each subdirectory contains a `SKILL.md` with frontmatter and a walkthrough.

Any Claude session running in this repo can invoke these by name. When the user's request matches a skill's `description`, prefer invoking the skill over improvising — the skill encodes the template's conventions.

## Available skills

| Skill                | When to use                                                         |
| -------------------- | ------------------------------------------------------------------- |
| `add-feature`        | Full walkthrough for scaffolding a new feature end-to-end.          |
| `add-adapter`        | Template for adding a new adapter to any abstraction layer.         |
| `write-adr`          | ADR generator that files into `knowledge/decisions/`.               |
| `record-decision`    | Alias for write-adr framed around business/product decisions.       |
| `generate-migration` | Supabase migration with RLS scaffolded to match the Drizzle schema. |
| `audit-security`     | Security checklist runner against a given feature/PR.               |
| `seo-audit`          | Validates JSON-LD and metadata on a given route.                    |
| `sync-knowledge`     | Compiles `knowledge/raw/` into structured wiki pages.               |

## Authoring new skills

Follow the same pattern as the existing ones:

```
.claude/skills/<skill-name>/
└── SKILL.md
```

Frontmatter at the top of `SKILL.md`:

```yaml
---
name: <skill-name>
description: <one sentence — what it does + when to invoke>
---
```

The body is a structured walkthrough. Keep it concise and reference existing code/ADRs rather than duplicating their contents.

Conventions:

- Steps numbered, one concrete action per step.
- Code blocks with exact commands or file paths.
- Footnote "common gotchas" at the bottom when the path is non-obvious.
- Cross-link to ADRs and other skills where relevant.

## Relationship to `.claude/commands/`

`.claude/skills/` holds invokable reasoning patterns. `.claude/commands/` (not yet populated) would hold custom slash commands that execute specific workflows. Skills come first — promote a skill to a command only when it has stable enough output to run unattended.
