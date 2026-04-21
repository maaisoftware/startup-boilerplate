# `packages/docs-engine` — Documentation abstraction

Interface + local vault adapter. Reads markdown from `knowledge/` by default. Parses minimal YAML frontmatter. Alternative adapters (Notion, Confluence) slot in by implementing `DocsEngine`. See ADR 0002.
