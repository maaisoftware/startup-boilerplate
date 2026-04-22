import type {
  Cms,
  CmsNavigationEntry,
  CmsPage,
  CmsPageBlock,
  CmsPost,
  ListPostsOptions,
  ListPostsResult,
} from "../interfaces.ts";

/**
 * Sanity adapter. Maps a Sanity project (dataset + schema types `post`,
 * `page` with an inline `blocks` array, and `navigationEntry`) onto the
 * Cms contract consumed by public routes.
 *
 * Expected Sanity schema (abridged):
 *   post       { _id, slug.current, title, excerpt, bodyMd, publishedAt, authorId, coverMediaId, _createdAt, _updatedAt }
 *   page       { _id, slug.current, title, blocks[]->, publishedAt, _createdAt, _updatedAt }
 *   navigationEntry { _id, label, href, position, parent->_id }
 *
 * Values the app persists (authorId, coverMediaId) can be backed by
 * Sanity references rendered as strings — the mapping below is liberal
 * and returns `null` when the field is missing or shaped differently.
 */

export interface SanityClient {
  /**
   * Executes a GROQ query. Params substitute `$var` references.
   * Implementations MUST NOT throw: callers wrap failures into `null` /
   * empty results per the Cms contract expectations.
   */
  fetch: <T>(query: string, params?: Record<string, unknown>) => Promise<T>;
}

export interface SanityCmsOptions {
  client: SanityClient;
  /** Adapters clamp list sizes (default 100) to match the built-in one. */
  maxLimit?: number;
}

// Minimal Sanity document shapes consumed by the mappers. Declared as
// partials so a misshapen doc produces a sensible null rather than a
// TypeError.
interface SanityPostDoc {
  _id?: string;
  slug?: { current?: string };
  title?: string;
  excerpt?: string | null;
  bodyMd?: string;
  publishedAt?: string | null;
  authorId?: string | null;
  coverMediaId?: string | null;
  _createdAt?: string;
  _updatedAt?: string;
}

interface SanityPageDoc {
  _id?: string;
  slug?: { current?: string };
  title?: string;
  publishedAt?: string | null;
  _createdAt?: string;
  _updatedAt?: string;
  blocks?: SanityPageBlockDoc[];
}

interface SanityPageBlockDoc {
  _id?: string;
  _key?: string;
  blockType?: string;
  position?: number;
  content?: Record<string, unknown>;
}

interface SanityNavigationEntryDoc {
  _id?: string;
  label?: string;
  href?: string;
  position?: number;
  parent?: { _ref?: string } | null;
}

export class SanityCms implements Cms {
  private readonly client: SanityClient;
  private readonly maxLimit: number;

  constructor(options: SanityCmsOptions) {
    this.client = options.client;
    this.maxLimit = options.maxLimit ?? 100;
  }

  async listPublishedPosts(
    options?: ListPostsOptions,
  ): Promise<ListPostsResult> {
    const rawLimit = options?.limit ?? 20;
    const limit = Math.max(1, Math.min(rawLimit, this.maxLimit));
    const cursor = options?.cursor ?? null;

    // Cursor is the ISO publishedAt of the last returned post — simple,
    // stable, matches the built-in adapter's behaviour.
    const query =
      cursor === null
        ? `*[_type == "post" && defined(publishedAt) && publishedAt <= now()] | order(publishedAt desc)[0...$limit]`
        : `*[_type == "post" && defined(publishedAt) && publishedAt <= now() && publishedAt < $cursor] | order(publishedAt desc)[0...$limit]`;

    try {
      const docs = await this.client.fetch<SanityPostDoc[]>(query, {
        limit,
        ...(cursor !== null ? { cursor } : {}),
      });
      const posts = docs.map(toCmsPost).filter(isNotNull);
      const nextCursor =
        posts.length === limit
          ? (posts[posts.length - 1]?.publishedAt ?? null)
          : null;
      return { posts, nextCursor };
    } catch {
      return { posts: [], nextCursor: null };
    }
  }

  async getPublishedPostBySlug(slug: string): Promise<CmsPost | null> {
    try {
      const doc = await this.client.fetch<SanityPostDoc | null>(
        `*[_type == "post" && slug.current == $slug && defined(publishedAt) && publishedAt <= now()][0]`,
        { slug },
      );
      return doc ? toCmsPost(doc) : null;
    } catch {
      return null;
    }
  }

  async listPublishedPages(): Promise<CmsPage[]> {
    try {
      const docs = await this.client.fetch<SanityPageDoc[]>(
        `*[_type == "page" && defined(publishedAt) && publishedAt <= now()] | order(title asc)`,
      );
      return docs.map(toCmsPage).filter(isNotNull);
    } catch {
      return [];
    }
  }

