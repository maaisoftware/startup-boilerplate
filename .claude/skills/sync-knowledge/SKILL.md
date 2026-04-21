---
name: sync-knowledge
description: Compiles raw notes from knowledge/raw/ into structured wiki pages under knowledge/architecture/, knowledge/features/, or knowledge/decisions/. Invoke when the user has dropped meeting notes, transcripts, or research into raw/ and wants them turned into durable documentation.
---

# sync-knowledge

The `knowledge/raw/` folder is a drop zone. Content accumulates there unstructured; this skill compiles it into the rest of the vault.

## What "raw" can contain

- Meeting notes
- Interview transcripts
- Research dumps (e.g. comparisons of providers)
- Stream-of-consciousness planning
- Outputs from other agents or tools

## Process

### 1. Read every file in `knowledge/raw/`

```bash
ls knowledge/raw/
```

Skip `_index.md` — that's the folder's own index.

### 2. Classify each file

For each raw file, decide:

- **Architectural observation** → compiles into `knowledge/architecture/<topic>.md`.
- **Feature design** → compiles into `knowledge/features/<slug>.md`.
- **Decision or tradeoff discussion** → triggers the `/write-adr` skill for a new `knowledge/decisions/00NN-<slug>.md`.
- **Mixed / unclear** → leave in raw, ask the user what to do.

### 3. Compile, don't copy-paste

The raw file is usually noisy — transcripts, typos, stray thoughts. The compiled version should be:

- Prose, not bullet soup. Minimum one full paragraph per section.
- Frontmatter with `title`, `created` (today's ISO date), `status: active`, `related`.
- Wikilinks to other vault entries the content references.
- Relative paths to code the content references.
- Short (under 1000 words unless the topic legitimately demands more).

Never include the raw file's contents verbatim. Always rewrite.

### 4. Link into indexes

- `knowledge/architecture/_index.md` — add a bullet pointing at new architecture pages.
- `knowledge/features/_index.md` — add the new feature.
- `knowledge/decisions/_index.md` — add the new ADR entry.

### 5. Preserve or delete the raw file

Ask the user:

- If the raw source is historically valuable (e.g. an interview with a specific person on a specific date), keep it in `raw/` but rename to `YYYY-MM-DD-<slug>.md` if it isn't already.
- If it was pure scratch, delete it.

Never silently delete. Always confirm.

### 6. Commit

Use `docs(knowledge)` scope:

```
docs(knowledge): compile <raw-file> into <target>

Synthesises <topic> from raw notes captured on <date>. Adds a
corresponding entry to the <section> index. The raw file is
[preserved | removed] per user decision.
```

## Style constraints from `knowledge/CLAUDE.md`

- Prose, not bullets. LLMs reading this should understand the reasoning, not just the outline.
- Wikilinks for internal references: `[[target]]` or `[[target|label]]`.
- Frontmatter mandatory. Every new article has `title`, `created`, `updated`, `status`, `related`.
- No orphans. Every article links from at least one index or another article.

## References

- `knowledge/CLAUDE.md` — vault rules.
- `knowledge/raw/_index.md` — drop-zone semantics.
- `/write-adr` — use instead of this skill when the raw content is a decision discussion.
