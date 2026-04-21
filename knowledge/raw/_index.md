---
title: Raw notes (drop zone)
created: 2026-04-20
updated: 2026-04-20
status: active
related: [../_index]
---

# Raw notes

Drop zone for unstructured content that needs to be compiled into the wiki.

## What lives here

- Meeting notes.
- Research dumps.
- Transcripts from interviews or user sessions.
- Stream-of-consciousness brainstorming that hasn't been organised yet.

## What happens to it

The `sync-knowledge` skill reads files in this folder and:

1. Extracts coherent topics.
2. Writes them into `architecture/`, `features/`, or `decisions/` as appropriate.
3. Links back to the raw source when relevant.
4. Leaves the raw file as historical record, or prompts you to delete it.

## Guidelines

- Date the file name: `2026-04-20-meeting-notes.md`.
- Frontmatter is optional for raw notes.
- Don't optimise — this is a draft zone.
- Move compiled content out regularly. A stale `raw/` becomes noise.
