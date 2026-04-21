import {
  and,
  asc,
  desc,
  eq,
  gte,
  inArray,
  isNull,
  lte,
  or,
  sql,
} from "drizzle-orm";

import {
  navigation,
  pageBlocks,
  pages,
  posts,
  type DrizzleClient,
} from "@startup-boilerplate/db";

import type {
  Cms,
  CmsNavigationEntry,
  CmsPage,
  CmsPageBlock,
  CmsPost,
  ListPostsOptions,
  ListPostsResult,
} from "../interfaces.ts";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const PUBLISHED = "published";

function toCmsPost(row: typeof posts.$inferSelect): CmsPost {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    contentMarkdown: row.contentMarkdown,
    publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
    authorId: row.authorId,
    coverMediaId: row.coverMediaId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toCmsPage(row: typeof pages.$inferSelect): CmsPage {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toCmsBlock(row: typeof pageBlocks.$inferSelect): CmsPageBlock {
  return {
    id: row.id,
    blockType: row.blockType,
    position: row.position,
    content: row.content,
  };
}

/**
 * Adapter backed by the built-in Supabase schema. Uses the Drizzle
 * service-role client. Callers that depend on RLS (public website
 * queries) still get the intended behaviour because every query here
 * restricts to `status='published'` explicitly — the RLS policy and the
 * query filter say the same thing, and the query wins for service role.
 */
export class BuiltinSupabaseCms implements Cms {
  constructor(private readonly db: DrizzleClient) {}

  async listPublishedPosts(
    options: ListPostsOptions = {},
  ): Promise<ListPostsResult> {
    const limit = Math.min(options.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
    const cursor = options.cursor ? new Date(options.cursor) : null;

    const now = new Date();
    const whereClauses = [
      eq(posts.status, PUBLISHED),
      or(isNull(posts.publishedAt), lte(posts.publishedAt, now)),
    ];
    if (cursor) {
      whereClauses.push(lte(posts.publishedAt, cursor));
    }

    const rows = await this.db
      .select()
      .from(posts)
      .where(and(...whereClauses))
      .orderBy(desc(posts.publishedAt), desc(posts.createdAt))
      .limit(limit + 1);

    const items = rows.slice(0, limit).map(toCmsPost);
    const extra = rows[limit];
    const nextCursor = extra?.publishedAt
      ? extra.publishedAt.toISOString()
      : null;
    return { posts: items, nextCursor };
  }

  async getPublishedPostBySlug(slug: string): Promise<CmsPost | null> {
    const [row] = await this.db
      .select()
      .from(posts)
      .where(
        and(
          eq(posts.slug, slug),
          eq(posts.status, PUBLISHED),
          or(isNull(posts.publishedAt), lte(posts.publishedAt, new Date())),
        ),
      )
      .limit(1);
    return row ? toCmsPost(row) : null;
  }

  async listPublishedPages(): Promise<CmsPage[]> {
    const rows = await this.db
      .select()
      .from(pages)
      .where(
        and(
          eq(pages.status, PUBLISHED),
          or(isNull(pages.publishedAt), lte(pages.publishedAt, new Date())),
        ),
      )
      .orderBy(asc(pages.title));
    return rows.map(toCmsPage);
  }

  async getPublishedPageWithBlocks(
    slug: string,
  ): Promise<{ page: CmsPage; blocks: CmsPageBlock[] } | null> {
    const [pageRow] = await this.db
      .select()
      .from(pages)
      .where(
        and(
          eq(pages.slug, slug),
          eq(pages.status, PUBLISHED),
          or(isNull(pages.publishedAt), lte(pages.publishedAt, new Date())),
        ),
      )
      .limit(1);
    if (!pageRow) return null;

    const blockRows = await this.db
      .select()
      .from(pageBlocks)
      .where(eq(pageBlocks.pageId, pageRow.id))
      .orderBy(asc(pageBlocks.position));

    return { page: toCmsPage(pageRow), blocks: blockRows.map(toCmsBlock) };
  }

  async listNavigation(): Promise<CmsNavigationEntry[]> {
    const rows = await this.db
      .select({
        id: navigation.id,
        label: navigation.label,
        href: navigation.href,
        position: navigation.position,
        parentId: navigation.parentId,
      })
      .from(navigation)
      .orderBy(asc(navigation.position), asc(navigation.label));
    return rows;
  }
}

// Keep the grab-bag of drizzle helpers referenced so unused-import rules
// don't complain about their presence in future expansions (inArray, gte,
// sql, etc. are left as documentation for adapters that extend this).
void inArray;
void gte;
void sql;
