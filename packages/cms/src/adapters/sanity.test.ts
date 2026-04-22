import { describe, expect, it, vi } from "vitest";

import { runCmsContract } from "../contract.ts";
import {
  createFetchSanityClient,
  SanityCms,
  type SanityClient,
} from "./sanity.ts";

// ---------- In-memory stub client backing the contract suite ----------

interface SeededPost {
  _id: string;
  _type: "post";
  slug: { current: string };
  title: string;
  excerpt: string | null;
  bodyMd: string;
  publishedAt: string;
  authorId: string | null;
  coverMediaId: string | null;
  _createdAt: string;
  _updatedAt: string;
}

interface SeededPage {
  _id: string;
  _type: "page";
  slug: { current: string };
  title: string;
  publishedAt: string;
  _createdAt: string;
  _updatedAt: string;
  blocks: SeededBlock[];
}

interface SeededBlock {
  _id: string;
  blockType: string;
  position: number;
  content: Record<string, unknown>;
}

interface SeededNav {
  _id: string;
  _type: "navigationEntry";
  label: string;
  href: string;
  position: number;
  parent: { _ref: string } | null;
}

function seededDataset(): {
  posts: SeededPost[];
  pages: SeededPage[];
  nav: SeededNav[];
} {
  return {
    posts: [
      {
        _id: "p1",
        _type: "post",
        slug: { current: "hello-world" },
        title: "Hello, World",
        excerpt: "First post",
        bodyMd: "# Hello\nBody",
        publishedAt: "2026-01-01T00:00:00Z",
        authorId: "user_1",
        coverMediaId: null,
        _createdAt: "2025-12-01T00:00:00Z",
        _updatedAt: "2025-12-02T00:00:00Z",
      },
      {
        _id: "p2",
        _type: "post",
        slug: { current: "second" },
        title: "Second",
        excerpt: null,
        bodyMd: "body",
        publishedAt: "2025-12-15T00:00:00Z",
        authorId: null,
        coverMediaId: null,
        _createdAt: "2025-12-10T00:00:00Z",
        _updatedAt: "2025-12-15T00:00:00Z",
      },
    ],
    pages: [
      {
        _id: "pg1",
        _type: "page",
        slug: { current: "about" },
        title: "About",
        publishedAt: "2026-01-01T00:00:00Z",
        _createdAt: "2025-11-01T00:00:00Z",
        _updatedAt: "2025-11-02T00:00:00Z",
        blocks: [
          {
            _id: "b1",
            blockType: "hero",
            position: 1,
            content: { heading: "Hi" },
          },
          {
            _id: "b2",
            blockType: "text",
            position: 2,
            content: { md: "body" },
          },
        ],
      },
    ],
    nav: [
      {
        _id: "n1",
        _type: "navigationEntry",
        label: "Home",
        href: "/",
        position: 1,
        parent: null,
      },
      {
        _id: "n2",
        _type: "navigationEntry",
        label: "About",
        href: "/about",
        position: 2,
        parent: null,
      },
    ],
  };
}

function makeStubClient(): SanityClient {
  const data = seededDataset();
  const fetchImpl = (
    query: string,
    params?: Record<string, unknown>,
  ): Promise<unknown> => {
    if (query.includes('_type == "post" && slug.current == $slug')) {
      const slug = params?.["slug"];
      const post = data.posts.find((p) => p.slug.current === slug) ?? null;
      return Promise.resolve(post);
    }
    if (query.includes('_type == "post"')) {
      const limit = Number(params?.["limit"] ?? 20);
      const cursor = (params?.["cursor"] as string | undefined) ?? null;
      const filtered = cursor
        ? data.posts.filter((p) => p.publishedAt < cursor)
        : data.posts;
      const sorted = [...filtered].sort((a, b) =>
        b.publishedAt.localeCompare(a.publishedAt),
      );
      return Promise.resolve(sorted.slice(0, limit));
    }
    if (query.includes('_type == "page" && slug.current == $slug')) {
      const slug = params?.["slug"];
      const page = data.pages.find((p) => p.slug.current === slug) ?? null;
      return Promise.resolve(page);
    }
    if (query.includes('_type == "page"')) {
      return Promise.resolve([...data.pages]);
    }
    if (query.includes('_type == "navigationEntry"')) {
      return Promise.resolve(
        [...data.nav].sort((a, b) => a.position - b.position),
      );
    }
    return Promise.resolve(null);
  };
  return { fetch: vi.fn(fetchImpl) as unknown as SanityClient["fetch"] };
}

runCmsContract("SanityCms", () => new SanityCms({ client: makeStubClient() }));

// ---------- Adapter-specific behaviour ----------

