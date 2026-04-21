# `knowledge/` — Obsidian-compatible vault

## Purpose
Long-term memory of this project. Every architectural decision, every feature design, every domain concept lives here. The vault is the **ground truth for "why"** — code tells you what, git log tells you when, this tells you why.

## Entry points
- `_index.md` — top of the vault. Start here.
- `architecture/` — system design docs.
- `decisions/` — ADRs, numbered `00NN-<slug>.md`.
- `features/` — per-feature docs, linked to code.
- `raw/` — drop zone. The `sync-knowledge` skill compiles these.

## Architectural rules
1. **Prose, not bullet soup.** LLMs reading this must understand the reasoning, not just the outline.
2. **Wikilinks for internal references.** `[[target]]` or `[[target|label]]`. Obsidian resolves; agents read as-is.
3. **Relative paths for code references.** `[page.tsx](../../apps/web/src/app/page.tsx)`.
4. **Frontmatter on every article.**
   ```yaml
   ---
   title: <short>
   created: 2026-04-20
   updated: 2026-04-20
   status: draft | active | deprecated | superseded by 00NN
   related: [links]
   ---
   ```
5. **ADRs are never edited after acceptance.** If something changes, write a new ADR that supersedes the old one.

## Forbidden patterns
- Silently changing a decision without a new ADR.
- Orphaned files (no links in or out). Run the vault health check before committing.
- Dumping raw conversation transcripts into `raw/` and leaving them there. Compile them or delete them.

## Common tasks
- **Add an ADR:** use the `write-adr` skill. It picks the next number, stamps the date, fills the template (context/options/decision/consequences).
- **Document a new feature:** create `features/<feature-name>.md`, link it from `features/_index.md`, link it from the feature's code via a comment (`// See [[features/feature-name]]`).
- **Compile raw notes:** use the `sync-knowledge` skill. It reads everything in `raw/`, structures it, writes into the right subdirectory, links into the index.

## Testing requirements
- Link-checker runs on every PR (PR #10 wires this into CI). Broken wikilinks fail.
- Vault health check asserts every article has frontmatter and a `related` field.

## Pointers
- ADR template: `decisions/_template.md`
- Root instructions: `../CLAUDE.md`
