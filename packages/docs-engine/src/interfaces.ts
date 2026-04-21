/** Docs-engine abstraction. Adapters read from a source (vault/Notion/Confluence). */

export interface DocEntry {
  /** Slug derived from file path relative to the docs root, without extension. */
  slug: string;
  title: string;
  body: string;
  frontmatter: Record<string, unknown>;
  updatedAt: string;
}

export interface DocsEngine {
  list(): Promise<DocEntry[]>;
  get(slug: string): Promise<DocEntry | null>;
}