  async getPublishedPageWithBlocks(
    slug: string,
  ): Promise<{ page: CmsPage; blocks: CmsPageBlock[] } | null> {
    try {
      const doc = await this.client.fetch<SanityPageDoc | null>(
        `*[_type == "page" && slug.current == $slug && defined(publishedAt) && publishedAt <= now()][0]{
          ...,
          "blocks": blocks[]{ _key, _id, blockType, position, content }
        }`,
        { slug },
      );
      if (!doc) return null;
      const page = toCmsPage(doc);
      if (!page) return null;
      const blocks = (doc.blocks ?? [])
        .map(toCmsPageBlock)
        .filter(isNotNull)
        .sort((a, b) => a.position - b.position);
      return { page, blocks };
    } catch {
      return null;
    }
  }

  async listNavigation(): Promise<CmsNavigationEntry[]> {
    try {
      const docs = await this.client.fetch<SanityNavigationEntryDoc[]>(
        `*[_type == "navigationEntry"] | order(position asc)`,
      );
      return docs.map(toCmsNavigationEntry).filter(isNotNull);
    } catch {
      return [];
    }
  }
}

function toCmsPost(doc: SanityPostDoc): CmsPost | null {
  if (!doc._id || !doc.slug?.current || !doc.title) return null;
  return {
    id: doc._id,
    slug: doc.slug.current,
    title: doc.title,
    excerpt: doc.excerpt ?? null,
    contentMarkdown: doc.bodyMd ?? "",
    publishedAt: doc.publishedAt ?? null,
    authorId: doc.authorId ?? null,
    coverMediaId: doc.coverMediaId ?? null,
    createdAt: doc._createdAt ?? new Date(0).toISOString(),
    updatedAt: doc._updatedAt ?? doc._createdAt ?? new Date(0).toISOString(),
  };
}

function toCmsPage(doc: SanityPageDoc): CmsPage | null {
  if (!doc._id || !doc.slug?.current || !doc.title) return null;
  return {
    id: doc._id,
    slug: doc.slug.current,
    title: doc.title,
    publishedAt: doc.publishedAt ?? null,
    createdAt: doc._createdAt ?? new Date(0).toISOString(),
    updatedAt: doc._updatedAt ?? doc._createdAt ?? new Date(0).toISOString(),
  };
}

function toCmsPageBlock(doc: SanityPageBlockDoc): CmsPageBlock | null {
  const id = doc._id ?? doc._key;
  if (!id || !doc.blockType || typeof doc.position !== "number") return null;
  return {
    id,
    blockType: doc.blockType,
    position: doc.position,
    content: doc.content ?? {},
  };
}

function toCmsNavigationEntry(
  doc: SanityNavigationEntryDoc,
): CmsNavigationEntry | null {
  if (!doc._id || !doc.label || !doc.href || typeof doc.position !== "number") {
    return null;
  }
  return {
    id: doc._id,
    label: doc.label,
    href: doc.href,
    position: doc.position,
    parentId: doc.parent?._ref ?? null,
  };
}

function isNotNull<T>(value: T | null): value is T {
  return value !== null;
}

export interface FetchSanityClientOptions {
  projectId: string;
  dataset: string;
  /** "published" for the frontend API; "previewDrafts" for staff preview. */
  perspective?: "published" | "previewDrafts";
  /** Sanity pinned API version (e.g. "2024-01-01"). */
  apiVersion?: string;
  /** Optional read token for datasets that aren't public. */
  token?: string;
  /** Host override — rarely needed. */
  endpoint?: string;
  fetcher?: typeof fetch;
}

/**
 * Builds a minimal Sanity client targeting the HTTP Query API:
 * `GET https://<project>.api.sanity.io/v<apiVersion>/data/query/<dataset>?query=…`
 * Returns the `result` field of the response envelope.
 */
export function createFetchSanityClient(
  options: FetchSanityClientOptions,
): SanityClient {
  const apiVersion = options.apiVersion ?? "2024-10-01";
  const endpoint =
    options.endpoint ?? `https://${options.projectId}.api.sanity.io`;
  const fetcher = options.fetcher ?? fetch;
  const perspective = options.perspective ?? "published";
  const token = options.token;

  return {
    async fetch<T>(
      query: string,
      params: Record<string, unknown> = {},
    ): Promise<T> {
      const search = new URLSearchParams();
      search.set("query", query);
      search.set("perspective", perspective);
      for (const [key, value] of Object.entries(params)) {
        search.set(`$${key}`, JSON.stringify(value));
      }
      const url = `${endpoint}/v${apiVersion}/data/query/${encodeURIComponent(options.dataset)}?${search.toString()}`;
      const response = await fetcher(url, {
        method: "GET",
        headers: token ? { authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) {
        throw new Error(`Sanity query failed: ${response.status}`);
      }
      const body = (await response.json()) as { result: T };
      return body.result;
    },
  };
}