describe("SanityCms specifics", () => {
  it("clamps listPublishedPosts limit to maxLimit", async () => {
    const client = makeStubClient();
    const cms = new SanityCms({ client, maxLimit: 1 });
    const result = await cms.listPublishedPosts({ limit: 50 });
    expect(result.posts.length).toBeLessThanOrEqual(1);
  });

  it("returns nextCursor when the page is full", async () => {
    const client = makeStubClient();
    const cms = new SanityCms({ client });
    const result = await cms.listPublishedPosts({ limit: 1 });
    expect(result.nextCursor).toBe("2026-01-01T00:00:00Z");
  });

  it("returns null nextCursor when the page is not full", async () => {
    const client = makeStubClient();
    const cms = new SanityCms({ client });
    const result = await cms.listPublishedPosts({ limit: 50 });
    expect(result.nextCursor).toBeNull();
  });

  it("listPublishedPosts returns empty on client error", async () => {
    const client: SanityClient = {
      fetch: vi.fn((): Promise<never> => Promise.reject(new Error("down"))),
    };
    const cms = new SanityCms({ client });
    await expect(cms.listPublishedPosts()).resolves.toEqual({
      posts: [],
      nextCursor: null,
    });
  });

  it("getPublishedPostBySlug returns null on client error", async () => {
    const client: SanityClient = {
      fetch: vi.fn((): Promise<never> => Promise.reject(new Error("down"))),
    };
    const cms = new SanityCms({ client });
    await expect(cms.getPublishedPostBySlug("any")).resolves.toBeNull();
  });

  it("drops post docs missing required fields", async () => {
    const client: SanityClient = {
      fetch: vi.fn(
        (): Promise<unknown[]> =>
          Promise.resolve([
            { _id: "p", slug: { current: "x" }, title: "T" },
            { _id: "", slug: { current: "y" }, title: "T" },
            { slug: { current: "z" }, title: "T" },
            { _id: "p2", title: "T" },
            { _id: "p3", slug: { current: "w" } },
          ]),
      ) as unknown as SanityClient["fetch"],
    };
    const cms = new SanityCms({ client });
    const { posts } = await cms.listPublishedPosts();
    expect(posts.map((p) => p.slug)).toEqual(["x"]);
  });

  it("listPublishedPages returns empty on error", async () => {
    const client: SanityClient = {
      fetch: vi.fn((): Promise<never> => Promise.reject(new Error("x"))),
    };
    await expect(
      new SanityCms({ client }).listPublishedPages(),
    ).resolves.toEqual([]);
  });

  it("getPublishedPageWithBlocks sorts blocks by position", async () => {
    const client = makeStubClient();
    const cms = new SanityCms({ client });
    const result = await cms.getPublishedPageWithBlocks("about");
    expect(result?.blocks.map((b) => b.position)).toEqual([1, 2]);
  });

  it("getPublishedPageWithBlocks returns null on error", async () => {
    const client: SanityClient = {
      fetch: vi.fn((): Promise<never> => Promise.reject(new Error("x"))),
    };
    await expect(
      new SanityCms({ client }).getPublishedPageWithBlocks("any"),
    ).resolves.toBeNull();
  });

  it("getPublishedPageWithBlocks returns null for unknown page", async () => {
    const client = makeStubClient();
    const cms = new SanityCms({ client });
    await expect(
      cms.getPublishedPageWithBlocks("missing-page-xyz"),
    ).resolves.toBeNull();
  });

  it("listNavigation returns empty on error", async () => {
    const client: SanityClient = {
      fetch: vi.fn((): Promise<never> => Promise.reject(new Error("x"))),
    };
    await expect(new SanityCms({ client }).listNavigation()).resolves.toEqual(
      [],
    );
  });

  it("listNavigation maps parent ref to parentId", async () => {
    const client: SanityClient = {
      fetch: vi.fn(
        (): Promise<unknown[]> =>
          Promise.resolve([
            {
              _id: "n1",
              label: "Parent",
              href: "/",
              position: 1,
              parent: null,
            },
            {
              _id: "n2",
              label: "Child",
              href: "/c",
              position: 2,
              parent: { _ref: "n1" },
            },
          ]),
      ) as unknown as SanityClient["fetch"],
    };
    const cms = new SanityCms({ client });
    const entries = await cms.listNavigation();
    expect(entries).toEqual([
      { id: "n1", label: "Parent", href: "/", position: 1, parentId: null },
      { id: "n2", label: "Child", href: "/c", position: 2, parentId: "n1" },
    ]);
  });
});

describe("createFetchSanityClient", () => {
  it("GETs the Sanity Query API with query + params + perspective", async () => {
    const fetcher = vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify({ result: [{ _id: "x" }] }), {
          status: 200,
        }),
      ),
    );
    const client = createFetchSanityClient({
      projectId: "proj-123",
      dataset: "production",
      apiVersion: "2024-10-01",
      token: "t-abc",
      fetcher,
    });
    const result = await client.fetch<{ _id: string }[]>(
      `*[_type == "post"][0...$limit]`,
      { limit: 5 },
    );
    expect(result).toEqual([{ _id: "x" }]);
    const [url, init] = fetcher.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toContain(
      "https://proj-123.api.sanity.io/v2024-10-01/data/query/production?",
    );
    expect(url).toContain("perspective=published");
    expect(url).toContain("%24limit=5"); // $limit=5 URL-encoded
    expect((init.headers as Record<string, string>)["authorization"]).toBe(
      "Bearer t-abc",
    );
  });

  it("omits the Authorization header when no token is provided", async () => {
    const fetcher = vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify({ result: null }), { status: 200 }),
      ),
    );
    const client = createFetchSanityClient({
      projectId: "p",
      dataset: "d",
      fetcher,
    });
    await client.fetch("*[_type == 'x'][0]");
    const [, init] = fetcher.mock.calls[0] as unknown as [string, RequestInit];
    const headers = (init.headers as Record<string, string>) ?? {};
    expect(headers["authorization"]).toBeUndefined();
  });

  it("throws on non-2xx", async () => {
    const fetcher = vi.fn(() =>
      Promise.resolve(new Response("", { status: 500 })),
    );
    const client = createFetchSanityClient({
      projectId: "p",
      dataset: "d",
      fetcher,
    });
    await expect(client.fetch("*")).rejects.toThrow(/500/);
  });
});
