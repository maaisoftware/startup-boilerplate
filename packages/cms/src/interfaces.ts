/**
 * CMS contract.
 *
 * Reads the blog and page content that powers public-facing routes.
 * Adapter impls keep their own data-source details internal — consumers
 * only depend on this shape. The default adapter is the built-in
 * Supabase table layout from `packages/db`.
 *
 * Write paths (create/update/publish) are intentionally scoped to staff
 * routes; they live in the API proxy (apps/web) where auth + RBAC +
 * audit-log get plumbed in uniformly. Adding them to the interface here
 * is a future extension, driven by an ADR.
 */

export interface CmsPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  contentMarkdown: string;
  publishedAt: string | null;
  authorId: string | null;
  coverMediaId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CmsPage {
  id: string;
  slug: string;
  title: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CmsPageBlock {
  id: string;
  blockType: string;
  position: number;
  content: Record<string, unknown>;
}

export interface CmsNavigationEntry {
  id: string;
  label: string;
  href: string;
  position: number;
  parentId: string | null;
}

export interface ListPostsOptions {
  /** Max posts to return. Adapters clamp to a reasonable max (≤100). */
  limit?: number;
  /** Cursor (opaque adapter-specific token) for pagination. */
  cursor?: string | null;
}

export interface ListPostsResult {
  posts: CmsPost[];
  nextCursor: string | null;
}

export interface Cms {
  listPublishedPosts(options?: ListPostsOptions): Promise<ListPostsResult>;
  getPublishedPostBySlug(slug: string): Promise<CmsPost | null>;
  listPublishedPages(): Promise<CmsPage[]>;
  getPublishedPageWithBlocks(
    slug: string,
  ): Promise<{ page: CmsPage; blocks: CmsPageBlock[] } | null>;
  listNavigation(): Promise<CmsNavigationEntry[]>;
}
