# Knowledge Vault

Obsidian-compatible markdown vault. Every architectural decision, every feature design, every domain concept lives here. Agents read it as plain markdown; humans read it in Obsidian.

> **Wikilinks:** this vault uses `[[double-brackets]]`. Obsidian resolves them natively. On GitHub they render as literal text — that's fine, it's still readable.

## Structure

- **[[architecture/_index|Architecture]]** — how the system fits together.
- **[[decisions/_index|Decisions (ADRs)]]** — every notable decision, dated, with context → options → decision → consequences.
- **[[features/_index|Features]]** — per-feature documentation, linked bidirectionally to code.
- **[[raw/_index|Raw notes]]** — drop zone. Paste meeting notes, transcripts, research. The `sync-knowledge` skill compiles these into wiki pages.

## Conventions

1. **Prose, not bullet soup.** Link liberally, but write in sentences. An LLM reading this file should understand the reasoning, not just the outline.
2. **Link to code with relative paths.** `[PageShell](../packages/ui/src/page-shell.tsx)` is navigable from both Obsidian and the GitHub web view.
3. **Date everything.** ISO 8601, top of the file frontmatter. `created: 2026-04-20`.
4. **New decision → new ADR.** Never silently override a prior decision. Write a new ADR that supersedes the old one and mark the old one `status: superseded by 00NN`.
5. **Raw notes are transient.** Move them into structured wiki pages once compiled. Keep the raw file around if the source is sentimental or context-heavy.

## Agents

- Read the relevant area first before making code changes.
- After landing a meaningful change, update the matching feature doc or write a new ADR.
- Treat this vault as long-term memory. Today's code is tomorrow's mystery — this is where "why" lives.

## Maintenance

- The `docs-sync` CI workflow regenerates index pages when individual articles change.
- The `sync-knowledge` skill compiles `raw/` into structured pages.
- CI warns if a top-level folder doesn't have a CLAUDE.md — the convention is that every folder in the codebase has *both* a CLAUDE.md (for agents) and a matching article here (for humans).

---

Start here: **[[architecture/overview]]**.
